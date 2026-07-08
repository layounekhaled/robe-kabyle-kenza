import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Truck,
  HeartHandshake,
  ArrowRight,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { db, ensureSchema } from "@/lib/db";

// Force dynamic rendering so DB is queried at request time, not at build time
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Ensure DB schema is applied (auto-setup on first request)
  await ensureSchema();

  // Fetch featured products directly in the server component
  let featuredProducts: Array<{
    id: string; reference: string; name: string; description: string | null;
    price: number; fabric: string | null; featured: boolean; active: boolean;
    createdAt: string; updatedAt: string;
    images: Array<{ id: string; url: string; alt: string | null; sortOrder: number; productId: string; createdAt: string }>;
    variants: Array<{ id: string; productId: string; size: string; color: string; stock: number; createdAt: string; updatedAt: string }>;
  }> = [];

  // Fetch style sections from database
  type StyleSection = {
    id: string; title: string; description: string; imageUrl: string;
    linkUrl: string; colorFrom: string; colorTo: string;
    sortOrder: number; active: boolean;
  };
  let styles: StyleSection[] = [];

  try {
    const products = await db.product.findMany({
      where: {
        featured: true,
        active: true,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // Serialize for client components (convert Date objects to strings)
    featuredProducts = products.map((p) => ({
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
    console.error("Failed to fetch featured products:", error);
  }

  try {
    const styleData = await db.styleSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    styles = styleData;
  } catch (error) {
    console.error("Failed to fetch styles:", error);
  }

  const serializedProducts = featuredProducts;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ═══ Hero Banner ═══ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-kabyle-cream via-white to-kabyle-cream/50 kabyle-pattern-rich">
          {/* Decorative floating elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-kabyle-terracotta/5 rounded-full blur-3xl animate-float-gentle" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-kabyle-gold/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-kabyle-indigo/3 rounded-full blur-2xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Text */}
              <div className="space-y-8 text-center lg:text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-kabyle-terracotta/10 border border-kabyle-terracotta/20 text-kabyle-terracotta text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Nouvelle collection
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-kabyle-dark leading-[1.1] tracking-tight">
                  Robes Kabyles{" "}
                  <span className="text-kabyle-terracotta relative">
                    Traditionnelles
                  </span>{" "}
                  et{" "}
                  <span className="text-shimmer-gold">Modernes</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Découvrez notre collection exclusive de robes kabyles,
                  confectionnées avec passion par nos artisanes. Broderies
                  ancestrales, tissus nobles et coupes élégantes pour sublimer
                  votre beauté.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/catalog">
                    <Button
                      size="lg"
                      className="btn-craft bg-kabyle-terracotta hover:bg-kabyle-red text-white px-8 text-base h-12 rounded-full shadow-lg shadow-kabyle-terracotta/25 hover:shadow-xl hover:shadow-kabyle-terracotta/30 transition-all"
                    >
                      Découvrir la collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/order">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-kabyle-terracotta/30 text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white px-8 text-base h-12 rounded-full transition-all"
                    >
                      Commander
                    </Button>
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 justify-center lg:justify-start pt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 text-kabyle-olive" />
                    <span>Livraison 58 wilayas</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-kabyle-gold text-kabyle-gold" />
                    ))}
                    <span className="ml-1">5/5</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="relative aspect-[3/4] max-w-md mx-auto">
                  {/* Decorative frame layers */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-kabyle-terracotta/15 to-kabyle-gold/15 rotate-2 scale-[1.02]" />
                  <div className="absolute -inset-2 rounded-3xl border-2 border-dashed border-kabyle-gold/20 rotate-1" />
                  <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/50">
                    <Image
                      src="/kabyle-banner.png"
                      alt="Robe Kabyle - Nouvelle collection"
                      fill
                      sizes="50vw"
                      className="object-cover"
                      priority
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-kabyle-dark/20 via-transparent to-transparent" />
                  </div>
                  {/* Floating decorative diamonds */}
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-kabyle-gold/30 rotate-45 rounded-sm" />
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-kabyle-terracotta/30 rotate-45 rounded-sm" />
                  <div className="absolute top-1/4 -right-6 w-4 h-4 bg-kabyle-indigo/20 rotate-45 rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 80V40C240 10 480 0 720 30C960 60 1200 50 1440 20V80H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* ═══ Ornamental Divider ═══ */}
        <div className="kabyle-divider max-w-md mx-auto -mt-2">
          <div className="kabyle-divider-diamond" />
        </div>

        {/* ═══ Featured Products ═══ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-kabyle-terracotta text-sm font-medium mb-3">
                <span className="w-8 h-px bg-kabyle-terracotta/50" />
                SÉLECTION
                <span className="w-8 h-px bg-kabyle-terracotta/50" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-kabyle-dark tracking-tight">
                Nos Pièces{" "}
                <span className="text-kabyle-terracotta section-ornament">Favorites</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Une sélection de nos plus belles robes kabyles, choisies pour
                leur qualité exceptionnelle et leurs broderies remarquables.
              </p>
            </div>

            {serializedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
                {serializedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-kabyle-cream mb-4">
                  <Sparkles className="h-7 w-7 text-kabyle-terracotta/40" />
                </div>
                <p className="text-muted-foreground">
                  Aucun produit en vedette pour le moment.
                </p>
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/catalog">
                <Button
                  variant="outline"
                  size="lg"
                  className="btn-craft border-2 border-kabyle-terracotta/30 text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white rounded-full px-8"
                >
                  Voir toute la collection
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ Why Choose Us ═══ */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-kabyle-cream/40 to-kabyle-cream/20 kabyle-pattern relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kabyle-terracotta/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kabyle-gold/20 to-transparent" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-kabyle-gold text-sm font-medium mb-3">
                <span className="w-8 h-px bg-kabyle-gold/50" />
                NOS VALEURS
                <span className="w-8 h-px bg-kabyle-gold/50" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-kabyle-dark tracking-tight">
                Pourquoi{" "}
                <span className="text-shimmer-gold">Nous Choisir</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nous nous engageons à vous offrir le meilleur de l&apos;artisanat
                kabyle avec un service irréprochable.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 stagger-children">
              <Card className="craft-card border-kabyle-terracotta/10 bg-white/90 backdrop-blur-sm text-center group">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-terracotta/10 to-kabyle-terracotta/5 border border-kabyle-terracotta/10 group-hover:from-kabyle-terracotta/15 group-hover:to-kabyle-terracotta/10 transition-colors">
                    <Sparkles className="h-7 w-7 text-kabyle-terracotta" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Qualité Artisanale
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chaque robe est confectionnée à la main par nos artisanes
                    kabyles, perpétuant un savoir-faire ancestral transmis de
                    génération en génération.
                  </p>
                </CardContent>
              </Card>

              <Card className="craft-card border-kabyle-gold/10 bg-white/90 backdrop-blur-sm text-center group">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-gold/10 to-kabyle-gold/5 border border-kabyle-gold/10 group-hover:from-kabyle-gold/15 group-hover:to-kabyle-gold/10 transition-colors">
                    <Truck className="h-7 w-7 text-kabyle-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Livraison Rapide
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Livraison partout en Algérie via <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold hover:underline font-semibold">FRET.DIRECT</a>. Suivez votre
                    commande en temps réel et recevez votre robe chez vous en
                    toute sécurité.
                  </p>
                </CardContent>
              </Card>

              <Card className="craft-card border-kabyle-olive/10 bg-white/90 backdrop-blur-sm text-center group">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-olive/10 to-kabyle-olive/5 border border-kabyle-olive/10 group-hover:from-kabyle-olive/15 group-hover:to-kabyle-olive/10 transition-colors">
                    <HeartHandshake className="h-7 w-7 text-kabyle-olive" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Service Personnalisé
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Un accompagnement sur mesure pour chaque commande. Nous vous
                    aidons à choisir la robe parfaite adaptée à vos envies et
                    votre morphologie.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══ Styles Section ═══ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-kabyle-terracotta text-sm font-medium mb-3">
                <span className="w-8 h-px bg-kabyle-terracotta/50" />
                OCCASIONS
                <span className="w-8 h-px bg-kabyle-terracotta/50" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-kabyle-dark tracking-tight">
                Nos{" "}
                <span className="text-kabyle-terracotta section-ornament">Styles</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Des robes pour chaque occasion, de la cérémonie au quotidien.
              </p>
            </div>

            {styles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
              {styles.map((style) => (
                <Link
                  key={style.id}
                  href={style.linkUrl}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden craft-card"
                >
                  <Image
                    src={style.imageUrl}
                    alt={`Style ${style.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized={style.imageUrl.includes('picsum.photos')}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${style.colorFrom} ${style.colorTo} opacity-50 group-hover:opacity-70 transition-opacity duration-500`}
                  />
                  {/* Decorative border on hover */}
                  <div className="absolute inset-2 rounded-xl border border-white/0 group-hover:border-white/30 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold drop-shadow-md">{style.title}</h3>
                    <p className="text-sm text-white/80 drop-shadow-sm">{style.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Aucun style pour le moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Testimonials ═══ */}
        <section className="py-16 sm:py-24 bg-kabyle-dark text-white relative overflow-hidden">
          <div className="kabyle-pattern-dark absolute inset-0" />
          <div className="absolute top-0 left-0 right-0 berber-border-top" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-kabyle-gold text-sm font-medium mb-3">
                <span className="w-8 h-px bg-kabyle-gold/50" />
                TÉMOIGNAGES
                <span className="w-8 h-px bg-kabyle-gold/50" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ce Que Disent Nos{" "}
                <span className="text-shimmer-gold">Clientes</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 stagger-children">
              {[
                {
                  name: "Samira B.",
                  wilaya: "Tizi Ouzou",
                  text: "Une robe magnifique ! Les broderies sont d'une finesse incroyable. Je me suis sentie comme une reine lors du mariage de ma sœur.",
                },
                {
                  name: "Nadia M.",
                  wilaya: "Alger",
                  text: "Livraison rapide et robe impeccable. Le tissu est de très haute qualité et les finitions sont parfaites. Je recommande vivement !",
                },
                {
                  name: "Karima A.",
                  wilaya: "Béjaïa",
                  text: "Service client exceptionnel. Ils m'ont aidée à choisir la bonne taille. La robe me va comme un gant. Merci Robe Kabyle Kenza !",
                },
              ].map((testimonial) => (
                <Card
                  key={testimonial.name}
                  className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/8 hover:border-kabyle-gold/20 transition-all duration-300 group"
                >
                  <CardContent className="p-7 space-y-5">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-kabyle-gold text-kabyle-gold"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed italic">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-kabyle-terracotta/30 to-kabyle-gold/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-kabyle-gold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-kabyle-gold">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-white/50">
                          {testimonial.wilaya}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 berber-border-bottom" />
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-kabyle-terracotta via-kabyle-red to-kabyle-terracotta relative overflow-hidden">
          <div className="kabyle-pattern-dark absolute inset-0 opacity-30" />
          {/* Decorative floating elements */}
          <div className="absolute top-10 left-20 w-4 h-4 bg-white/10 rotate-45 rounded-sm" />
          <div className="absolute bottom-10 right-20 w-6 h-6 bg-kabyle-gold/20 rotate-45 rounded-sm" />
          <div className="absolute top-1/2 left-10 w-3 h-3 bg-white/10 rotate-45 rounded-sm" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Prête à Sublimer Votre Élégance ?
            </h2>
            <p className="mt-4 text-white/80 max-w-2xl mx-auto leading-relaxed">
              Commandez votre robe kabyle dès maintenant et bénéficiez d&apos;une
              livraison rapide partout en Algérie.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalog">
                <Button
                  size="lg"
                  className="btn-craft bg-white text-kabyle-terracotta hover:bg-white/90 px-8 text-base h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Voir la collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/order">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white/10 px-8 text-base h-12 rounded-full transition-all"
                >
                  Commander maintenant
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
