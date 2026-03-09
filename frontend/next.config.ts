// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  // Suppress font loading warnings in development (fonts will fallback gracefully)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
};

export default withNextIntl(nextConfig);
