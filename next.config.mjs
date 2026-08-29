/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits .next/standalone with a self-contained server.js, which is what the
  // Dockerfile ships instead of the whole node_modules tree.
  output: 'standalone',
};

export default nextConfig;
