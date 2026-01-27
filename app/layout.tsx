import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#f8fafc]`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}