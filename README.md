# CIDR-Substract

A Cloudflare Workers application that performs IPv4 CIDR range subtraction operations. Enter two CIDR ranges, and the tool will automatically subtract the smaller range from the larger one, displaying the optimized remaining IP ranges.

**Published at:  https://cidr-substract.vnkr.workers.dev**

## Features

- **CIDR Range Subtraction**: Automatically detects which range is larger and subtracts the smaller range from it
- **Optimized Results**: Aggregates and minimizes the number of output CIDR blocks for efficient network configuration
- **Copy to Clipboard**: One-click copy functionality to easily export results
- **Real-time Validation**: Validates CIDR notation as you type
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Performance**: Built on Cloudflare Workers for near-instant responses worldwide

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd CIDR-Substract

# Install dependencies
npm install
```

### Development

```bash
# Start local development server
npm run dev

# Open http://localhost:8787 in your browser
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## Usage

1. Enter the first CIDR range in the format `xxx.xxx.xxx.xxx/xx` (e.g., `192.168.0.0/16`)
2. Enter the second CIDR range (e.g., `192.168.1.0/24`)
3. Click "Subtract Ranges"
4. View the optimized remaining CIDR blocks
5. Click "Copy" to copy all results to your clipboard

### Example Use Cases

**Example 1: Removing a subnet from a larger network**
- Input: `192.168.0.0/16` and `192.168.1.0/24`
- Output: 8 optimized CIDR blocks representing the /16 network minus the /24 subnet

**Example 2: Simple subnet splitting**
- Input: `10.0.0.0/24` and `10.0.0.128/25`
- Output: `10.0.0.0/25` (the first half of the /24 network)

**Example 3: Firewall rule optimization**
- Input: `172.16.0.0/20` and `172.16.5.0/24`
- Output: Optimized CIDR blocks excluding the specific subnet

## How It Works

1. **Validation**: Both CIDR ranges are validated for correct IPv4 format
2. **Overlap Detection**: The system checks if the ranges overlap
3. **Size Comparison**: Determines which range is larger
4. **Subtraction**: Calculates the IP addresses in the larger range that are not in the smaller range
5. **Aggregation**: Converts the remaining IPs into the minimum number of CIDR blocks
6. **Display**: Shows the optimized results with copy functionality

## API

The application exposes a REST API endpoint for programmatic access:

### POST /api/subtract

**Request:**
```json
{
  "cidr1": "192.168.0.0/16",
  "cidr2": "192.168.1.0/24"
}
```

**Response:**
```json
{
  "success": true,
  "result": [
    "192.168.0.0/24",
    "192.168.2.0/23",
    "192.168.4.0/22",
    "192.168.8.0/21",
    "192.168.16.0/20",
    "192.168.32.0/19",
    "192.168.64.0/18",
    "192.168.128.0/17"
  ],
  "message": "Subtraction complete. 8 remaining range(s)."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid CIDR notation for first range: 192.168.0.0/33"
}
```

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Build Tool**: Wrangler (Cloudflare Workers CLI)

## Project Structure

```
├── src/
│   ├── index.ts       # Main Worker entry point and API handler
│   └── cidr.ts        # CIDR calculation and subtraction algorithms
├── public/
│   ├── index.html     # Frontend interface
│   ├── styles.css     # Styling
│   └── app.js         # Client-side logic
├── wrangler.jsonc     # Cloudflare Workers configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
```

## Development

### Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build and validate (dry run)
- `npm run deploy` - Deploy to Cloudflare Workers

### Testing

Test the API endpoint locally:

```bash
curl -X POST http://localhost:8787/api/subtract \
  -H "Content-Type: application/json" \
  -d '{"cidr1":"192.168.0.0/16","cidr2":"192.168.1.0/24"}'
```

## Algorithm

The CIDR subtraction algorithm:

1. **Parse CIDR**: Convert CIDR notation to start/end IP integers
2. **Validate Overlap**: Check if ranges intersect
3. **Identify Containment**: Ensure one range fully contains the other
4. **Calculate Gaps**: Compute IP ranges before and after the subtracted range
5. **Optimize Blocks**: Convert IP ranges to minimal CIDR blocks using alignment and size constraints
6. **Aggregate**: Merge adjacent CIDR blocks to minimize output

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

