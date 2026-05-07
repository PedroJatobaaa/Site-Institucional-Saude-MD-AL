import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Se o seu arquivo na pasta components estiver com N maiúsculo (Navbar.tsx), mude aqui para '@/components/Navbar'
import Navbar from '@/components/navbar'; 
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Isso aqui vai aparecer lá no topo da aba do navegador!
export const metadata: Metadata = {
  title: "Portal da Saúde | Marechal Deodoro",
  description: "Portal Institucional da Secretaria Municipal de Saúde de Marechal Deodoro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* A Mágica acontece aqui: a Navbar entra antes do conteúdo (children) da página */}
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}