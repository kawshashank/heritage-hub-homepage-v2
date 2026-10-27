"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    try {
      localStorage.removeItem("vitasta_last_activity");
    } catch {}
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-amber-700 font-serif font-bold text-xl">ॐ</span>
      </div>
      <h2 className="font-serif font-bold text-xl text-stone-800 mb-1">Signing you out...</h2>
      <p className="text-xs text-stone-500">Redirecting back to Kashmiri Heritage Hub</p>
    </div>
  );
}
