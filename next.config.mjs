/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole app is plain HTML/JS files that GitHub Pages can host.
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  reactStrictMode: true,
};
export default nextConfig;
