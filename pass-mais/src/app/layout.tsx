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
      <body suppressHydrationWarning className={`${roboto.className} ${roboto.variable} bg-gray-100`}>
        {children}
      </body>
    </html>
  );
}
