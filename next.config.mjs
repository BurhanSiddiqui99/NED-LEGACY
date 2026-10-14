/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com"],
  },
  // Role roots (used by breadcrumbs and logo links) have no page of their own
  async redirects() {
    return ["customer", "rider", "admin"].map((role) => ({
      source: `/${role}`,
      destination: `/${role}/dashboard`,
      permanent: false,
    }));
  },
  // Browsers still request /favicon.ico directly; serve the app icon instead of a 404
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
