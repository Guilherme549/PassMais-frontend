import "./globals.css";
import type { Metadata } from "next";
import { SessionWatcher } from "@/components/SessionWatcher";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className={`${roboto.className} ${roboto.variable} bg-gray-100`}>
        <SessionWatcher />
        {children}
      </body>
    </html>
  );
}
