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

async function queryPrometheus(): Promise<void> {
  try {
    console.log('🔍 Querying: Demo Counter');
    console.log('   Query: demo_counter_total');
    
    const response = await axios.get<PrometheusResponse>(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query: 'demo_counter_total' },
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
          
          console.log(`      ${index + 1}. ${metricName}${labels ? `{${labels}}` : ''} = ${value}`);
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
  console.log('🚀 Simple Prometheus Remote Write Test');
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
  
  // Run the query
  console.log('\n📈 Running query...');
  await queryPrometheus();
  
  console.log('\n✨ Test completed!');
  console.log('\n💡 Tips:');
  console.log('   - Visit http://localhost:9090 for Prometheus UI');
  console.log('   - Run this test again to see updated values');
}

main().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 