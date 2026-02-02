import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chassis Pro Malaysia | Suspension Specialist",
  description: "Modern handling solutions for all Malaysian vehicles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#fcfcfd] text-slate-900`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}