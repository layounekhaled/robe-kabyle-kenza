import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Vercel serverless: use /tmp for SQLite (writable at runtime)
// For local dev: use the standard prisma/db/ path
function getDatabaseUrl(): string {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  // On Vercel (serverless), copy DB to /tmp for read/write access
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/custom.db'
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')

    // Copy DB to /tmp if not already there
    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, tmpDbPath)
        }
      } catch (e) {
        // DB might not exist yet, will be created by db push
      }
    }

    return `file:${tmpDbPath}`
  }

  // Default: relative path from prisma directory
  return 'file:./db/custom.db'
}

const databaseUrl = getDatabaseUrl()

// Set DATABASE_URL env var so Prisma picks it up
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
    const count = await db.product.count()
    if (count === 0) {
      console.log('🌱 Auto-seeding database (serverless cold start)...')
      const { execSync } = await import('child_process')
      // Set DATABASE_URL for the seed script too
      process.env.DATABASE_URL = databaseUrl
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
