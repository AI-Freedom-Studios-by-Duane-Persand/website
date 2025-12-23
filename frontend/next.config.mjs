const nextConfig = {
  eslint: {
    // Lint via npm run lint when desired; skip during build to avoid blocking on legacy options
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
