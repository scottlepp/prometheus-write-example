import axios from 'axios';
import { generateAndSendMetrics } from './simple-client';

interface PrometheusResponse {
  status: string;
  data: {
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
  error?: string;
}

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

async function queryPrometheus(query: string, name: string): Promise<void> {
  try {
    console.log(`🔍 Querying: ${name}`);
    console.log(`   Query: ${query}`);
    
    const response = await axios.get<PrometheusResponse>(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query },
      timeout: 10000
    });
    
    const { data } = response;
    
    if (data.status === 'success') {
      console.log(`   ✅ Status: ${data.status}`);
      
      if (data.data.result && data.data.result.length > 0) {
        console.log(`   📊 Found ${data.data.result.length} result(s):`);
        data.data.result.forEach((result, index) => {
          const labels = Object.keys(result.metric)
            .filter(k => k !== '__name__')
            .map(k => `${k}="${result.metric[k]}"`)
            .join(', ');
          
          const metricName = result.metric.__name__ || 'unknown';
          const value = result.value[1];
          const timestamp = new Date(parseInt(result.value[0].toString()) * 1000).toISOString();
          
          console.log(`      ${index + 1}. ${metricName}${labels ? `{${labels}}` : ''} = ${value} @ ${timestamp}`);
        });
      } else {
        console.log(`   ⚠️  No data found for this query`);
      }
    } else {
      console.log(`   ❌ Query failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`   ❌ Error querying Prometheus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`      Status: ${error.response.status}`);
      console.error(`      Data: ${error.response.data}`);
    }
  }
}

async function getPrometheusStatus(): Promise<boolean> {
  try {
    console.log('🔍 Checking Prometheus status...');
    const response = await axios.get(`${PROMETHEUS_URL}/-/healthy`, { timeout: 5000 });
    console.log(`✅ Prometheus is healthy (${response.status})`);
    return true;
  } catch (error) {
    console.error(`❌ Prometheus is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log('🚀 Enhanced Prometheus Remote Write Test');
  console.log(`📍 Prometheus URL: ${PROMETHEUS_URL}`);
  console.log('=' .repeat(50));
  
  // Check if Prometheus is accessible
  const isHealthy = await getPrometheusStatus();
  if (!isHealthy) {
    console.log('\n💡 Make sure Prometheus is running and accessible.');
    console.log('   You can start it with: docker-compose up -d');
    process.exit(1);
  }
  
  // Generate and send metrics
  console.log('\n📤 Generating and sending metrics...');
  await generateAndSendMetrics();
  
  // Wait a moment for metrics to be processed
  console.log('\n⏳ Waiting for metrics to be processed...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run multiple queries
  console.log('\n📈 Running queries...');
  
  const queries = [
    { query: 'demo_counter_total', name: 'Demo Counter' },
    { query: 'demo_gauge', name: 'Demo Gauge' },
    { query: 'http_requests_total', name: 'HTTP Requests' },
    { query: 'http_request_duration_seconds', name: 'HTTP Request Duration' },
    { query: 'custom_metric', name: 'Custom Metric' }
  ];
  
  for (const queryInfo of queries) {
    await queryPrometheus(queryInfo.query, queryInfo.name);
    console.log(''); // Add spacing between queries
  }
  
  console.log('✨ Test completed!');
  console.log('\n💡 Tips:');
  console.log('   - Visit http://localhost:9090 for Prometheus UI');
  console.log('   - Run this test again to see updated values');
  console.log('   - Try queries like: demo_counter_total{service="demo-service"}');
}

main().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 