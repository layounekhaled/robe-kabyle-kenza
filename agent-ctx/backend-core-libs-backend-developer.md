# Task: Create Core Library and API Files

## Agent: Backend Developer
## Task ID: backend-core-libs

## Summary
Created all 12 required core library and API route files for the Boutique Robes Kabyles e-commerce application.

## Files Created

### Library Files
1. **`/src/lib/auth.ts`** - Authentication utilities using NextAuth.js v4
   - Credentials provider with email/password
   - bcryptjs for password hashing
   - JWT session strategy
   - Admin/staff role check helpers
   - Default NEXTAUTH_SECRET and NEXTAUTH_URL

2. **`/src/lib/ecotrack.ts`** - Ecotrack API integration
   - Base URL: https://fret.ecotrack.dz
   - Default token configured
   - Functions: getWilayas, getCommunes, calculateShipping, createOrder, trackOrder
   - Reads token from EcotrackSettings DB table, falls back to default
   - Proper error handling with try/catch

### API Routes
3. **`/src/app/api/auth/[...nextauth]/route.ts`** - NextAuth API route handler

4. **`/src/app/api/seed/route.ts`** - Seed endpoint (GET)
   - Admin user: admin@boutique-kabyles.dz / admin123
   - 30 Kabyle dress products with realistic names
   - Variants (sizes XS-XXL, colors in French)
   - 58 Algerian wilayas with codes 1-58 and Arabic names
   - Ecotrack settings with default token
   - Uses upsert to avoid duplicates

5. **`/src/app/api/products/route.ts`** - Products API
   - GET: List with filters (search, price range, size, color, inStock, featured)
   - POST: Create product (admin only)

6. **`/src/app/api/products/[id]/route.ts`** - Single product API
   - GET: Get single product with images and variants
   - PUT: Update product (admin only)
   - DELETE: Soft delete (admin only)

7. **`/src/app/api/orders/route.ts`** - Orders API
   - GET: List orders (admin, with status filter, search, pagination)
   - POST: Create order (public, auto-generates orderNumber, deducts stock)

8. **`/src/app/api/orders/[id]/route.ts`** - Single order API
   - GET: Get order with items (admin)
   - PUT: Update order status (admin), auto-creates Ecotrack shipment on "confirmed"

9. **`/src/app/api/store-sales/route.ts`** - Store sales API
   - GET: List store sales (admin)
   - POST: Create store sale (POS), auto-deducts stock, generates saleNumber

10. **`/src/app/api/ecotrack/route.ts`** - Ecotrack API proxy
    - GET: Settings, wilayas, communes, shipping
    - PUT: Update settings (admin)

11. **`/src/app/api/stats/route.ts`** - Dashboard stats (admin)
    - Product counts, order counts by status, revenue totals, low stock alerts

12. **`/src/app/api/images/route.ts`** - Image upload API
    - POST: Upload image to /public/uploads/, return URL
    - Validates file type and size (5MB max)

## Verification
- `bun run db:push` - Database in sync
- `bun run lint` - No ESLint errors
- Seed endpoint tested: 30 products, 58 wilayas, admin user, ecotrack settings created
- Products API tested: filtering, pagination, single product retrieval all working
- Auth API tested: CSRF token generation works
- Stats API tested: correctly returns 401 for unauthenticated users
- Ecotrack API tested: settings retrieval and token masking works

## Database Seeded
- Admin user: admin@boutique-kabyles.dz / admin123
- 30 products with images and variants
- 58 wilayas
- Ecotrack settings
