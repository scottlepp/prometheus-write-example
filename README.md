# Prometheus Remote Write Demo

A TypeScript Node.js project that demonstrates Prometheus remote-write functionality with two different implementations. The project includes clients that generate metrics and send them to Prometheus via remote-write, and test scripts to validate that metrics are being received correctly.

## Features

- **TypeScript**: Full TypeScript support with proper type definitions
- **Two Client Implementations**:
  - **Complex Client**: Uses `prom-client` with custom protobuf encoding
  - **Simple Client**: Uses `prometheus-remote-write` package with JSON metrics
- **Remote Write**: Sends metrics to Prometheus via HTTP POST to `/api/v1/write`
- **Docker Support**: Includes Docker Compose setup for Prometheus
- **Test Scripts**: Validates metrics by querying Prometheus API

## Project Structure

```
├── src/
│   ├── client.ts          # Complex client using prom-client + protobuf
│   ├── test.ts            # Test script for complex client
│   ├── simple-client.ts   # Simple client using prometheus-remote-write
│   └── simple-test.ts     # Test script for simple client
├── docker-compose.yml     # Docker Compose for Prometheus
├── prometheus.yml         # Prometheus configuration
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Prometheus

```bash
docker-compose up -d
```

This will start Prometheus on `http://localhost:9090`.

### 3. Run the Tests

#### Complex Client (prom-client + protobuf)
```bash
npm run test
```

#### Simple Client (prometheus-remote-write package)
```bash
npm run simple
```

Both clients will:
- Generate custom metrics
- Send them to Prometheus via remote-write
- Query Prometheus to verify the metrics were received

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the complex client in development mode
- `npm run start` - Run the compiled complex client
- `npm run test` - Test the complex client (prom-client + protobuf)
- `npm run simple` - Test the simple client (prometheus-remote-write package)
- `npm run watch` - Watch for TypeScript changes and recompile

## Client Implementations

### Complex Client (`src/client.ts`)

Uses `prom-client` library with custom protobuf encoding:

**Features:**
- Full prom-client integration with registry
- Custom protobuf encoding using protobufjs
- Snappy compression
- Default Node.js process metrics included
- Histogram, Counter, and Gauge metrics

**Usage:**
```typescript
import { generateAndSendMetrics } from './client';

// Generate and send metrics
await generateAndSendMetrics();
```

### Simple Client (`src/simple-client.ts`)

Uses `prometheus-remote-write` package with JSON metrics:

**Features:**
- Simple JSON metrics format
- No registry initialization needed
- Uses prometheus-remote-write package
- Clean and minimal implementation

**Usage:**
```typescript
import { generateAndSendMetrics } from './simple-client';

// Generate and send metrics
await generateAndSendMetrics();
```

**Metrics Format:**
```typescript
const metrics = {
  'demo_counter_total': 42,
  'demo_gauge': 23.5,
  'custom_metric': 100
};
```

## Environment Variables

- `PROMETHEUS_URL` - Prometheus server URL (default: `http://localhost:9090`)

## Metrics Generated

Both clients generate the following metrics:

### Custom Metrics
- `demo_counter_total` - A counter with random values
- `demo_gauge` - A gauge that fluctuates
- `demo_duration_seconds` - A duration metric
- `custom_metric` - A static metric (simple client only)

### Default Node.js Metrics (Complex Client Only)
- `process_cpu_seconds_total` - CPU time used by the Node.js process
- `process_resident_memory_bytes` - Resident memory usage
- And many more default metrics from `prom-client`

## Testing

Both test scripts query Prometheus for the `demo_counter_total` metric to verify that remote-write is working correctly.

### Example Output

```
🚀 Simple Prometheus Remote Write Test
📍 Prometheus URL: http://localhost:9090
==================================================
🔍 Checking Prometheus status...
✅ Prometheus is healthy (200)

📤 Generating and sending metrics...
📤 Sending 4 metrics to Prometheus...
   - demo_counter_total = 89
   - demo_gauge = 50.51
   - demo_duration_seconds = 2.29
   - custom_metric = 42
✅ Metrics sent to Prometheus at 2025-07-22T18:47:00.537Z

📈 Running query...
🔍 Querying: Demo Counter
   Query: demo_counter_total
   ✅ Status: success
   📊 Found 1 result(s):
      1. demo_counter_total = 89

✨ Test completed!
```

## Prometheus UI

Once Prometheus is running, you can access the web UI at:
- **URL**: http://localhost:9090
- **Graph**: Navigate to the Graph tab to visualize metrics
- **Status**: View the Status tab for configuration and runtime info

## Example Queries

You can run these queries in the Prometheus UI:

```promql
# Get the latest counter value
demo_counter_total

# Get gauge value
demo_gauge

# Get duration metric
demo_duration_seconds

# Get custom metric
custom_metric
```

## Troubleshooting

### Prometheus Not Accessible
- Ensure Docker Compose is running: `docker-compose ps`
- Check Prometheus logs: `docker-compose logs prometheus`
- Verify the container is healthy: `docker-compose ps`

### No Metrics Received
- Check if the client is running and sending metrics
- Verify the Prometheus URL is correct
- Check network connectivity between client and Prometheus
- Review Prometheus configuration in `prometheus.yml`

### TypeScript Compilation Errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript configuration in `tsconfig.json`
- Verify type definitions are available

## Development

### Adding New Metrics

#### Complex Client
```typescript
// Add new metric to the registry
const newMetric = new promClient.Counter({
  name: 'new_metric_total',
  help: 'Description of the new metric',
  labelNames: ['label1', 'label2']
});

register.registerMetric(newMetric);

// Update the metric
newMetric.labels('value1', 'value2').inc();
```

#### Simple Client
```typescript
// Add to the generateMetrics function
function generateMetrics(): Record<string, number> {
  return {
    // ... existing metrics
    'new_metric_total': Math.random() * 100
  };
}
```

## License

MIT 