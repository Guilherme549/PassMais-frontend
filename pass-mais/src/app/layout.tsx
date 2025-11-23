import "./globals.css";
import type { Metadata } from "next";
import { SessionWatcher } from "@/components/SessionWatcher";

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
<<<<<<< HEAD
      <body suppressHydrationWarning className="bg-gray-100">
=======
      <body suppressHydrationWarning className={`${roboto.className} ${roboto.variable} bg-gray-100`}>
        <SessionWatcher />
>>>>>>> fbf6171 (Refactor tratando erros de build)
        {children}
      </body>
    </html>
  );
}
