import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'b2b.kraftdele.info',
      },
      {
        protocol: 'https',
        hostname: 'kraftdele.info',
      },
      {
        protocol: 'https',
        hostname: 'dawika.pl',
      },
      {
        protocol: 'https',
        hostname: 'prajo.eu',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
