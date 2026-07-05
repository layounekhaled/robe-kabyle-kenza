import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CatalogClient from "@/components/store/CatalogClient";
import { db } from "@/lib/db";

// Force dynamic rendering so DB is queried at request time, not at build time
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Fetch initial products data in the server component
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

  const totalPages = Math.ceil(total / 12);

  // Serialize for client components (convert Date objects to strings)
  const serializedProducts = products.map((p) => ({
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-kabyle-cream/50 kabyle-pattern border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
              Notre{" "}
              <span className="text-kabyle-terracotta">Catalogue</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explorez notre collection complète de robes kabyles
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
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
