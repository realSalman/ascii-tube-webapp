import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASCII Video Player",
  description: "Experience video like never before.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
