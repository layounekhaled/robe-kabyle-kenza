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
 * On Vercel (serverless), we create missing tables directly via SQL
 * since prisma db push via execSync doesn't work in serverless.
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
    // Check if core tables exist
    await db.product.count()

    // Check if HeroSlide table exists
    try {
      await db.heroSlide.count()
    } catch {
      // HeroSlide table doesn't exist - create it directly with SQL
      console.log('📦 HeroSlide table not found - creating with SQL...')
      try {
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "HeroSlide" (
            "id" TEXT NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "alt" TEXT NOT NULL DEFAULT 'Robe Kabyle',
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "active" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
          );
          CREATE INDEX IF NOT EXISTS "HeroSlide_sortOrder_idx" ON "HeroSlide"("sortOrder");
        `)
        console.log('✅ HeroSlide table created successfully')
      } catch (sqlError) {
        console.error('❌ Failed to create HeroSlide table:', sqlError)
        // Fallback: try prisma db push
        try {
          const { execSync } = await import('child_process')
          execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: 'inherit',
            env: { ...process.env },
            timeout: 60000,
          })
          console.log('✅ Schema applied via prisma db push')
        } catch (pushError) {
          console.error('❌ Both SQL and prisma db push failed:', pushError)
        }
      }
    }

    _schemaApplied = true
  } catch (error: unknown) {
    // If even the Product table doesn't exist, try full schema push
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
      console.log('📦 Database schema not found - applying with prisma db push...')
      try {
        const { execSync } = await import('child_process')
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
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
