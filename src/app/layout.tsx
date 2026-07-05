import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import AuthProvider from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Robe Kabyle Kenza - Robes Traditionnelles et Modernes",
  description:
    "Découvrez notre collection de robes kabyles traditionnelles et modernes. Broderies artisanales, tissus de qualité, livraison partout en Algérie. Qualité artisanale kabyle.",
  keywords: [
    "robe kabyle",
    "robe traditionnelle",
    "broderie kabyle",
    "mode algérienne",
    "artisanat kabyle",
    "robe cérémonie",
    " Algérie",
    "Tizi Ouzou",
    "Béjaïa",
  ],
  authors: [{ name: "Robe Kabyle Kenza" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Robe Kabyle Kenza - Robes Traditionnelles et Modernes",
    description:
      "Découvrez notre collection de robes kabyles traditionnelles et modernes. Broderies artisanales, tissus de qualité, livraison partout en Algérie.",
    type: "website",
    locale: "fr_DZ",
    siteName: "Robe Kabyle Kenza",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robe Kabyle Kenza",
    description:
      "Robes kabyles traditionnelles et modernes - Qualité artisanale",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
