import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Import the pleasant modern font
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased bg-[#fcfcfd]`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}