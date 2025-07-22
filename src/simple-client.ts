import { pushTimeseries } from 'prometheus-remote-write';

// Configuration
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Function to generate sample metrics with timestamps and labels
function generateMetrics(): any[] {
  const timestamp = Date.now();
  
  return [
    {
      labels: {
        __name__: 'demo_counter_total',
        service: 'demo-service',
        environment: 'development'
      },
      samples: [
        {
          value: Math.floor(Math.random() * 100) + 1,
          timestamp
        }
      ]
    },
    {
      labels: {
        __name__: 'demo_gauge',
        service: 'demo-service',
        environment: 'development'
      },
      samples: [
        {
          value: Math.random() * 100,
          timestamp
        }
      ]
    },
    {
      labels: {
        __name__: 'demo_duration_seconds',
        service: 'demo-service',
        operation: 'demo-operation'
      },
      samples: [
        {
          value: Math.random() * 3,
          timestamp
        }
      ]
    },
    {
      labels: {
        __name__: 'custom_metric',
        service: 'demo-service',
        type: 'test',
        version: '1.0.0'
      },
      samples: [
        {
          value: 42.0,
          timestamp
        }
      ]
    },
    {
      labels: {
        __name__: 'http_requests_total',
        service: 'demo-service',
        method: 'GET',
        status: '200'
      },
      samples: [
        {
          value: Math.floor(Math.random() * 1000),
          timestamp
        }
      ]
    },
    {
      labels: {
        __name__: 'http_request_duration_seconds',
        service: 'demo-service',
        method: 'POST',
        endpoint: '/api/v1/write'
      },
      samples: [
        {
          value: Math.random() * 2,
          timestamp
        }
      ]
    }
  ];
}

// Function to send metrics to Prometheus
export async function sendMetricsToPrometheus(): Promise<void> {
  try {
    const timeseries = generateMetrics();
    
    console.log(`📤 Sending ${timeseries.length} timeseries to Prometheus...`);
    timeseries.forEach((series, index) => {
      const metricName = series.labels.__name__;
      const labels = Object.keys(series.labels)
        .filter(k => k !== '__name__')
        .map(k => `${k}="${series.labels[k]}"`)
        .join(', ');
      const value = series.samples[0].value;
      const timestamp = new Date(series.samples[0].timestamp).toISOString();
      
      console.log(`   ${index + 1}. ${metricName}${labels ? `{${labels}}` : ''} = ${value} @ ${timestamp}`);
    });
    
    // Send metrics using the prometheus-remote-write package
    await pushTimeseries(timeseries, {
      url: `${PROMETHEUS_URL}/api/v1/write`,
      headers: {
        'X-Prometheus-Remote-Write-Version': '0.1.0'
      }
    });
    
    console.log(`✅ Metrics sent to Prometheus at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`❌ Failed to send metrics to Prometheus: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to generate and send metrics
export async function generateAndSendMetrics(): Promise<void> {
  await sendMetricsToPrometheus();
} 