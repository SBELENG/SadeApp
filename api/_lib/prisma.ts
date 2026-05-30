import { PrismaClient } from '@prisma/client';

// Singleton para evitar múltiples conexiones en entorno serverless
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

const prisma = global._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global._prisma = prisma;
}

export default prisma;
