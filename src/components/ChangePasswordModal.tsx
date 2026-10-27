"use client";

import { useState } from "react";
import { X, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { changePassword } from "@/app/actions";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }
    if (newPass.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);

    const res = await changePassword(oldPass, newPass);
    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
      setLoading(false);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white border border-stone-200 rounded-[2rem] p-6 sm:p-8 shadow-2xl overflow-hidden z-10 my-4 text-left"
          >
            {isSuccess ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-1">
                  Password Updated!
                </h2>
                <p className="text-xs text-stone-500">
                  Your password was changed successfully. Signing you out...
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-700" />
                      Change Password
                    </h2>
                    <p className="text-stone-500 mt-1 text-xs">
                      Update your Heritage Hub account password.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex gap-2 text-xs font-semibold text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="Enter existing password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPass}
                      onChange={(e) => {
                        setNewPass(e.target.value);
                        setError("");
                      }}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPass}
                      onChange={(e) => {
                        setConfirmPass(e.target.value);
                        setError("");
                      }}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-to-r from-[#5a2a24] to-[#7d3730] text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
