import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Aplica headers CORS para todas las Serverless Functions.
 * Uso: if (cors(req, res)) return;
 */
export function cors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? ['*'];
  const origin = req.headers.origin ?? '';

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
