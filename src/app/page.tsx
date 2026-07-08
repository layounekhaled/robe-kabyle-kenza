import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Truck,
  HeartHandshake,
  ArrowRight,
  Star,
  ChevronRight,
  Gem,
  Scissors,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import HeroCarousel from "@/components/store/HeroCarousel";
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

  // Fetch hero slides from database
  type HeroSlide = {
    id: string; imageUrl: string; alt: string;
    sortOrder: number; active: boolean;
  };
  let heroSlides: HeroSlide[] = [];

  try {
    const slideData = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    heroSlides = slideData;
  } catch (error) {
    console.error("Failed to fetch hero slides:", error);
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
        <section className="relative overflow-hidden hero-gradient kabyle-pattern-rich min-h-[85vh] flex items-center">
          {/* Decorative floating elements */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-kabyle-terracotta/5 rounded-full blur-3xl animate-float-gentle" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-kabyle-gold/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-kabyle-indigo/4 rounded-full blur-2xl animate-float-rotate" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-kabyle-copper/5 rounded-full blur-xl" />

          {/* Decorative diamond shapes */}
          <div className="absolute top-32 right-20 w-3 h-3 bg-kabyle-gold/30 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-40 left-20 w-4 h-4 bg-kabyle-terracotta/20 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-10 w-2 h-2 bg-kabyle-indigo/30 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '3.5s' }} />

          {/* Subtle geometric lines */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
            <div className="absolute top-1/4 left-0 w-full h-px bg-kabyle-terracotta" />
            <div className="absolute top-2/4 left-0 w-full h-px bg-kabyle-gold" />
            <div className="absolute top-3/4 left-0 w-full h-px bg-kabyle-terracotta" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Text */}
              <div className="space-y-8 text-center lg:text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kabyle-terracotta/10 border border-kabyle-terracotta/20 text-kabyle-terracotta text-sm font-medium shadow-sm shadow-kabyle-terracotta/5">
                  <Sparkles className="h-4 w-4" />
                  Nouvelle collection
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-kabyle-dark leading-[1.08] tracking-tight">
                  Robes Kabyles{" "}
                  <span className="text-kabyle-terracotta relative inline-block">
                    Traditionnelles
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 6C30 2 60 2 100 4C140 6 170 3 198 2" stroke="oklch(0.55 0.15 25)" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
                    </svg>
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
                      className="btn-craft bg-gradient-to-r from-kabyle-terracotta to-kabyle-red hover:from-kabyle-red hover:to-kabyle-terracotta text-white px-8 text-base h-13 rounded-full shadow-lg shadow-kabyle-terracotta/25 hover:shadow-xl hover:shadow-kabyle-terracotta/35 transition-all duration-500 hover:scale-[1.02]"
                    >
                      Découvrir la collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/order">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-kabyle-terracotta/30 text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white hover:border-kabyle-terracotta px-8 text-base h-13 rounded-full transition-all duration-300 hover:scale-[1.02]"
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

              {/* Hero Image - Auto-sliding Carousel (visible on all screens) */}
              <div className="relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0">
                  {/* Decorative frame layers - hidden on mobile for cleaner look */}
                  <div className="hidden lg:block absolute inset-0 rounded-2xl bg-gradient-to-br from-kabyle-terracotta/20 to-kabyle-gold/20 rotate-3 scale-[1.03] transition-transform duration-700 group-hover:rotate-1" />
                  <div className="hidden lg:block absolute -inset-3 rounded-3xl border-2 border-dashed border-kabyle-gold/25 rotate-1" />
                  <div className="hidden lg:block absolute -inset-6 rounded-[2rem] border border-kabyle-terracotta/10 rotate-[-0.5deg]" />
                  <HeroCarousel
                    slides={heroSlides}
                    fallbackImage="/kabyle-banner.png"
                  />
                  {/* Floating decorative diamonds - hidden on mobile */}
                  <div className="hidden lg:block absolute -bottom-4 -right-4 w-10 h-10 bg-gradient-to-br from-kabyle-gold/40 to-kabyle-gold/20 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '1s' }} />
                  <div className="hidden lg:block absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-kabyle-terracotta/40 to-kabyle-terracotta/20 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '2s' }} />
                  <div className="hidden lg:block absolute top-1/4 -right-7 w-5 h-5 bg-kabyle-indigo/25 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '3s' }} />
                  <div className="hidden lg:block absolute bottom-1/4 -left-5 w-3 h-3 bg-kabyle-copper/30 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration - enhanced with berber stripe */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 100V50C180 15 360 5 540 20C720 35 900 60 1080 40C1200 25 1320 10 1440 25V100H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* ═══ Ornamental Divider ═══ */}
        <div className="kabyle-divider-double max-w-sm mx-auto -mt-1 py-4">
          <div className="kabyle-ornament-diamond" />
          <div className="kabyle-ornament-diamond-gold" />
          <div className="kabyle-ornament-diamond" />
        </div>

        {/* ═══ Featured Products ═══ */}
        <section className="py-16 sm:py-24 relative">
          {/* Subtle background */}
          <div className="absolute inset-0 kabyle-pattern-embroidery opacity-50" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-kabyle-terracotta text-sm font-medium mb-4">
                <span className="w-10 h-px bg-gradient-to-r from-transparent to-kabyle-terracotta/50" />
                <Gem className="h-4 w-4" />
                SÉLECTION
                <Gem className="h-4 w-4" />
                <span className="w-10 h-px bg-gradient-to-l from-transparent to-kabyle-terracotta/50" />
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
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-cream to-kabyle-cream/50 border border-kabyle-terracotta/10 mb-4">
                  <Sparkles className="h-8 w-8 text-kabyle-terracotta/30" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Aucun produit en vedette pour le moment.
                </p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  Revenez bientôt pour découvrir nos nouveautés
                </p>
              </div>
            )}

            <div className="text-center mt-14">
              <Link href="/catalog">
                <Button
                  variant="outline"
                  size="lg"
                  className="btn-craft border-2 border-kabyle-terracotta/30 text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white hover:border-kabyle-terracotta rounded-full px-8 h-12 transition-all duration-300 hover:scale-[1.02]"
                >
                  Voir toute la collection
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ Why Choose Us ═══ */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-kabyle-cream/50 via-kabyle-cream/30 to-white kabyle-pattern relative overflow-hidden">
          {/* Top and bottom decorative lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kabyle-terracotta/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kabyle-gold/15 to-transparent" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-kabyle-gold text-sm font-medium mb-4">
                <span className="w-10 h-px bg-gradient-to-r from-transparent to-kabyle-gold/50" />
                NOS VALEURS
                <span className="w-10 h-px bg-gradient-to-l from-transparent to-kabyle-gold/50" />
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
              <Card className="craft-card border-kabyle-terracotta/10 bg-white/95 backdrop-blur-sm text-center group gradient-border-animated">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-terracotta/12 to-kabyle-terracotta/4 border border-kabyle-terracotta/10 group-hover:from-kabyle-terracotta/20 group-hover:to-kabyle-terracotta/8 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-kabyle-terracotta/10">
                    <Scissors className="h-8 w-8 text-kabyle-terracotta" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Qualité Artisanale
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chaque robe est confectionnée à la main par nos artisanes
                    kabyles, perpétuant un savoir-faire ancestral transmis de
                    génération en génération. Les finitions sont impeccables et
                    chaque broderie raconte une histoire.
                  </p>
                </CardContent>
              </Card>

              <Card className="craft-card border-kabyle-gold/10 bg-white/95 backdrop-blur-sm text-center group gradient-border-animated">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-gold/12 to-kabyle-gold/4 border border-kabyle-gold/10 group-hover:from-kabyle-gold/20 group-hover:to-kabyle-gold/8 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-kabyle-gold/10">
                    <Truck className="h-8 w-8 text-kabyle-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Livraison Rapide
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Livraison partout en Algérie via <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold hover:underline font-semibold">FRET.DIRECT</a>. Suivez votre
                    commande en temps réel et recevez votre robe chez vous en
                    toute sécurité et dans les meilleurs délais.
                  </p>
                </CardContent>
              </Card>

              <Card className="craft-card border-kabyle-olive/10 bg-white/95 backdrop-blur-sm text-center group gradient-border-animated">
                <CardContent className="p-8 space-y-5">
                  <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-kabyle-olive/12 to-kabyle-olive/4 border border-kabyle-olive/10 group-hover:from-kabyle-olive/20 group-hover:to-kabyle-olive/8 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-kabyle-olive/10">
                    <HeartHandshake className="h-8 w-8 text-kabyle-olive" />
                  </div>
                  <h3 className="text-lg font-bold text-kabyle-dark">
                    Service Personnalisé
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Un accompagnement sur mesure pour chaque commande. Nous vous
                    aidons à choisir la robe parfaite adaptée à vos envies et
                    votre morphologie, avec des conseils personnalisés.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══ Styles Section ═══ */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-kabyle-gold/3 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-kabyle-terracotta/3 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-kabyle-terracotta text-sm font-medium mb-4">
                <span className="w-10 h-px bg-gradient-to-r from-transparent to-kabyle-terracotta/50" />
                <Palette className="h-4 w-4" />
                OCCASIONS
                <Palette className="h-4 w-4" />
                <span className="w-10 h-px bg-gradient-to-l from-transparent to-kabyle-terracotta/50" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 stagger-children">
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
                    className="object-cover transition-transform duration-700 group-hover:scale-115"
                    unoptimized={style.imageUrl.includes('picsum.photos')}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${style.colorFrom} ${style.colorTo} opacity-50 group-hover:opacity-75 transition-opacity duration-500`}
                  />
                  {/* Decorative inner border on hover */}
                  <div className="absolute inset-3 rounded-xl border-2 border-white/0 group-hover:border-white/30 transition-all duration-500" />
                  {/* Bottom gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/60 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold drop-shadow-md">{style.title}</h3>
                    <p className="text-sm text-white/85 drop-shadow-sm mt-1">{style.description}</p>
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
        <section className="py-20 sm:py-28 bg-kabyle-dark text-white relative overflow-hidden">
          <div className="kabyle-pattern-dark absolute inset-0" />
          {/* Decorative floating elements in dark section */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-kabyle-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-kabyle-terracotta/5 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 berber-border-top" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-kabyle-gold text-sm font-medium mb-4">
                <span className="w-10 h-px bg-gradient-to-r from-transparent to-kabyle-gold/50" />
                TÉMOIGNAGES
                <span className="w-10 h-px bg-gradient-to-l from-transparent to-kabyle-gold/50" />
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
                  className="bg-white/[0.06] border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.1] hover:border-kabyle-gold/20 transition-all duration-500 group"
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
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-kabyle-terracotta/40 to-kabyle-gold/40 flex items-center justify-center ring-2 ring-kabyle-gold/20">
                        <span className="text-sm font-bold text-kabyle-gold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-kabyle-gold">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-white/40">
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
        <section className="py-20 sm:py-28 bg-gradient-to-r from-kabyle-terracotta via-kabyle-red to-kabyle-terracotta relative overflow-hidden">
          <div className="kabyle-pattern-dark absolute inset-0 opacity-30" />
          {/* Decorative floating elements */}
          <div className="absolute top-10 left-20 w-5 h-5 bg-white/10 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-10 right-20 w-8 h-8 bg-kabyle-gold/15 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-10 w-3 h-3 bg-white/10 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-kabyle-gold/10 rotate-45 rounded-sm animate-float-gentle" style={{ animationDelay: '3.5s' }} />

          {/* Background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-kabyle-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 text-white/70 text-sm font-medium mb-4">
              <span className="w-10 h-px bg-white/30" />
              PRÊTE ?
              <span className="w-10 h-px bg-white/30" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Prête à Sublimer Votre Élégance ?
            </h2>
            <p className="mt-5 text-white/80 max-w-2xl mx-auto leading-relaxed text-lg">
              Commandez votre robe kabyle dès maintenant et bénéficiez d&apos;une
              livraison rapide partout en Algérie.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalog">
                <Button
                  size="lg"
                  className="btn-craft bg-white text-kabyle-terracotta hover:bg-white/95 px-8 text-base h-13 rounded-full shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  Voir la collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/order">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/60 px-8 text-base h-13 rounded-full transition-all duration-300 hover:scale-[1.02]"
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
