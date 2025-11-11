# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CIDR-Substract is a Cloudflare Workers site that helps users subtract IP address subranges from CIDR ranges.

**Functionality**: A single-page website with two input fields accepting IPv4 ranges. When there's an overlap, it subtracts the smaller range from the larger one and displays the resulting remaining ranges on the page.

## Project Status

✅ **Implementation Complete** - The project is now fully implemented with a working frontend and backend.

## Development Platform

- **Target Platform**: Cloudflare Workers
- **Primary Focus**: IPv4 CIDR range manipulation and subtraction
- **Language**: TypeScript
- **Framework**: Vanilla JavaScript for frontend

## Development Commands

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
# or
wrangler dev
```
This starts a local development server (typically on http://localhost:8787)

### Build (Dry Run)
```bash
npm run build
# or
wrangler deploy --dry-run
```

### Deploy to Cloudflare Workers
```bash
npm run deploy
# or
wrangler deploy
```

## Project Architecture

### Directory Structure
```
├── src/
│   ├── index.ts       # Main Cloudflare Worker entry point
│   └── cidr.ts        # CIDR utility functions and algorithms
├── public/
│   ├── index.html     # Frontend HTML
│   ├── styles.css     # CSS styling
│   └── app.js         # Client-side JavaScript
├── wrangler.jsonc     # Cloudflare Workers configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies
```

### Key Components

#### Backend (src/index.ts)
- Serves static assets from the `public/` directory
- Provides `/api/subtract` endpoint for CIDR subtraction
- Handles request validation and error responses
- Uses Workers Static Assets binding

#### CIDR Library (src/cidr.ts)
Core algorithms include:
- `ipToInt()`: Convert IPv4 address to 32-bit integer
- `intToIp()`: Convert 32-bit integer back to IPv4 address
- `parseCIDR()`: Parse CIDR notation (e.g., "192.168.1.0/24")
- `rangeToCIDRs()`: Convert IP range to optimal CIDR blocks
- `subtractCIDR()`: Main algorithm that subtracts smaller range from larger range

#### Frontend (public/)
- Single-page application with two CIDR input fields
- Real-time validation
- Example CIDR ranges for quick testing
- Responsive design

## How It Works

1. User enters two CIDR ranges in the frontend
2. Client-side JavaScript validates format and sends POST request to `/api/subtract`
3. Worker validates CIDR notation and checks for overlap
4. If ranges overlap, the smaller range is subtracted from the larger one
5. Result is converted back to optimal CIDR blocks
6. Frontend displays the remaining CIDR ranges

## Example Usage

**Input:**
- CIDR 1: `192.168.0.0/16`
- CIDR 2: `192.168.1.0/24`

**Output:**
Multiple CIDR blocks representing 192.168.0.0/16 minus 192.168.1.0/24
