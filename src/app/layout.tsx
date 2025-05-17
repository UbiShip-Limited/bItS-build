import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
