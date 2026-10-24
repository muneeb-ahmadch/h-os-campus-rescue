import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "H·OS — Campus Rescue",
  description: "A little foresight. A calmer campus. Connected knowledge, sourced decisions and human-approved event recovery.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
