import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClientProviders } from "@/providers/ClientProviders";
import { FooterNav } from "@/components/FooterNav";

export const metadata: Metadata = {
  title: "Personalize Connect — Sitecore Marketplace",
  description: "Link Page Builder components to Sitecore Personalize experiences",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme">
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <ClientProviders>
          <main className="flex-1">{children}</main>
          <FooterNav />
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
