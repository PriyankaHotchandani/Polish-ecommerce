import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNav from "@/components/ConditionalNav";
import ProfileCompletenessPrompt from "@/components/ProfileCompletenessPrompt";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BM SP. Z O.O. - Household Products & Professional Tools",
  description: "Your trusted partner for household products and professional tools in Poland. Offering both retail and wholesale pricing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ConditionalNav />
          <ProfileCompletenessPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
