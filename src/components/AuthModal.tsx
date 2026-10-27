"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { X, Lock, Mail, User, KeyRound, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  registerUser,
  resendOtp,
  verifyOtp,
  sendPasswordResetOtpRequest,
  resetPasswordWithOtp,
} from "@/app/actions";

const ValidatedInput = ({
  name,
  type,
  label,
  placeholder,
  pattern,
  minLength,
  maxLength,
  title,
  required,
  customErrorMsg,
  autoComplete,
}: any) => {
  const [err, setErr] = useState("");
  const [touched, setTouched] = useState(false);

  const validate = (
    e: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>
  ) => {
    const el = e.target;
    if (!touched && e.type === "change") return;
    if (e.type === "blur") setTouched(true);

    if (el.validity.valueMissing) {
      setErr("This field is required.");
    } else if (el.validity.patternMismatch) {
      setErr(customErrorMsg || title || "Invalid format.");
    } else if (el.validity.tooShort) {
      setErr(`Minimum ${minLength} characters required.`);
    } else if (el.validity.typeMismatch) {
      setErr("Please enter a valid format.");
    } else {
      setErr("");
    }
  };

  return (
    <div className="w-full text-left">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        title={title}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onBlur={validate}
        onChange={validate}
        className={`w-full bg-stone-50 border ${
          err
            ? "border-rose-400 focus:ring-rose-500/30"
            : "border-stone-200 focus:border-amber-500 focus:ring-amber-500/30"
        } rounded-xl px-3.5 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all`}
      />
      {err && <p className="text-[11px] text-rose-600 mt-1 font-medium">{err}</p>}
    </div>
  );
};

export default function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
  onAuthSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
  onAuthSuccess?: () => void;
}) {
  const [view, setView] = useState<
    | "login"
    | "register"
    | "verify"
    | "forgot-password-request"
    | "forgot-password-reset"
  >(initialView);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setErrorMsg(null);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "Account not verified") {
        setOtpEmail(email);
        setView("verify");
        const otpRes = await resendOtp(email);
        if (otpRes?.error) {
          setErrorMsg(otpRes.error);
        } else {
          toast.success("Account not verified yet. A fresh 6-digit OTP has been sent to your email.");
        }
      } else {
        setErrorMsg("Incorrect Email ID or Password. Please try again.");
      }
      setLoading(false);
    } else {
      try {
        localStorage.setItem("vitasta_last_activity", String(Date.now()));
      } catch {}
      toast.success("Welcome back to Kashmiri Heritage Hub!");
      setLoading(false);
      onClose();
      if (onAuthSuccess) onAuthSuccess();
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return;

    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData(form);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();

    const res = await registerUser(formData);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      toast.success("Verification code sent to your email!");
      setOtpEmail(email);
      setView("verify");
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otpEmail) return;

    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp") as string;

    const res = await verifyOtp(otpEmail, otp);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      toast.success("Account verified! Please sign in.");
      setView("login");
      setLoading(false);
    }
  }

  async function handleForgotPasswordRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();

    const res = await sendPasswordResetOtpRequest(email);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      setOtpEmail(email);
      setView("forgot-password-reset");
      toast.success("Password reset code sent to your email.");
      setLoading(false);
    }
  }

  async function handleForgotPasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.append("email", otpEmail || "");

    const res = await resetPasswordWithOtp(formData);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      toast.success("Password updated! Please sign in.");
      setView("login");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
        <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-stone-200/80 overflow-hidden z-10 my-4"
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-[#2a1b18] via-[#4a2522] to-[#6d3029] px-6 py-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                  <span className="text-amber-400 font-serif font-bold text-sm leading-none">ॐ</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-amber-300/90 font-bold">
                  Family Tithi Vault
                </span>
              </div>

              <h2 className="text-2xl font-serif font-bold tracking-wide">
                {view === "login"
                  ? "Welcome Back"
                  : view === "register"
                  ? "Create an Account"
                  : view === "verify"
                  ? "Verify Your Email"
                  : "Reset Password"}
              </h2>
              <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                {view === "login"
                  ? "Sign in to view your saved family Vohorvod & Shraad dates."
                  : view === "register"
                  ? "Save your family's Vohorvod & Shraad dates so you never have to re-type them."
                  : view === "verify"
                  ? "Enter the 6-digit verification code sent to your email."
                  : "Securely recover access to your account."}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7">
              {view === "login" ? (
                <form key="login" onSubmit={handleLogin} className="space-y-4">
                  <ValidatedInput
                    type="email"
                    name="email"
                    label="Email ID"
                    required
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                  <ValidatedInput
                    type="password"
                    name="password"
                    label="Password"
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot-password-request");
                        setErrorMsg(null);
                      }}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#5a2a24] to-[#7d3730] hover:from-[#4a201b] hover:to-[#6d3029] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <div className="pt-2 text-center text-xs text-stone-500">
                    New to Heritage Hub?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setView("register");
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold underline underline-offset-2"
                    >
                      Create a free account
                    </button>
                  </div>
                </form>
              ) : view === "register" ? (
                <form key="register" onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <ValidatedInput
                      type="text"
                      name="firstName"
                      label="First Name"
                      required
                      placeholder="e.g. Rahul"
                      autoComplete="given-name"
                    />
                    <ValidatedInput
                      type="text"
                      name="lastName"
                      label="Last Name"
                      required
                      placeholder="e.g. Pandit"
                      autoComplete="family-name"
                    />
                  </div>

                  <ValidatedInput
                    type="email"
                    name="email"
                    label="Email ID"
                    customErrorMsg="Enter a valid email address"
                    required
                    placeholder="name@example.com"
                    autoComplete="email"
                  />

                  <ValidatedInput
                    type="password"
                    name="password"
                    label="Create Password"
                    minLength={8}
                    maxLength={32}
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />

                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-left">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      <strong>100% Private & Zero Spam:</strong> Your email is only used to secure your saved family dates.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Sending Verification OTP..." : "Create Account"}
                  </button>

                  <div className="pt-2 text-center text-xs text-stone-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold underline underline-offset-2"
                    >
                      Sign In here
                    </button>
                  </div>
                </form>
              ) : view === "verify" ? (
                <form key="verify" onSubmit={handleVerify} className="space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      We&apos;ve sent a 6-digit verification code to{" "}
                      <span className="font-bold text-stone-900">{otpEmail}</span>.
                    </p>
                    <ValidatedInput
                      type="text"
                      name="otp"
                      label="6-Digit Verification OTP"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      minLength={6}
                      customErrorMsg="Must be a 6-digit number"
                      required
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#5a2a24] to-[#7d3730] text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setErrorMsg(null);
                      }}
                      className="hover:text-stone-800 font-medium"
                    >
                      &larr; Back to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!otpEmail) return;
                        const r = await resendOtp(otpEmail);
                        if (r?.error) toast.error(r.error);
                        else toast.success("A new OTP has been sent to your email.");
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              ) : view === "forgot-password-request" ? (
                <form
                  key="forgot-password-request"
                  onSubmit={handleForgotPasswordRequest}
                  className="space-y-4"
                >
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Enter your registered Email ID and we will send you a 6-digit code to reset your password.
                  </p>
                  <ValidatedInput
                    type="email"
                    name="email"
                    label="Registered Email ID"
                    required
                    placeholder="name@example.com"
                    autoComplete="email"
                  />

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Sending Code..." : "Send Reset Code"}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setErrorMsg(null);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                    >
                      &larr; Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  key="forgot-password-reset"
                  onSubmit={handleForgotPasswordReset}
                  className="space-y-4"
                >
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-bold text-stone-900">{otpEmail}</span> and choose your new password.
                  </p>

                  <ValidatedInput
                    type="text"
                    name="otp"
                    label="6-Digit Reset Code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    minLength={6}
                    customErrorMsg="Must be a 6-digit number"
                    required
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />

                  <ValidatedInput
                    type="password"
                    name="newPassword"
                    label="New Password"
                    minLength={8}
                    maxLength={32}
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#5a2a24] to-[#7d3730] text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Updating Password..." : "Update Password"}
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setErrorMsg(null);
                      }}
                      className="hover:text-stone-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!otpEmail) return;
                        const r = await sendPasswordResetOtpRequest(otpEmail);
                        if (r?.error) toast.error(r.error);
                        else toast.success("A new reset code has been sent.");
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
