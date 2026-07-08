"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/order", label: "Commander" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Berber decorative top border */}
      <div className="berber-border-top" />
      <div
        className={cn(
          "transition-all duration-500 border-b",
          scrolled
            ? "bg-white/98 backdrop-blur-lg supports-[backdrop-filter]:bg-white/92 border-kabyle-terracotta/15 navbar-scrolled"
            : "bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-kabyle-terracotta/5"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between transition-all duration-500",
            scrolled ? "h-16" : "h-18"
          )}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className={cn(
                "relative overflow-hidden rounded-xl border-2 transition-all duration-500 group-hover:border-kabyle-terracotta/60 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-kabyle-terracotta/10",
                scrolled ? "h-10 w-10 border-kabyle-terracotta/30" : "h-11 w-11 border-kabyle-terracotta/20"
              )}>
                <Image
                  src="/logo-kabyle.png"
                  alt="Robe Kabyle Kenza"
                  fill
                  className="object-cover"
                  sizes="44px"
                  priority
                />
              </div>
              <div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-kabyle-dark tracking-tight">
                    Robe Kabyle
                  </span>
                  <span className="text-lg font-bold text-kabyle-terracotta ml-1">
                    Kenza
                  </span>
                </div>
                <div className="sm:hidden">
                  <span className="text-base font-bold text-kabyle-dark">RKK</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                    pathname === link.href
                      ? "text-kabyle-terracotta bg-kabyle-terracotta/10 shadow-sm shadow-kabyle-terracotta/5"
                      : "text-kabyle-dark/80 hover:text-kabyle-terracotta hover:bg-kabyle-cream/60"
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-kabyle-terracotta to-kabyle-gold rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Shopping Bag */}
              <Link href="/order">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative text-kabyle-dark hover:text-kabyle-terracotta hover:bg-kabyle-cream/50 rounded-full transition-all duration-300",
                    scrolled ? "h-9 w-9" : "h-10 w-10"
                  )}
                >
                  <ShoppingBag className={cn("transition-all duration-300", scrolled ? "h-4.5 w-4.5" : "h-5 w-5")} />
                  <span className="sr-only">Panier</span>
                </Button>
              </Link>

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-kabyle-dark hover:text-kabyle-terracotta hover:bg-kabyle-cream/50 h-10 w-10 rounded-full"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 pt-12 bg-white">
                  {/* Mobile berber accent */}
                  <div className="berber-border-top mb-6" />
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300",
                          pathname === link.href
                            ? "text-kabyle-terracotta bg-kabyle-terracotta/8 border-l-4 border-kabyle-terracotta"
                            : "text-kabyle-dark hover:text-kabyle-terracotta hover:bg-kabyle-cream/40 border-l-4 border-transparent"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="berber-border-bottom mt-6" />
                  {/* Mobile brand */}
                  <div className="mt-6 flex items-center gap-3 px-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-kabyle-terracotta/30">
                      <Image
                        src="/logo-kabyle.png"
                        alt="Robe Kabyle Kenza"
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-kabyle-dark">Robe Kabyle</span>
                      <span className="text-sm font-bold text-kabyle-terracotta ml-1">Kenza</span>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
