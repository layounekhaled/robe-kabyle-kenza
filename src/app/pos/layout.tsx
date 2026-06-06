"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ShoppingBag } from "lucide-react";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-kabyle-terracotta mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isStaff =
    (session.user as { role?: string })?.role === "admin" ||
    (session.user as { role?: string })?.role === "cashier";

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-destructive mb-2">
            Accès non autorisé
          </p>
          <p className="text-muted-foreground mb-4">
            Vous n&apos;avez pas les droits nécessaires pour accéder à la caisse.
          </p>
          <Button onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b bg-kabyle-terracotta text-kabyle-cream flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" />
          <h1 className="text-lg font-bold tracking-tight">
            Caisse - Boutique Robes Kabyles
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">
            {session.user?.name || "Utilisateur"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-kabyle-cream hover:bg-kabyle-terracotta/80 hover:text-kabyle-cream h-9"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
