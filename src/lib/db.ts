import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Ensure the database schema is applied.
 * On Vercel (serverless), we run `prisma db push` automatically
 * if the schema hasn't been applied yet.
 * This is safe to call multiple times - it only runs once per cold start.
 */
let _schemaApplied = false
export async function ensureSchema() {
  if (_schemaApplied) return
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set - database features will not work')
    return
  }

  try {
    // Check if core tables exist - verify both Product AND HeroSlide
    // HeroSlide is a newer table, so if it's missing we need to push schema
    await db.product.count()
    try {
      await db.heroSlide.count()
    } catch {
      // HeroSlide table doesn't exist yet - need to push schema
      console.log('📦 New tables detected - applying schema with prisma db push...')
      const { execSync } = await import('child_process')
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env },
        timeout: 60000,
      })
      console.log('✅ Database schema updated successfully')
    }
    _schemaApplied = true
  } catch (error: unknown) {
    // If the table doesn't exist, we need to push the schema
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
      console.log('📦 Database schema not found - applying with prisma db push...')
      try {
        const { execSync } = await import('child_process')
        execSync('npx prisma db push --skip-generate', {
          stdio: 'inherit',
          env: { ...process.env },
          timeout: 60000,
        })
        console.log('✅ Database schema applied successfully')
      } catch (pushError) {
        console.error('❌ Failed to apply schema:', pushError)
      }
    }
    _schemaApplied = true
  }
}
