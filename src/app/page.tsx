"use client";

import { useState, useEffect } from "react";
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

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Product {
  id: string;
  reference: string;
  name: string;
  price: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch("/api/products?featured=true&limit=6");
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.products || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-kabyle-cream via-white to-kabyle-cream/50 kabyle-pattern">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Text */}
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kabyle-terracotta/10 text-kabyle-terracotta text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Collection 2025
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-kabyle-dark leading-tight">
                  Robes Kabyles{" "}
                  <span className="text-kabyle-terracotta">
                    Traditionnelles
                  </span>{" "}
                  et{" "}
                  <span className="text-kabyle-gold">Modernes</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Découvrez notre collection exclusive de robes kabyles,
                  confectionnées avec passion par nos artisanes. Broderies
                  ancestrales, tissus nobles et coupes élégantes pour sublimer
                  votre beauté.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/catalog">
                    <Button
                      size="lg"
                      className="bg-kabyle-terracotta hover:bg-kabyle-red text-white px-8 text-base"
                    >
                      Découvrir la collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/order">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-kabyle-terracotta text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white px-8 text-base"
                    >
                      Commander
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative hidden lg:block">
                <div className="relative aspect-[3/4] max-w-md mx-auto">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-kabyle-terracotta/20 to-kabyle-gold/20 -rotate-3" />
                  <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/kabyle-banner.png"
                      alt="Robe Kabyle - Collection 2025"
                      fill
                      sizes="50vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-kabyle-gold/20 blur-2xl" />
                  <div className="absolute -top-4 -left-4 h-32 w-32 rounded-full bg-kabyle-terracotta/20 blur-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
                Nos Pièces{" "}
                <span className="text-kabyle-terracotta">Favorites</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Une sélection de nos plus belles robes kabyles, choisies pour
                leur qualité exceptionnelle et leurs broderies remarquables.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border bg-muted overflow-hidden"
                  >
                    <div className="aspect-[3/4] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-6 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link href="/catalog">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-kabyle-terracotta text-kabyle-terracotta hover:bg-kabyle-terracotta hover:text-white"
                >
                  Voir toute la collection
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 sm:py-20 bg-kabyle-cream/50 kabyle-pattern">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
                Pourquoi{" "}
                <span className="text-kabyle-gold">Nous Choisir</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Nous nous engageons à vous offrir le meilleur de l&apos;artisanat
                kabyle avec un service irréprochable.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="border-kabyle-terracotta/10 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kabyle-terracotta/10">
                    <Sparkles className="h-7 w-7 text-kabyle-terracotta" />
                  </div>
                  <h3 className="text-lg font-semibold text-kabyle-dark">
                    Qualité Artisanale
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chaque robe est confectionnée à la main par nos artisanes
                    kabyles, perpétuant un savoir-faire ancestral transmis de
                    génération en génération.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-kabyle-gold/10 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kabyle-gold/10">
                    <Truck className="h-7 w-7 text-kabyle-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-kabyle-dark">
                    Livraison Rapide
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Livraison partout en Algérie via Ecotrack. Suivez votre
                    commande en temps réel et recevez votre robe chez vous en
                    toute sécurité.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-kabyle-olive/10 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kabyle-olive/10">
                    <HeartHandshake className="h-7 w-7 text-kabyle-olive" />
                  </div>
                  <h3 className="text-lg font-semibold text-kabyle-dark">
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

        {/* Styles Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-kabyle-dark">
                Nos{" "}
                <span className="text-kabyle-terracotta">Styles</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Des robes pour chaque occasion, de la cérémonie au quotidien.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Cérémonie",
                  desc: "Robes de fête majestueuses",
                  seed: "kabyle-ceremonie",
                  color: "from-kabyle-red/80 to-kabyle-terracotta/80",
                },
                {
                  title: "Traditionnelle",
                  desc: "L&apos;authenticité kabyle",
                  seed: "kabyle-tradition",
                  color: "from-kabyle-terracotta/80 to-kabyle-gold/80",
                },
                {
                  title: "Moderne",
                  desc: "Tradition revisité",
                  seed: "kabyle-moderne",
                  color: "from-kabyle-gold/80 to-kabyle-olive/80",
                },
                {
                  title: "Quotidienne",
                  desc: "Élégance au quotidien",
                  seed: "kabyle-daily",
                  color: "from-kabyle-olive/80 to-kabyle-dark/60",
                },
              ].map((style) => (
                <Link
                  key={style.title}
                  href="/catalog"
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden"
                >
                  <Image
                    src={`https://picsum.photos/seed/${style.seed}/400/530`}
                    alt={`Style ${style.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${style.color} opacity-60 group-hover:opacity-75 transition-opacity`}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-bold">{style.title}</h3>
                    <p className="text-sm text-white/80">{style.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 bg-kabyle-dark text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Ce Que Disent Nos{" "}
                <span className="text-kabyle-gold">Clientes</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
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
                  className="bg-white/5 border-white/10 backdrop-blur-sm"
                >
                  <CardContent className="p-6 space-y-4">
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
                    <div>
                      <p className="text-sm font-semibold text-kabyle-gold">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-white/50">
                        {testimonial.wilaya}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-kabyle-terracotta to-kabyle-red">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Prête à Sublimer Votre Élégance ?
            </h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto">
              Commandez votre robe kabyle dès maintenant et bénéficiez d&apos;une
              livraison rapide partout en Algérie.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/catalog">
                <Button
                  size="lg"
                  className="bg-white text-kabyle-terracotta hover:bg-white/90 px-8 text-base"
                >
                  Voir la collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/order">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8 text-base"
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
