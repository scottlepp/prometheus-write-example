import * as promClient from 'prom-client';
import axios from 'axios';
import * as snappy from 'snappy';
import * as protobuf from 'protobufjs';

// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const customCounter = new promClient.Counter({
  name: 'demo_counter_total',
  help: 'A demo counter that increments over time',
  labelNames: ['service', 'environment']
});

const customGauge = new promClient.Gauge({
  name: 'demo_gauge',
  help: 'A demo gauge that fluctuates',
  labelNames: ['service', 'environment']
});

const customHistogram = new promClient.Histogram({
  name: 'demo_duration_seconds',
  help: 'A demo histogram of durations',
  labelNames: ['service', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Register metrics
register.registerMetric(customCounter);
register.registerMetric(customGauge);
register.registerMetric(customHistogram);

// Configuration
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Prometheus remote-write protobuf schema
const prometheusProto = `
syntax = "proto3";

message WriteRequest {
  repeated TimeSeries timeseries = 1;
}

message TimeSeries {
  repeated Label labels = 1;
  repeated Sample samples = 2;
}

message Label {
  string name = 1;
  string value = 2;
}

message Sample {
  double value = 1;
  int64 timestamp = 2;
}
`;

// Load protobuf schema
const root = protobuf.parse(prometheusProto).root;
const WriteRequest = root.lookupType("WriteRequest");

// Function to convert prom-client metrics to remote-write format
async function metricsToRemoteWrite(): Promise<Buffer> {
  const metrics = await register.metrics();
  const lines = metrics.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const timeseries: any[] = [];
  const timestamp = Date.now();
  
  for (const line of lines) {
    const match = line.match(/^(\w+)(\{[^}]*\})?\s+([0-9.]+)/);
    if (match) {
      const [, name, labelsStr, value] = match;
      if (name && value) {
        const labels: any[] = [
          { name: '__name__', value: name }
        ];
        
        if (labelsStr) {
          const labelMatches = labelsStr.match(/(\w+)="([^"]*)"/g);
          if (labelMatches) {
            for (const labelMatch of labelMatches) {
              const labelMatchResult = labelMatch.match(/(\w+)="([^"]*)"/);
              if (labelMatchResult) {
                const [, labelName, labelValue] = labelMatchResult;
                if (labelName && labelValue) {
                  labels.push({ name: labelName, value: labelValue });
                }
              }
            }
          }
        }
        
        timeseries.push({
          labels,
          samples: [{ value: parseFloat(value), timestamp }]
        });
      }
    }
  }
  
  // Create protobuf message
  const writeRequest = { timeseries };
  
  // Validate and encode
  const errMsg = WriteRequest.verify(writeRequest);
  if (errMsg) {
    throw new Error(`Protobuf validation failed: ${errMsg}`);
  }
  
  const message = WriteRequest.create(writeRequest);
  const buffer = WriteRequest.encode(message).finish();
  
  // Compress with snappy
  return await snappy.compress(buffer);
}

// Remote write function
export async function sendMetricsToPrometheus(): Promise<void> {
  try {
    const compressedData = await metricsToRemoteWrite();
    
    // Send metrics to Prometheus remote-write endpoint
    const response = await axios.post(
      `${PROMETHEUS_URL}/api/v1/write`, 
      compressedData, 
      {
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Content-Encoding': 'snappy',
          'X-Prometheus-Remote-Write-Version': '0.1.0'
        },
        timeout: 5000
      }
    );
    
    console.log(`✅ Metrics sent to Prometheus at ${new Date().toISOString()}`);
    console.log(`   Response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Failed to send metrics to Prometheus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data: ${error.response.data}`);
    }
  }
}

// Function to update metrics
export function updateMetrics(): void {
  // Increment counter
  customCounter.labels('demo-service', 'development').inc();
  
  // Update gauge with random value
  const gaugeValue = Math.random() * 100;
  customGauge.labels('demo-service', 'development').set(gaugeValue);
  
  // Observe histogram with random duration
  const duration = Math.random() * 3;
  customHistogram.labels('demo-service', 'demo-operation').observe(duration);
  
  console.log(`📊 Updated metrics - Gauge: ${gaugeValue.toFixed(2)}, Duration: ${duration.toFixed(2)}s`);
}

// Function to generate and send metrics
export async function generateAndSendMetrics(): Promise<void> {
  updateMetrics();
  await sendMetricsToPrometheus();
}

export { register }; 