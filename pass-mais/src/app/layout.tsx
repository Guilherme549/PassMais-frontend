import { Roboto } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Pass+",
    template: "%s | Pass+",
  },
  icons: {
    icon: [
      { url: "/icon-passmais.ico", sizes: "any" },
      // Se tiver outros formatos, pode adicionar:
      // { url: "/icon.svg", type: "image/svg+xml" },
      // { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      // { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: ["/icon-passmais.ico"],
  },
  
  // themeColor: "#0B5FFF", // opcional
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.className} ${roboto.variable} bg-gray-100`}>
        {children}
      </body>
    </html>
  );
}
