import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create fresh client each time the module loads (avoids stale schema cache in dev)
if (globalForPrisma.prisma) {
  globalForPrisma.prisma.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const db = new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db