"use client";

import { useEffect, useRef } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const ACTIVITY_STORAGE_KEY = "vitasta_last_activity";
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000; // Refresh token every 5 mins of active usage

function SessionInactivityGuard() {
  const { data: session, status, update } = useSession();
  const lastKeepAliveRef = useRef<number>(Date.now());
  const isSigningOutRef = useRef<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      isSigningOutRef.current = false;
      try {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      } catch {}
      return;
    }

    if (status !== "authenticated") return;

    const triggerAnotherDeviceLogout = () => {
      if (isSigningOutRef.current) return;
      isSigningOutRef.current = true;
      try {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      } catch {}
      toast("Signed out because your account was logged in on another device.", {
        icon: "🔒",
        duration: 5000,
      });
      signOut({ redirect: false });
    };

    if ((session as any)?.invalidated) {
      triggerAnotherDeviceLogout();
      return;
    }

    const triggerIdleLogout = () => {
      if (isSigningOutRef.current) return;
      isSigningOutRef.current = true;
      try {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      } catch {}
      toast("Session expired after 1 hour of inactivity. Please sign in again.", {
        icon: "🔒",
        duration: 4500,
      });
      signOut({ redirect: false });
    };

    const now = Date.now();
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored && now - Number(stored) >= INACTIVITY_LIMIT_MS) {
        triggerIdleLogout();
        return;
      }
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
    } catch {}

    let lastRecorded = now;
    let lastSessionVerify = now;

    const verifySingleSessionOnServer = () => {
      fetch("/api/hub-session", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.invalidated) {
            triggerAnotherDeviceLogout();
          }
        })
        .catch(() => {});
    };

    const handleUserActivity = () => {
      const current = Date.now();
      try {
        const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        const lastActive = stored ? Number(stored) : lastRecorded;
        if (current - lastActive >= INACTIVITY_LIMIT_MS) {
          triggerIdleLogout();
          return;
        }
      } catch {}

      // Throttle localStorage writes to every 10 seconds
      if (current - lastRecorded > 10_000) {
        lastRecorded = current;
        try {
          localStorage.setItem(ACTIVITY_STORAGE_KEY, String(current));
        } catch {}
      }

      // Only check single-session on the server when the user is actively interacting (at most once every 30s)
      if (current - lastSessionVerify > 30_000) {
        lastSessionVerify = current;
        verifySingleSessionOnServer();
      }

      // Slide server JWT expiration window forward if actively used after 5 mins
      if (current - lastKeepAliveRef.current >= KEEP_ALIVE_INTERVAL_MS) {
        lastKeepAliveRef.current = current;
        update().catch(() => {});
      }
    };

    // Pure client-side idle check (0 DB calls when user is inactive so Neon can auto-suspend)
    const checkInactivityOnly = () => {
      const current = Date.now();
      try {
        const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        const lastActive = stored ? Number(stored) : lastRecorded;
        if (current - lastActive >= INACTIVITY_LIMIT_MS) {
          triggerIdleLogout();
          return;
        }
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivityOnly();
        lastSessionVerify = Date.now();
        verifySingleSessionOnServer();
      }
    };

    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(checkInactivityOnly, 20_000);

    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleUserActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [status, session, update]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionInactivityGuard />
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#292524",
            color: "#fff",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 500,
          },
        }}
      />
    </SessionProvider>
  );
}
