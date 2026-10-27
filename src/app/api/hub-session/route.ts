import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALLOWED_ORIGINS = [
  "https://vitastahub.vercel.app",
  "https://kashmiri-vohorvod.vercel.app",
  "https://kashmiri-shraad.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"))
      ? origin
      : "https://vitastahub.vercel.app";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const session = await getServerSession(authOptions);

  return NextResponse.json(
    {
      authenticated: Boolean(session?.user),
      user: session?.user
        ? {
            name: session.user.name,
            email: session.user.email,
            firstName: (session.user as any).firstName,
          }
        : null,
    },
    {
      headers: getCorsHeaders(origin),
    }
  );
}
