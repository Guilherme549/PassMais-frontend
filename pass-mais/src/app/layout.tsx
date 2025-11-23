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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}
