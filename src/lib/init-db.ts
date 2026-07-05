import { db } from './db'
import path from 'path'
import fs from 'fs'

/**
 * Initialize the database for serverless environments.
 * On Vercel, each serverless function has its own /tmp directory.
 * This function copies the built DB to /tmp and seeds it if needed.
 * Must be called at the start of every API route and server component.
 */
let _initialized = false

export async function initDb() {
  if (_initialized) return

  // On Vercel, ensure DB is copied to /tmp
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/custom.db'
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')

    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, tmpDbPath)
          console.log('📦 Copied DB to /tmp for Vercel serverless')
        }
      } catch (e) {
        console.error('Failed to copy DB to /tmp:', e)
      }
    }

    // Override DATABASE_URL for this function
    process.env.DATABASE_URL = `file:${tmpDbPath}`
  }

  // Check if seeding is needed
  try {
    const count = await db.product.count()
    if (count === 0) {
      console.log('🌱 Auto-seeding database (serverless cold start)...')
      const { execSync } = await import('child_process')
      execSync('node scripts/seed.mjs', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:/tmp/custom.db' }
      })
    }
  } catch (e) {
    console.error('Auto-seed check failed:', e)
  }

  _initialized = true
}
