import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const SUPER_ADMIN_EMAIL = "vitastahub@gmail.com";

let trackingSchemaReady = false;
export async function ensureTrackingSchema() {
  if (trackingSchemaReady) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastVisitedAt" TIMESTAMP(3);`
    );
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "DailyStat" (
        "date" TEXT NOT NULL PRIMARY KEY,
        "registeredVisits" INTEGER NOT NULL DEFAULT 0,
        "guestVisits" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
    );
    trackingSchemaReady = true;
  } catch {}
}

export function getIstDateStr(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
