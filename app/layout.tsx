import type { Metadata } from "next";
// 1. Import the font
import { Funnel_Sans } from "next/font/google";
import "./globals.css";

// 2. Configure the font (subsets are required)
const funnel = Funnel_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShiftSnap",
  description: "Sync your work schedule to Google Calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class to the body */}
      <body className={funnel.className}>
        {children}
      </body>
    </html>
  );
}