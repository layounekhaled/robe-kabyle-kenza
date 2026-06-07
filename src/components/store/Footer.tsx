"use client";

import Link from "next/link";
import { Shirt, MapPin, Phone, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-kabyle-dark text-white/90">
      <div className="berber-border-top" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kabyle-terracotta text-white">
                <Shirt className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">
                Robe Kabyle Kenza
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Spécialiste de la robe kabyle traditionnelle et moderne. Nos
              artisanes perpétuent un savoir-faire ancestral avec passion et
              raffinement. Chaque pièce est unique, chaque broderie raconte une
              histoire.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-semibold text-kabyle-gold mb-4">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4 text-kabyle-terracotta shrink-0" />
                Rue de la Victoire, Aïn Taya, Alger Plage, Algérie
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Phone className="h-4 w-4 text-kabyle-terracotta shrink-0" />
                0561 34 27 62
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-base font-semibold text-kabyle-gold mb-4">
              Liens Rapides
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/70 hover:text-kabyle-gold transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="text-white/70 hover:text-kabyle-gold transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/order"
                  className="text-white/70 hover:text-kabyle-gold transition-colors"
                >
                  Commander
                </Link>
              </li>
            </ul>

            <h3 className="text-base font-semibold text-kabyle-gold mb-3 mt-6">
              Suivez-nous
            </h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-kabyle-terracotta hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/robe_kabyle_kenza/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-kabyle-terracotta hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Robe Kabyle Kenza. Tous droits
          réservés. Fait avec ❤ en Kabylie.
        </div>
      </div>
    </footer>
  );
}
