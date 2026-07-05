import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Init from "./Init";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Satisfactory Calculator",
  description: "Plan Satisfactory factories: pick a product and rate, get the recipe tree."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Init />
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
