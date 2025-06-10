import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
} 