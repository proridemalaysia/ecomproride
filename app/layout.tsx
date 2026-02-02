import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google"; // The premium TT5 font
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const instrument = Instrument_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: "--font-instrument",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} font-sans antialiased bg-[#ffffff] text-[#111111]`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}