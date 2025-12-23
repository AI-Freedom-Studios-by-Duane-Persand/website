const nextConfig = {
  eslint: {
    // Lint via npm run lint when desired; skip during build to avoid blocking on legacy options
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy /api/* to internal backend at 127.0.0.1:3001
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:3001/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
