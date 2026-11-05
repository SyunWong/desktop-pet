import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Desktop releases use next start; keep development output separate.
  distDir: process.env.WHALE_DESKTOP_BUILD === '1' ? '.next-desktop' : '.next',
  output: process.env.WHALE_DESKTOP_BUILD === '1' ? undefined : 'standalone',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDir,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
