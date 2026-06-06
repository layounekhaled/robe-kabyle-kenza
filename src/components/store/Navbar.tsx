"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  LayoutDashboard,
  MonitorSpeaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="berber-border-bottom" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
              <Image
                src="/logo-kabyle.png"
                alt="Boutique Robes Kabyles"
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-kabyle-dark">
                Boutique Robes Kabyles
              </span>
            </div>
            <div className="sm:hidden">
              <span className="text-base font-bold text-kabyle-dark">BRK</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-kabyle-terracotta bg-kabyle-cream"
                    : "text-kabyle-dark hover:text-kabyle-terracotta hover:bg-kabyle-cream/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Admin Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-muted-foreground hover:text-kabyle-dark"
                >
                  <span className="text-xs">Espace Pro</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Administration
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pos" className="flex items-center gap-2">
                    <MonitorSpeaker className="h-4 w-4" />
                    Point de Vente
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Shopping Bag */}
            <Link href="/order">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-kabyle-dark hover:text-kabyle-terracotta"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="sr-only">Panier</span>
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-kabyle-dark"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-md text-base font-medium transition-colors",
                        pathname === link.href
                          ? "text-kabyle-terracotta bg-kabyle-cream"
                          : "text-kabyle-dark hover:text-kabyle-terracotta hover:bg-kabyle-cream/50"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="my-2 border-t" />
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-sm text-muted-foreground hover:text-kabyle-dark hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Administration
                  </Link>
                  <Link
                    href="/pos"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-sm text-muted-foreground hover:text-kabyle-dark hover:bg-muted"
                  >
                    <MonitorSpeaker className="h-4 w-4" />
                    Point de Vente
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
