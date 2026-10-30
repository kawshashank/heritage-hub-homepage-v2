"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import {
  prisma,
  SUPER_ADMIN_EMAIL,
  ensureTrackingSchema,
  getIstDateStr,
} from "@/lib/prisma";
import { sendEmailOTP, sendPasswordResetOTP } from "@/lib/email";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if ((session as any)?.invalidated) return null;
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return await prisma.user.findUnique({ where: { email } });
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if ((session as any)?.invalidated) return null;
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  if (sessionUserId) return sessionUserId;

  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function registerUser(formData: FormData) {
  try {
    const firstName = (formData.get("firstName") as string || "").trim();
    const lastName = (formData.get("lastName") as string || "").trim();
    const email = (formData.get("email") as string || "").trim().toLowerCase();
    const password = (formData.get("password") as string || "");

    if (!firstName || !lastName || !email || !password) {
      return { error: "Please fill in all required fields." };
    }

    if (password.length < 8 || password.length > 32) {
      return { error: "Password must be between 8 and 32 characters." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Resend OTP if they previously registered but haven't verified yet
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: {
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            password: hashedPassword,
          },
        });
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });
        const otp = generateOTP();
        const expires = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.verificationToken.create({
          data: { identifier: email, token: otp, expires },
        });
        await sendEmailOTP(email, otp);
        return { success: true };
      }
      return { error: "An account with this Email ID is already registered." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        password: hashedPassword,
      },
    });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    await sendEmailOTP(email, otp);
    return { success: true };
  } catch (err: any) {
    console.error("registerUser error:", err);
    return { error: err.message || "Failed to create account. Please try again." };
  }
}

export async function resendOtp(rawEmail: string) {
  try {
    const email = (rawEmail || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Account not found." };
    if (user.emailVerified) return { error: "Account is already verified." };

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    await sendEmailOTP(email, otp);
    return { success: true };
  } catch (err: any) {
    console.error("resendOtp error:", err);
    return { error: err.message || "Failed to resend OTP." };
  }
}

export async function verifyOtp(rawEmail: string, rawOtp: string) {
  try {
    const email = (rawEmail || "").trim().toLowerCase();
    const otp = (rawOtp || "").trim();

    if (!/^\d{6}$/.test(otp)) {
      return { error: "Please enter a valid 6-digit OTP." };
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: otp,
      },
    });

    if (!tokenRecord) {
      return { error: "Invalid OTP. Please check your email and try again." };
    }

    if (tokenRecord.expires < new Date()) {
      return { error: "This OTP has expired. Please request a new one." };
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: otp,
        },
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("verifyOtp error:", err);
    return { error: err.message || "Failed to verify OTP." };
  }
}

export async function sendPasswordResetOtpRequest(rawEmail: string) {
  try {
    const email = (rawEmail || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "No account found with this Email ID." };
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    await sendPasswordResetOTP(email, otp);
    return { success: true };
  } catch (err: any) {
    console.error("sendPasswordResetOtpRequest error:", err);
    return { error: err.message || "Failed to send reset code." };
  }
}

export async function resetPasswordWithOtp(formData: FormData) {
  try {
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const otp = ((formData.get("otp") as string) || "").trim();
    const newPassword = (formData.get("newPassword") as string) || "";

    if (!email || !/^\d{6}$/.test(otp) || newPassword.length < 8) {
      return { error: "Please provide a valid 6-digit code and a password of at least 8 characters." };
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: otp,
      },
    });

    if (!tokenRecord) {
      return { error: "Invalid 6-digit reset code." };
    }

    if (tokenRecord.expires < new Date()) {
      return { error: "Reset code has expired. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Also verify email if not already verified
      },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: otp,
        },
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("resetPasswordWithOtp error:", err);
    return { error: err.message || "Failed to reset password." };
  }
}

export async function changePassword(oldPass: string, newPass: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.password) {
      return { error: "Not authenticated." };
    }

    if (!newPass || newPass.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) {
      return { error: "Incorrect existing password." };
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  } catch (err: any) {
    console.error("changePassword error:", err);
    return { error: err.message || "Failed to update password." };
  }
}

// --- Saved Family Records Actions ---

export async function getSavedRecords() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { vohorvods: [], shraads: [] };

    const [vohorvods, shraads] = await Promise.all([
      prisma.savedVohorvod.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.savedShraad.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { vohorvods, shraads };
  } catch (err) {
    console.error("getSavedRecords error:", err);
    return { vohorvods: [], shraads: [] };
  }
}

const MAX_SAVED_PER_CATEGORY = 6;

export async function saveVohorvodRecord(data: {
  id?: string;
  personName: string;
  mode: "by_dob" | "by_tithi";
  dob?: string;
  lunarMonth?: string;
  paksha?: string;
  tithi?: string;
}) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Please sign in to save records." };

    const personName = (data.personName || "").trim();
    if (!personName) return { error: "Please enter the person's name." };

    if (data.mode === "by_dob") {
      if (!data.dob || !/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) {
        return { error: "Please select a valid Date of Birth." };
      }
    } else if (data.mode === "by_tithi") {
      if (!data.lunarMonth || !data.paksha || !data.tithi) {
        return { error: "Please select the Kashmiri Month, Paksha, and Tithi." };
      }
    } else {
      return { error: "Invalid calculation mode." };
    }

    if (data.id) {
      const existing = await prisma.savedVohorvod.findUnique({
        where: { id: data.id },
        select: { userId: true },
      });
      if (!existing || existing.userId !== userId) {
        return { error: "Record not found or unauthorized." };
      }
      const updated = await prisma.savedVohorvod.update({
        where: { id: data.id },
        data: {
          personName,
          mode: data.mode,
          dob: data.mode === "by_dob" ? data.dob : null,
          lunarMonth: data.mode === "by_tithi" ? data.lunarMonth : null,
          paksha: data.mode === "by_tithi" ? data.paksha : null,
          tithi: data.mode === "by_tithi" ? data.tithi : null,
        },
      });
      return { success: true, item: updated };
    } else {
      const currentCount = await prisma.savedVohorvod.count({
        where: { userId },
      });
      if (currentCount >= MAX_SAVED_PER_CATEGORY) {
        return {
          error: `You can store up to ${MAX_SAVED_PER_CATEGORY} Vohorvods right now. We plan to expand this in the future!`,
        };
      }

      const created = await prisma.savedVohorvod.create({
        data: {
          personName,
          mode: data.mode,
          dob: data.mode === "by_dob" ? data.dob : null,
          lunarMonth: data.mode === "by_tithi" ? data.lunarMonth : null,
          paksha: data.mode === "by_tithi" ? data.paksha : null,
          tithi: data.mode === "by_tithi" ? data.tithi : null,
          userId,
        },
      });
      return { success: true, item: created };
    }
  } catch (err: any) {
    console.error("saveVohorvodRecord error:", err);
    return { error: err.message || "Failed to save Vohorvod record." };
  }
}

export async function deleteVohorvodRecord(id: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Not authenticated." };

    const deleted = await prisma.savedVohorvod.deleteMany({
      where: { id, userId },
    });
    if (deleted.count === 0) {
      return { error: "Record not found or unauthorized." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteVohorvodRecord error:", err);
    return { error: "Failed to delete record." };
  }
}

export async function saveShraadRecord(data: {
  id?: string;
  personName: string;
  deathDate: string;
  knowsTime?: boolean;
  deathHour?: string;
  deathMin?: string;
  deathAmPm?: string;
  timezone?: string;
}) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Please sign in to save records." };

    const personName = (data.personName || "").trim();
    if (!personName) return { error: "Please enter the departed soul's name." };

    if (!data.deathDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.deathDate)) {
      return { error: "Please select a valid English Date of Passing." };
    }

    const payload = {
      personName,
      deathDate: data.deathDate,
      knowsTime: Boolean(data.knowsTime),
      deathHour: data.knowsTime ? (data.deathHour || "01") : null,
      deathMin: data.knowsTime ? (data.deathMin || "00") : null,
      deathAmPm: data.knowsTime ? (data.deathAmPm || "AM") : null,
      timezone: data.timezone || "Delhi, India (IST)",
    };

    if (data.id) {
      const existing = await prisma.savedShraad.findUnique({
        where: { id: data.id },
        select: { userId: true },
      });
      if (!existing || existing.userId !== userId) {
        return { error: "Record not found or unauthorized." };
      }
      const updated = await prisma.savedShraad.update({
        where: { id: data.id },
        data: payload,
      });
      return { success: true, item: updated };
    } else {
      const currentCount = await prisma.savedShraad.count({
        where: { userId },
      });
      if (currentCount >= MAX_SAVED_PER_CATEGORY) {
        return {
          error: `You can store up to ${MAX_SAVED_PER_CATEGORY} Shraads right now. We plan to expand this in the future!`,
        };
      }

      const created = await prisma.savedShraad.create({
        data: {
          ...payload,
          userId,
        },
      });
      return { success: true, item: created };
    }
  } catch (err: any) {
    console.error("saveShraadRecord error:", err);
    return { error: err.message || "Failed to save Shraad record." };
  }
}

export async function deleteShraadRecord(id: string) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Not authenticated." };

    const deleted = await prisma.savedShraad.deleteMany({
      where: { id, userId },
    });
    if (deleted.count === 0) {
      return { error: "Record not found or unauthorized." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteShraadRecord error:", err);
    return { error: "Failed to delete record." };
  }
}

// --- Footfall & Super Admin Actions ---

export async function recordDailyVisit(
  mode: "guest" | "user",
  convertedFromGuest = false
) {
  try {
    await ensureTrackingSchema();
    const todayIst = getIstDateStr();

    if (mode === "user") {
      const session = await getServerSession(authOptions);
      if ((session as any)?.invalidated || !session?.user) {
        return { ok: false };
      }
      const userId = (session.user as any).id as string | undefined;
      const email = session.user.email?.trim().toLowerCase() || "";
      const role = (session.user as any).role;
      if (!userId) return { ok: false };

      const isAdmin = email === SUPER_ADMIN_EMAIL || role === "ADMIN";

      if (isAdmin) {
        // Update admin's lastVisitedAt for the Users directory, but NEVER count admin in footfall stats.
        // If this browser recorded a guest visit before admin signed in today, undo that guest count.
        if (convertedFromGuest) {
          await prisma.$transaction([
            prisma.$executeRaw`UPDATE "User" SET "lastVisitedAt" = NOW() WHERE "id" = ${userId}`,
            prisma.$executeRaw`
              UPDATE "DailyStat"
              SET "guestVisits" = GREATEST(0, "guestVisits" - 1),
                  "updatedAt" = NOW()
              WHERE "date" = ${todayIst}
            `,
          ]);
        } else {
          await prisma.$executeRaw`UPDATE "User" SET "lastVisitedAt" = NOW() WHERE "id" = ${userId}`;
        }
        return { ok: true, isAdmin: true };
      }

      // Regular non-admin user: increment registeredVisits once per day,
      // and if they were counted as a guest earlier today in the same browser, convert that guest visit.
      const guestDelta = convertedFromGuest ? -1 : 0;
      await prisma.$transaction([
        prisma.$executeRaw`UPDATE "User" SET "lastVisitedAt" = NOW() WHERE "id" = ${userId}`,
        prisma.$executeRaw`
          INSERT INTO "DailyStat" ("date", "registeredVisits", "guestVisits", "updatedAt")
          VALUES (${todayIst}, 1, 0, NOW())
          ON CONFLICT ("date") DO UPDATE
          SET "registeredVisits" = "DailyStat"."registeredVisits" + 1,
              "guestVisits" = GREATEST(0, "DailyStat"."guestVisits" + ${guestDelta}),
              "updatedAt" = NOW()
        `,
      ]);
      return { ok: true };
    } else {
      // Guest visit: double-check session on server so a logged-in user or admin is never counted as guest
      const session = await getServerSession(authOptions);
      if (session?.user && !(session as any)?.invalidated) {
        return { ok: false };
      }

      await prisma.$executeRaw`
        INSERT INTO "DailyStat" ("date", "registeredVisits", "guestVisits", "updatedAt")
        VALUES (${todayIst}, 0, 1, NOW())
        ON CONFLICT ("date") DO UPDATE
        SET "guestVisits" = "DailyStat"."guestVisits" + 1,
            "updatedAt" = NOW()
      `;
      return { ok: true };
    }
  } catch {
    return { ok: false };
  }
}

async function assertSuperAdmin() {
  const session = await getServerSession(authOptions);
  if ((session as any)?.invalidated || !session?.user) return null;
  const email = session.user.email?.trim().toLowerCase();
  const role = (session.user as any).role;
  if (email === SUPER_ADMIN_EMAIL || role === "ADMIN") {
    return session.user;
  }
  return null;
}

export async function getAdminDashboardData() {
  try {
    const admin = await assertSuperAdmin();
    if (!admin) {
      return { error: "Unauthorized. Super Admin access required." };
    }

    await ensureTrackingSchema();

    const [rawUsers, rawDailyStats] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
          name: string | null;
          email: string | null;
          role: string | null;
          emailVerified: Date | null;
          createdAt: Date;
          lastVisitedAt: Date | null;
          vohorvodCount: bigint | number;
          shraadCount: bigint | number;
        }>
      >`
        SELECT
          u."id",
          u."firstName",
          u."lastName",
          u."name",
          u."email",
          u."role",
          u."emailVerified",
          u."createdAt",
          u."lastVisitedAt",
          (SELECT COUNT(*) FROM "SavedVohorvod" v WHERE v."userId" = u."id") AS "vohorvodCount",
          (SELECT COUNT(*) FROM "SavedShraad" s WHERE s."userId" = u."id") AS "shraadCount"
        FROM "User" u
        ORDER BY u."createdAt" DESC
      `,
      prisma.$queryRaw<
        Array<{
          date: string;
          registeredVisits: number;
          guestVisits: number;
        }>
      >`
        SELECT "date", "registeredVisits", "guestVisits"
        FROM "DailyStat"
        ORDER BY "date" ASC
      `,
    ]);

    const users = rawUsers.map((u) => {
      const fallbackParts = (u.name || "").trim().split(/\s+/);
      return {
        id: u.id,
        firstName: u.firstName || fallbackParts[0] || "—",
        lastName:
          u.lastName ||
          (fallbackParts.length > 1 ? fallbackParts.slice(1).join(" ") : "—"),
        email: u.email || "—",
        role:
          u.email?.toLowerCase() === SUPER_ADMIN_EMAIL
            ? "ADMIN"
            : u.role || "USER",
        emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        lastVisitedAt: u.lastVisitedAt
          ? new Date(u.lastVisitedAt).toISOString()
          : null,
        vohorvodCount: Number(u.vohorvodCount || 0),
        shraadCount: Number(u.shraadCount || 0),
      };
    });

    const dailyStats = rawDailyStats.map((d) => ({
      date: d.date,
      registeredVisits: Number(d.registeredVisits || 0),
      guestVisits: Number(d.guestVisits || 0),
    }));

    return {
      users,
      dailyStats,
    };
  } catch (err: any) {
    console.error("getAdminDashboardData error:", err);
    return { error: err.message || "Failed to load admin data." };
  }
}

export async function adminVerifyUserEmail(targetUserId: string) {
  try {
    const admin = await assertSuperAdmin();
    if (!admin) return { error: "Unauthorized." };

    await prisma.user.update({
      where: { id: targetUserId },
      data: { emailVerified: new Date() },
    });

    return { success: true };
  } catch (err: any) {
    console.error("adminVerifyUserEmail error:", err);
    return { error: err.message || "Failed to verify user." };
  }
}

export async function adminDeleteUser(targetUserId: string) {
  try {
    const admin = await assertSuperAdmin();
    if (!admin) return { error: "Unauthorized." };

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true },
    });
    if (!target) return { error: "User not found." };
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      return { error: "Cannot delete the Super Admin account." };
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return { success: true };
  } catch (err: any) {
    console.error("adminDeleteUser error:", err);
    return { error: err.message || "Failed to delete user." };
  }
}
