import { Roboto } from 'next/font/google';
import "./globals.css";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-roboto',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={`${roboto.className} bg-gray-100`}>
        {children}
      </body>
    </html >
  );
}
