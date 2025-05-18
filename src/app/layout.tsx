import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";

export const metadata: Metadata = {
  title: "Bowen Island Tattoo",
  description: "Victorian Gothic meets Modern Minimalism - A private tattoo studio on Bowen Island",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />
        <main className="pt-16 md:pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
