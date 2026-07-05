#!/bin/bash
# Build script that handles missing DATABASE_URL gracefully
# On Vercel: DATABASE_URL must be set as an environment variable
# Locally: uses .env file

set -e

echo "🔧 Running Prisma generate..."
npx prisma generate

# Only run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Running Prisma migrations..."
  npx prisma migrate deploy || npx prisma db push --accept-data-loss
else
  echo "⚠️  DATABASE_URL not set - skipping migrations"
  echo "⚠️  The app will not connect to a database until DATABASE_URL is configured"
fi

echo "🏗️  Building Next.js..."
npx next build
