import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CatalogClient from "@/components/store/CatalogClient";
import { db, ensureSchema } from "@/lib/db";

// Force dynamic rendering so DB is queried at request time, not at build time
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Ensure DB schema is applied (auto-setup on first request)
  await ensureSchema();

  let serializedProducts: Array<{
    id: string; reference: string; name: string; description: string | null;
    price: number; fabric: string | null; featured: boolean; active: boolean;
    createdAt: string; updatedAt: string;
    images: Array<{ id: string; url: string; alt: string | null; sortOrder: number; productId: string; createdAt: string }>;
    variants: Array<{ id: string; productId: string; size: string; color: string; stock: number; createdAt: string; updatedAt: string }>;
  }> = [];
  let totalPages = 1;

  try {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: {
          active: true,
        },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 12,
      }),
      db.product.count({
        where: { active: true },
      }),
    ]);

    totalPages = Math.ceil(total / 12);

    // Serialize for client components (convert Date objects to strings)
    serializedProducts = products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      images: p.images.map((img) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
      })),
      variants: p.variants.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch catalog products:", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header - Enhanced with pattern and decorative elements */}
        <div className="relative bg-gradient-to-b from-kabyle-cream/60 via-kabyle-cream/30 to-white kabyle-pattern border-b border-kabyle-terracotta/5 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-kabyle-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-kabyle-terracotta/5 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="inline-flex items-center gap-2 text-kabyle-terracotta text-sm font-medium mb-3">
              <span className="w-8 h-px bg-kabyle-terracotta/40" />
              COLLECTION
              <span className="w-8 h-px bg-kabyle-terracotta/40" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-kabyle-dark tracking-tight">
              Notre{" "}
              <span className="text-kabyle-terracotta section-ornament">Catalogue</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed">
              Explorez notre collection complète de robes kabyles, de la pièce traditionnelle au modèle contemporain.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <CatalogClient
            initialProducts={serializedProducts}
            initialTotalPages={totalPages}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
