import crypto from "crypto";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!rawEmail || !password) {
          throw new Error("Invalid email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: rawEmail },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Account not verified");
        }

        // Single-Session Enforcement (Option 1):
        // Delete any existing active session(s) for this user and issue a fresh sessionToken in one transaction
        const sessionToken = crypto.randomUUID();
        await prisma.$transaction([
          prisma.session.deleteMany({
            where: { userId: user.id },
          }),
          prisma.session.create({
            data: {
              userId: user.id,
              sessionToken,
              expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
          }),
        ]);

        return {
          id: user.id,
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.name ||
            user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          sessionToken,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour of non-usage
    updateAge: 5 * 60, // Slide expiration window every 5 mins when active
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;

        // Verify this JWT's sessionToken is still the single active session in DB
        if (token.sessionToken) {
          const activeSession = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken as string },
            select: { id: true, userId: true, expires: true },
          });

          const now = Date.now();
          if (
            !activeSession ||
            activeSession.userId !== token.sub ||
            activeSession.expires.getTime() < now
          ) {
            (session as any).invalidated = true;
          } else if (activeSession.expires.getTime() - now < 55 * 60 * 1000) {
            // Only write to DB when >5 minutes have elapsed since last slide
            await prisma.session
              .update({
                where: { id: activeSession.id },
                data: { expires: new Date(now + 60 * 60 * 1000) },
              })
              .catch(() => {});
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.sessionToken = (user as any).sessionToken;
      }
      return token;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionToken) {
        await prisma.session
          .deleteMany({ where: { sessionToken: token.sessionToken as string } })
          .catch(() => {});
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
