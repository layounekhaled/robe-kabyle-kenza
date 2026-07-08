"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Facebook, Instagram, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-kabyle-dark text-white/90 relative overflow-hidden">
      <div className="berber-border-top" />
      <div className="kabyle-pattern-dark absolute inset-0 opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-kabyle-terracotta/30">
                <Image
                  src="/logo-kabyle.png"
                  alt="Robe Kabyle Kenza"
                  fill
                  className="object-cover"
                  sizes="48px"
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
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Spécialiste de la robe kabyle traditionnelle et moderne. Nos
              artisanes perpétuent un savoir-faire ancestral avec passion et
              raffinement. Chaque pièce est unique, chaque broderie raconte une
              histoire.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100025353770674"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-kabyle-terracotta hover:border-kabyle-terracotta hover:text-white transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/robe_kabyle_kenza/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-kabyle-terracotta hover:border-kabyle-terracotta hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2">
              <div className="w-6 h-px bg-kabyle-gold/50" />
              Contact
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-white/60">
                <MapPin className="h-4 w-4 text-kabyle-terracotta shrink-0 mt-0.5" />
                <span>Rue de la Victoire, Aïn Taya, Alger Plage, Algérie</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone className="h-4 w-4 text-kabyle-terracotta shrink-0" />
                <span>0561 34 27 62</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Mail className="h-4 w-4 text-kabyle-terracotta shrink-0" />
                <span>contact@robe-kabyle-kenza.dz</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2">
              <div className="w-6 h-px bg-kabyle-gold/50" />
              Liens Rapides
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/60 hover:text-kabyle-gold transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/50" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="text-white/60 hover:text-kabyle-gold transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/50" />
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/order"
                  className="text-white/60 hover:text-kabyle-gold transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kabyle-terracotta/50" />
                  Commander
                </Link>
              </li>
            </ul>

            <h3 className="text-base font-bold text-kabyle-gold flex items-center gap-2 pt-4">
              <div className="w-6 h-px bg-kabyle-gold/50" />
              Livraison
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Livraison assurée par{" "}
              <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold hover:underline font-semibold">
                FRET.DIRECT
              </a>{" "}
              partout en Algérie. Suivi en temps réel de votre commande.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Robe Kabyle Kenza. Tous droits réservés.
          </p>
          <p className="text-xs text-white/40">
            Site développé par{" "}
            <a href="https://fret.direct" target="_blank" rel="noopener noreferrer" className="text-kabyle-gold/70 hover:text-kabyle-gold transition-colors">
              FRET.DIRECT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
