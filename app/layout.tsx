import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import ConditionalNav from "@/components/ConditionalNav";
import FatFooter from "@/components/FatFooter";
import ProfileCompletenessPrompt from "@/components/ProfileCompletenessPrompt";
import { Providers } from "@/components/Providers";
import type { Locale } from "@/contexts/LocaleContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "BM SP. Z O.O. - Household Products & Professional Tools",
  description: "Your trusted partner for household products and professional tools in Poland. Offering both retail and wholesale pricing.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en';

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        <Providers initialLocale={locale}>
          <ConditionalNav initialLocale={locale} />
          <ProfileCompletenessPrompt />
          {children}
          <FatFooter />
        </Providers>
      </body>
    </html>
  );
}
