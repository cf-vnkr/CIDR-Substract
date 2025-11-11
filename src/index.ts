/**
 * CIDR Substract - Cloudflare Workers Application
 * Subtracts smaller CIDR ranges from larger ones
 */

import { subtractCIDR, isValidCIDR } from './cidr';

interface Env {
  ASSETS: Fetcher;
}

interface SubtractRequest {
  cidr1: string;
  cidr2: string;
}

interface SubtractResponse {
  success: boolean;
  result?: string[];
  error?: string;
  message?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API endpoint for CIDR subtraction
    if (url.pathname === '/api/subtract' && request.method === 'POST') {
      try {
        const body = await request.json<SubtractRequest>();

        // Validate input
        if (!body.cidr1 || !body.cidr2) {
          return Response.json({
            success: false,
            error: 'Both cidr1 and cidr2 are required'
          } as SubtractResponse, { status: 400 });
        }

        // Validate CIDR notation
        if (!isValidCIDR(body.cidr1)) {
          return Response.json({
            success: false,
            error: `Invalid CIDR notation for first range: ${body.cidr1}`
          } as SubtractResponse, { status: 400 });
        }

        if (!isValidCIDR(body.cidr2)) {
          return Response.json({
            success: false,
            error: `Invalid CIDR notation for second range: ${body.cidr2}`
          } as SubtractResponse, { status: 400 });
        }

        // Perform subtraction
        const result = subtractCIDR(body.cidr1, body.cidr2);

        return Response.json({
          success: true,
          result,
          message: result.length === 0
            ? 'The smaller range completely covers the larger range, leaving no remaining ranges.'
            : `Subtraction complete. ${result.length} remaining range(s).`
        } as SubtractResponse, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

      } catch (error) {
        console.error('CIDR subtraction error:', error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } as SubtractResponse, { status: 500 });
      }
    }

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'healthy',
        service: 'cidr-substract'
      });
    }

    // Serve static assets for all other requests
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
