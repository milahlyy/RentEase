import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentEase",
  description: "P2P rental marketplace for trusted item rentals in Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
