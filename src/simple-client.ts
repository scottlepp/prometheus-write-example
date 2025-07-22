import { pushMetrics } from 'prometheus-remote-write';

// Configuration
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Function to generate sample metrics as Record<string, number>
function generateMetrics(): Record<string, number> {
  return {
    'demo_counter_total': Math.floor(Math.random() * 100) + 1,
    'demo_gauge': Math.random() * 100,
    'demo_duration_seconds': Math.random() * 3,
    'custom_metric': 42.0
  };
}

// Function to send metrics to Prometheus
export async function sendMetricsToPrometheus(): Promise<void> {
  try {
    const metrics = generateMetrics();
    
    console.log(`📤 Sending ${Object.keys(metrics).length} metrics to Prometheus...`);
    Object.entries(metrics).forEach(([name, value]) => {
      console.log(`   - ${name} = ${value}`);
    });
    
    // Send metrics using the prometheus-remote-write package
    await pushMetrics(metrics, {
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