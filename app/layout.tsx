import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chassis Pro Malaysia | Suspension & Handling Specialist",
  description: "Malaysia's leading hub for performance suspension. Authorized dealer for Proride, KYB, APM, 4Flex, and FTuned. Expert handling solutions for all car models.",
  keywords: ["KYB Malaysia", "Proride Suspension", "4Flex Spring", "APM Shock Absorber", "Performance Suspension Malaysia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {/* The CartProvider allows the shopping cart to "remember" items 
            no matter which page the user navigates to. */}
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}