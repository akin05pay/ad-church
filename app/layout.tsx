import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://assembleia.church"),
  title: { default: "AD Church", template: "%s · AD Church" },
  description: "Bíblia, Harpa, culto e vida congregacional conectados à Assembleia de Deus Online.",
  applicationName: "AD Church",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "AD Church",
    title: "AD Church",
    description: "Bíblia, Harpa, culto e vida congregacional no mesmo caminho.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2447",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
