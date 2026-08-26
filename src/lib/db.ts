// Database client — uses Prisma in server mode.
// In static export mode, this file is imported but never called at runtime
// (client-db.ts handles all data via IndexedDB).
// The try/catch prevents crashes during static build when Prisma can't initialize.
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaClient: PrismaClient | null = null;

try {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prismaClient = globalForPrisma.prisma;
} catch (e) {
  // During static export, Prisma can't initialize (no database).
  // This is fine — in static mode, the app uses client-db.ts instead.
  console.warn('Prisma client initialization skipped (static build mode)');
}

// Export a proxy that silently no-ops if prismaClient is null
export const db = prismaClient ?? (new Proxy({} as PrismaClient, {
  get() {
    return () => Promise.resolve(null);
  }
}) as PrismaClient);

if (process.env.NODE_ENV !== 'production' && prismaClient) {
  globalForPrisma.prisma = prismaClient;
}
