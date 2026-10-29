import crypto from "crypto";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  prisma,
  SUPER_ADMIN_EMAIL,
  ensureTrackingSchema,
  getIstDateStr,
} from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SUPER_ADMIN_INITIAL_PASS = "vitHub199)";

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

        await ensureTrackingSchema();

        let user = await prisma.user.findUnique({
          where: { email: rawEmail },
        });

        // Auto-provision Super Admin account on first login
        if (!user && rawEmail === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_INITIAL_PASS) {
          const hashedPassword = await bcrypt.hash(SUPER_ADMIN_INITIAL_PASS, 10);
          user = await prisma.user.create({
            data: {
              firstName: "Vitasta",
              lastName: "Admin",
              name: "Vitasta Admin",
              email: SUPER_ADMIN_EMAIL,
              password: hashedPassword,
              emailVerified: new Date(),
              role: "ADMIN",
            },
          });
        }

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Ensure vitastahub@gmail.com always has ADMIN role and verified status
        if (rawEmail === SUPER_ADMIN_EMAIL && (user.role !== "ADMIN" || !user.emailVerified)) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              role: "ADMIN",
              emailVerified: user.emailVerified || new Date(),
            },
          });
        }

        if (!user.emailVerified) {
          throw new Error("Account not verified");
        }

        // Single-Session Enforcement (Option 1) + update lastVisitedAt in one transaction
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
          prisma.$executeRaw`UPDATE "User" SET "lastVisitedAt" = NOW() WHERE "id" = ${user.id}`,
        ]);

        const effectiveRole =
          rawEmail === SUPER_ADMIN_EMAIL ? "ADMIN" : user.role || "USER";

        return {
          id: user.id,
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.name ||
            user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: effectiveRole,
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
        (session.user as any).role =
          token.role ||
          (session.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
            ? "ADMIN"
            : "USER");

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
        token.role = (user as any).role;
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
