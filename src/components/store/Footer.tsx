"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Facebook, Instagram, Mail, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-kabyle-dark text-white/90 relative overflow-hidden">
      {/* Top decorative berber border */}
      <div className="berber-border-top" />
      <div className="kabyle-pattern-dark absolute inset-0 opacity-50" />

      {/* Decorative floating elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-kabyle-terracotta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-kabyle-gold/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-kabyle-terracotta/30 shadow-lg shadow-kabyle-terracotta/10">
                <Image
                  src="/logo-kabyle.png"
                  alt="Robe Kabyle Kenza"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Robe Kabyle
                </span>
                <span className="text-xl font-bold text-kabyle-terracotta ml-1">
                  Kenza
                </span>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Spécialiste de la robe kabyle traditionnelle et moderne. Nos
              artisanes perpétuent un savoir-faire ancestral avec passion et
              raffinement. Chaque pièce est unique, chaque broderie raconte une
              histoire.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100025353770674"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-kabyle-terracotta hover:border-kabyle-terracotta hover:text-white hover:shadow-lg hover:shadow-kabyle-terracotta/20 transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/robe_kabyle_kenza/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-kabyle-terracotta hover:border-kabyle-terracotta hover:text-white hover:shadow-lg hover:shadow-kabyle-terracotta/20 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-kabyle-gold/50 to-transparent" />
              Contact
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-white/50 group hover:text-white/70 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kabyle-terracotta/10 text-kabyle-terracotta group-hover:bg-kabyle-terracotta/20 transition-colors">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="mt-1">Rue de la Victoire, Aïn Taya, Alger Plage, Algérie</span>
              </li>
              <li className="flex items-center gap-3 text-white/50 group hover:text-white/70 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kabyle-terracotta/10 text-kabyle-terracotta group-hover:bg-kabyle-terracotta/20 transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span>0561 34 27 62</span>
              </li>
              <li className="flex items-center gap-3 text-white/50 group hover:text-white/70 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kabyle-terracotta/10 text-kabyle-terracotta group-hover:bg-kabyle-terracotta/20 transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span>contact@robe-kabyle-kenza.dz</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-kabyle-gold/50 to-transparent" />
              Liens Rapides
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/50 hover:text-kabyle-gold transition-colors flex items-center gap-2.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/40 group-hover:bg-kabyle-gold transition-colors" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="text-white/50 hover:text-kabyle-gold transition-colors flex items-center gap-2.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/40 group-hover:bg-kabyle-gold transition-colors" />
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/order"
                  className="text-white/50 hover:text-kabyle-gold transition-colors flex items-center gap-2.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/40 group-hover:bg-kabyle-gold transition-colors" />
                  Commander
                </Link>
              </li>
            </ul>

            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2 pt-4">
              <div className="w-8 h-px bg-gradient-to-r from-kabyle-gold/50 to-transparent" />
              Livraison
            </h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Livraison assurée par{" "}
              <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold hover:underline font-semibold hover:text-kabyle-gold/80 transition-colors">
                FRET.DIRECT
              </a>{" "}
              partout en Algérie. Suivi en temps réel de votre commande.
            </p>
          </div>
        </div>

        {/* Ornamental divider before bottom bar */}
        <div className="mt-14 mb-6">
          <div className="kabyle-divider max-w-xs mx-auto">
            <div className="kabyle-divider-diamond" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-4 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Robe Kabyle Kenza. Tous droits réservés.
          </p>
          <p className="text-xs text-white/30 flex items-center gap-1">
            Développé avec{" "}
            <Heart className="h-3 w-3 text-kabyle-terracotta/60 fill-kabyle-terracotta/40" />{" "}
            par{" "}
            <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold/60 hover:text-kabyle-gold transition-colors font-medium">
              FRET.DIRECT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
