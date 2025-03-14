/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  compiler: {
    styledComponents: true
  }
};

export default nextConfig;
