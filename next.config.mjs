/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude html2pdf.js from server-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      };
    }
    // Exclude an-lotto folder from build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/an-lotto/**'],
    };
    return config;
  },
};

export default nextConfig;
