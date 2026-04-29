import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DenCo AI Intake Assistant",
  description:
    "Turn messy landscaping inquiries into quote prep, client replies, and crew handoffs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
