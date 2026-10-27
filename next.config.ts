import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/vohorvod",
        destination: "https://kashmiri-vohorvod.vercel.app"
      },
      {
        source: "/vohorvod/:path*",
        destination: "https://kashmiri-vohorvod.vercel.app/:path*"
      },
      {
        source: "/shraad",
        destination: "https://kashmiri-shraad.vercel.app"
      },
      {
        source: "/shraad/:path*",
        destination: "https://kashmiri-shraad.vercel.app/:path*"
      },
      {
        source: "/festivals",
        destination: "https://kashmiri-festivals.vercel.app"
      },
      {
        source: "/festivals/:path*",
        destination: "https://kashmiri-festivals.vercel.app/:path*"
      },
      {
        source: "/saath",
        destination: "https://saath-frontend.vercel.app"
      },
      {
        source: "/saath/:path*",
        destination: "https://saath-frontend.vercel.app/:path*"
      }
    ];
  }
};

export default nextConfig;
