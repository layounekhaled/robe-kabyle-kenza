// Standalone seed script - can be run before server starts
// Uses fetch to call the /api/seed endpoint once the server is up,
// OR directly seeds the database using Prisma Client

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

const PRODUCT_NAMES = [
  "Robe Kabyle Azerou", "Robe Kabyle Tizi", "Robe Kabyle Djurdjura",
  "Robe Kabyle Tamgout", "Robe Kabyle Tikjda", "Robe Kabyle Akfadou",
  "Robe Kabyle Babor", "Robe Kabyle Tababort", "Robe Kabyle Lala Khedidja",
  "Robe Kabyle Gouraya", "Robe Kabyle Chelata", "Robe Kabyle Beni Ghobri",
  "Robe Kabyle Ait Menguellet", "Robe Kabyle Ait Yenni", "Robe Kabyle Ait Hichem",
  "Robe Kabyle Ouaguenoun", "Robe Kabyle Azazga", "Robe Kabyle Azzefoun",
  "Robe Kabyle Tigzirt", "Robe Kabyle Aokas", "Robe Kabyle Bejaia",
  "Robe Kabyle Gouraya Bejaia", "Robe Kabyle Tichy", "Robe Kabyle Jijel",
  "Robe Kabyle Setif", "Robe Kabyle Bouira", "Robe Kabyle Boumerdes",
  "Robe Kabyle Mchedallah", "Robe Kabyle Larbaa Nath Irathen", "Robe Kabyle Ain El Hammam",
];

const FABRICS = ["Satin de soie", "Velours", "Mousseline", "Brocart", "Coton brodé", "Soie traditionnelle", "Taffetas", "Organza", "Duchesse", "Crêpe de soie"];
const COLORS = ["Rouge", "Bleu", "Vert", "Noir", "Blanc", "Or"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const ALGERIAN_WILAYAS = [
  { code: 1, name: "Adrar" }, { code: 2, name: "Chlef" }, { code: 3, name: "Laghouat" },
  { code: 4, name: "Oum El Bouaghi" }, { code: 5, name: "Batna" }, { code: 6, name: "Béjaïa" },
  { code: 7, name: "Biskra" }, { code: 8, name: "Béchar" }, { code: 9, name: "Blida" },
  { code: 10, name: "Bouira" }, { code: 11, name: "Tamanrasset" }, { code: 12, name: "Tébessa" },
  { code: 13, name: "Tlemcen" }, { code: 14, name: "Tiaret" }, { code: 15, name: "Tizi Ouzou" },
  { code: 16, name: "Alger" }, { code: 17, name: "Djelfa" }, { code: 18, name: "Jijel" },
  { code: 19, name: "Sétif" }, { code: 20, name: "Saïda" }, { code: 21, name: "Skikda" },
  { code: 22, name: "Sidi Bel Abbès" }, { code: 23, name: "Annaba" }, { code: 24, name: "Guelma" },
  { code: 25, name: "Constantine" }, { code: 26, name: "Médéa" }, { code: 27, name: "Mostaganem" },
  { code: 28, name: "M'Sila" }, { code: 29, name: "Mascara" }, { code: 30, name: "Ouargla" },
  { code: 31, name: "Oran" }, { code: 32, name: "El Bayadh" }, { code: 33, name: "Illizi" },
  { code: 34, name: "Bordj Bou Arréridj" }, { code: 35, name: "Boumerdès" }, { code: 36, name: "El Tarf" },
  { code: 37, name: "Tindouf" }, { code: 38, name: "Tissemsilt" }, { code: 39, name: "El Oued" },
  { code: 40, name: "Khenchela" }, { code: 41, name: "Souk Ahras" }, { code: 42, name: "Tipaza" },
  { code: 43, name: "Mila" }, { code: 44, name: "Aïn Defla" }, { code: 45, name: "Naâma" },
  { code: 46, name: "Aïn Témouchent" }, { code: 47, name: "Ghardaïa" }, { code: 48, name: "Relizane" },
  { code: 49, name: "El M'Ghair" }, { code: 50, name: "El Meniaa" }, { code: 51, name: "Ouled Djellal" },
  { code: 52, name: "Bordj Badji Mokhtar" }, { code: 53, name: "Béni Abbès" }, { code: 54, name: "Timimoun" },
  { code: 55, name: "Touggourt" }, { code: 56, name: "Djanet" }, { code: 57, name: "In Salah" },
  { code: 58, name: "In Guezzam" },
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPrice() {
  const prices = [4500, 4800, 5200, 5500, 5800, 6000, 6200, 6500, 6800, 7000, 7200, 7500, 7800, 8000, 8200, 8500, 8800, 9000, 9200, 9500, 9800, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 14000, 15000, 16000, 17000, 18000];
  return prices[randomInt(0, prices.length - 1)];
}

async function seed() {
  console.log("🌱 Checking if database needs seeding...");

  try {
    // Check if products already exist
    const existingProducts = await db.product.count();
    if (existingProducts > 0) {
      console.log(`✅ Database already has ${existingProducts} products. Skipping seed.`);
      await db.$disconnect();
      return;
    }

    console.log("🌱 Seeding database...");

    // 1. Create admin user
    const hashedPassword = await hash("admin123", 12);
    await db.user.upsert({
      where: { email: "admin@boutique-kabyles.dz" },
      update: {},
      create: { email: "admin@boutique-kabyles.dz", name: "Administrateur", password: hashedPassword, role: "admin" },
    });
    console.log("  ✅ Admin user created");

    // 2. Create Ecotrack settings
    await db.ecotrackSettings.upsert({
      where: { id: "ecotrack-default" },
      update: {},
      create: { id: "ecotrack-default", apiToken: "f3T3yfdoMYkdm3s2608MNEo6IMc5W8TDY0899d7hZqyaTXWP4YcCtr4ZcypY", apiUrl: "https://fret.ecotrack.dz", active: true },
    });
    console.log("  ✅ Ecotrack settings created");

    // 3. Create wilayas
    for (const wilaya of ALGERIAN_WILAYAS) {
      await db.wilaya.upsert({
        where: { code: wilaya.code },
        update: { name: wilaya.name },
        create: { code: wilaya.code, name: wilaya.name },
      });
    }
    console.log(`  ✅ ${ALGERIAN_WILAYAS.length} wilayas created`);

    // 4. Create products
    for (let i = 0; i < 30; i++) {
      const reference = `RK-${String(i + 1).padStart(3, "0")}`;
      const name = PRODUCT_NAMES[i];
      const price = randomPrice();
      const fabric = FABRICS[randomInt(0, FABRICS.length - 1)];
      const isFeatured = i < 8;

      const product = await db.product.upsert({
        where: { reference },
        update: {},
        create: { reference, name, description: `Robe kabyle traditionnelle ${name.replace("Robe Kabyle ", "")}. Confectionnée avec soin par nos artisanes.`, price, fabric, featured: isFeatured, active: true },
      });

      // Create images
      const imageCount = randomInt(2, 4);
      for (let j = 0; j < imageCount; j++) {
        await db.productImage.create({
          data: { url: `https://picsum.photos/seed/kabyle-dress-${i + 1}-${j + 1}/600/800`, alt: `${name} - Image ${j + 1}`, sortOrder: j, productId: product.id },
        });
      }

      // Create variants
      const selectedColors = COLORS.slice(0, randomInt(2, COLORS.length));
      const selectedSizes = SIZES.slice(0, randomInt(3, SIZES.length));
      for (const size of selectedSizes) {
        for (const color of selectedColors) {
          const stock = randomInt(0, 15);
          try {
            await db.productVariant.create({ data: { productId: product.id, size, color, stock } });
          } catch { /* unique constraint */ }
        }
      }
    }
    console.log("  ✅ 30 products created with images and variants");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    await db.$disconnect();
  }
}

seed();
