"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
    const user = await getAuthenticatedUser();
    if (!user) return { vohorvods: [], shraads: [] };

    const [vohorvods, shraads] = await Promise.all([
      prisma.savedVohorvod.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.savedShraad.findMany({
        where: { userId: user.id },
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
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Please sign in to save records." };

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
      const existing = await prisma.savedVohorvod.findUnique({ where: { id: data.id } });
      if (!existing || existing.userId !== user.id) {
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
      revalidatePath("/");
      return { success: true, item: updated };
    } else {
      const currentCount = await prisma.savedVohorvod.count({
        where: { userId: user.id },
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
          userId: user.id,
        },
      });
      revalidatePath("/");
      return { success: true, item: created };
    }
  } catch (err: any) {
    console.error("saveVohorvodRecord error:", err);
    return { error: err.message || "Failed to save Vohorvod record." };
  }
}

export async function deleteVohorvodRecord(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Not authenticated." };

    const existing = await prisma.savedVohorvod.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { error: "Record not found or unauthorized." };
    }

    await prisma.savedVohorvod.delete({ where: { id } });
    revalidatePath("/");
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
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Please sign in to save records." };

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
      const existing = await prisma.savedShraad.findUnique({ where: { id: data.id } });
      if (!existing || existing.userId !== user.id) {
        return { error: "Record not found or unauthorized." };
      }
      const updated = await prisma.savedShraad.update({
        where: { id: data.id },
        data: payload,
      });
      revalidatePath("/");
      return { success: true, item: updated };
    } else {
      const currentCount = await prisma.savedShraad.count({
        where: { userId: user.id },
      });
      if (currentCount >= MAX_SAVED_PER_CATEGORY) {
        return {
          error: `You can store up to ${MAX_SAVED_PER_CATEGORY} Shraads right now. We plan to expand this in the future!`,
        };
      }

      const created = await prisma.savedShraad.create({
        data: {
          ...payload,
          userId: user.id,
        },
      });
      revalidatePath("/");
      return { success: true, item: created };
    }
  } catch (err: any) {
    console.error("saveShraadRecord error:", err);
    return { error: err.message || "Failed to save Shraad record." };
  }
}

export async function deleteShraadRecord(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Not authenticated." };

    const existing = await prisma.savedShraad.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { error: "Record not found or unauthorized." };
    }

    await prisma.savedShraad.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("deleteShraadRecord error:", err);
    return { error: "Failed to delete record." };
  }
}
