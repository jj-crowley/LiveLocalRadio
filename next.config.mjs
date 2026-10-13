/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  },
  async headers() {
    const commonHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff"
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin"
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), geolocation=(), microphone=()"
      }
    ];

    return [
      {
        source: "/(.*)",
        headers: commonHeaders
      },
      {
        source: "/((?!embed/band/video).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
