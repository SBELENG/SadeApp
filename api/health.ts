import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from './_lib/cors';
import prisma from './_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbStatus = 'OK';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'ERROR';
  }

  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SADE API',
    databaseConnection: dbStatus,
    environment: process.env.NODE_ENV ?? 'unknown',
  });
}
