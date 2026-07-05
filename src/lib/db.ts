import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always use SQLite - force the correct path regardless of DATABASE_URL env var
function getDatabaseUrl(): string {
  // On Vercel (serverless), use /tmp for SQLite (writable at runtime)
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/custom.db'
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')

    // Copy DB to /tmp if not already there
    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, tmpDbPath)
          console.log('📦 Copied DB to /tmp for Vercel serverless')
        } else {
          console.log('📦 No source DB found, will be created by seed')
        }
      } catch (e) {
        console.error('Failed to copy DB to /tmp:', e)
      }
    }

    return `file:${tmpDbPath}`
  }

  // Local development: use the standard prisma/db/ path
  return 'file:./db/custom.db'
}

const databaseUrl = getDatabaseUrl()

// CRITICAL: Override DATABASE_URL env var so Prisma uses our SQLite path
// This is needed because Vercel may have a PostgreSQL DATABASE_URL set
process.env.DATABASE_URL = databaseUrl

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Auto-seed on cold start (for serverless environments like Vercel)
let _seeded = false
export async function ensureSeeded() {
  if (_seeded) return
  try {
    // Ensure DATABASE_URL points to our SQLite
    process.env.DATABASE_URL = databaseUrl

    const count = await db.product.count()
    if (count === 0) {
      console.log('🌱 Auto-seeding database (serverless cold start)...')
      const { execSync } = await import('child_process')
      execSync('node scripts/seed.mjs', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      })
    }
    _seeded = true
  } catch (e) {
    console.error('Auto-seed failed:', e)
  }
}
