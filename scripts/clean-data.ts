/**
 * Script: Clean all orders and products from the database
 * Keeps: Users, Wilayas, Communes, EcotrackSettings, StyleSections
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Nettoyage de la base de données...\n')

  // Delete in order respecting foreign keys
  // 1. StoreSaleItem (depends on StoreSale + Product)
  const saleItems = await db.storeSaleItem.deleteMany({})
  console.log(`✅ StoreSaleItems supprimés: ${saleItems.count}`)

  // 2. StoreSale
  const sales = await db.storeSale.deleteMany({})
  console.log(`✅ StoreSales supprimées: ${sales.count}`)

  // 3. OrderItem (depends on Order + Product)
  const orderItems = await db.orderItem.deleteMany({})
  console.log(`✅ OrderItems supprimés: ${orderItems.count}`)

  // 4. Order
  const orders = await db.order.deleteMany({})
  console.log(`✅ Commandes supprimées: ${orders.count}`)

  // 5. Customer
  const customers = await db.customer.deleteMany({})
  console.log(`✅ Clients supprimés: ${customers.count}`)

  // 6. ProductImage (depends on Product, cascade but explicit)
  const images = await db.productImage.deleteMany({})
  console.log(`✅ Images produits supprimées: ${images.count}`)

  // 7. ProductVariant (depends on Product, cascade but explicit)
  const variants = await db.productVariant.deleteMany({})
  console.log(`✅ Variantes produits supprimées: ${variants.count}`)

  // 8. Product
  const products = await db.product.deleteMany({})
  console.log(`✅ Produits supprimés: ${products.count}`)

  console.log('\n🎉 Base de données nettoyée avec succès !')
  console.log('   Conservés: Utilisateurs, Wilayas, Communes, Ecotrack, StyleSections')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
