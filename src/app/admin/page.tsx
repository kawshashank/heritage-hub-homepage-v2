"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Users,
  BarChart3,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowLeft,
  LogOut,
  Calendar,
  BookOpen,
  Sparkles,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import {
  getAdminDashboardData,
  adminVerifyUserEmail,
  adminDeleteUser,
} from "@/app/actions";

type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string | null;
  lastVisitedAt: string | null;
  vohorvodCount: number;
  shraadCount: number;
};

type DailyStatRow = {
  date: string; // YYYY-MM-DD
  registeredVisits: number;
  guestVisits: number;
};

const SUPER_ADMIN_EMAIL = "vitastahub@gmail.com";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeAgo(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Never";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function getIstYmd(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Builds a smooth monotone cubic Bezier SVG path & closed area path
 * that never overshoots below 0 or above peaks (Stripe / Google Analytics style).
 */
function buildSmoothSvgPaths(
  pts: Array<{ x: number; y: number }>,
  baselineY: number
): { linePath: string; areaPath: string } {
  if (pts.length === 0) return { linePath: "", areaPath: "" };
  if (pts.length === 1) {
    const p = pts[0];
    return {
      linePath: `M ${p.x} ${p.y}`,
      areaPath: `M ${p.x} ${baselineY} L ${p.x} ${p.y} L ${p.x} ${baselineY} Z`,
    };
  }

  const n = pts.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    dy[i] = pts[i + 1].y - pts[i].y;
    m[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = m[0];
  tangents[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (m[i - 1] + m[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const a = tangents[i] / m[i];
      const b = tangents[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        tangents[i] = t * a * m[i];
        tangents[i + 1] = t * b * m[i];
      }
    }
  }

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const segDx = dx[i] / 3;
    const cp1x = p0.x + segDx;
    const cp1y = Math.min(baselineY, p0.y + tangents[i] * segDx);
    const cp2x = p1.x - segDx;
    const cp2y = Math.min(baselineY, p1.y - tangents[i + 1] * segDx);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  const areaPath = `${d} L ${pts[n - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  return { linePath: d, areaPath };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"users" | "footfall">("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users Tab Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "verified" | "unverified" | "with_tithis"
  >("all");
  const [sortBy, setSortBy] = useState<
    "registered_desc" | "visited_desc" | "tithis_desc"
  >("registered_desc");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Footfall Tab Filter: 7d | 30d | 90d (3 months)
  const [footfallRange, setFootfallRange] = useState<7 | 30 | 90>(7);
  const [chartMetric, setChartMetric] = useState<
    "all" | "registered" | "guest" | "signups"
  >("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isAdmin = useMemo(() => {
    const email = session?.user?.email?.trim().toLowerCase();
    const role = (session?.user as any)?.role;
    return email === SUPER_ADMIN_EMAIL || role === "ADMIN";
  }, [session]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    const res = await getAdminDashboardData();
    if (res?.error) {
      setError(res.error);
    } else {
      setUsers(res.users || []);
      setDailyStats(res.dailyStats || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchDashboard();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, isAdmin]);

  // --- Summary Metrics ---
  const summary = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => Boolean(u.emailVerified)).length;
    const unverifiedUsers = totalUsers - verifiedUsers;
    const totalVohorvods = users.reduce((acc, u) => acc + u.vohorvodCount, 0);
    const totalShraads = users.reduce((acc, u) => acc + u.shraadCount, 0);

    const isVisitedWithin = (u: AdminUserRow, days: number) => {
      const refIso = u.lastVisitedAt || u.createdAt;
      if (!refIso) return false;
      return now - new Date(refIso).getTime() <= days * dayMs;
    };

    const active7d = users.filter((u) => isVisitedWithin(u, 7)).length;
    const active30d = users.filter((u) => isVisitedWithin(u, 30)).length;
    const active90d = users.filter((u) => isVisitedWithin(u, 90)).length;

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      totalVohorvods,
      totalShraads,
      totalTithis: totalVohorvods + totalShraads,
      active7d,
      active30d,
      active90d,
    };
  }, [users]);

  // --- Filtered & Sorted Users ---
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = users.filter((u) => {
      if (q) {
        const match =
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter === "verified" && !u.emailVerified) return false;
      if (statusFilter === "unverified" && u.emailVerified) return false;
      if (
        statusFilter === "with_tithis" &&
        u.vohorvodCount + u.shraadCount === 0
      )
        return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "visited_desc") {
        const tA = a.lastVisitedAt ? new Date(a.lastVisitedAt).getTime() : 0;
        const tB = b.lastVisitedAt ? new Date(b.lastVisitedAt).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === "tithis_desc") {
        return (
          b.vohorvodCount + b.shraadCount - (a.vohorvodCount + a.shraadCount)
        );
      }
      const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cB - cA;
    });
  }, [users, searchQuery, statusFilter, sortBy]);

  // --- Footfall Chart Series (7 Days / 30 Days / 90 Days) ---
  const footfallAnalytics = useMemo(() => {
    const statsByDate = new Map<string, DailyStatRow>();
    dailyStats.forEach((d) => statsByDate.set(d.date, d));

    const signupsByDate = new Map<string, number>();
    const activeUsersByDate = new Map<string, number>();

    users.forEach((u) => {
      if (u.createdAt) {
        const cKey = getIstYmd(new Date(u.createdAt));
        signupsByDate.set(cKey, (signupsByDate.get(cKey) || 0) + 1);
      }
      if (u.lastVisitedAt) {
        const vKey = getIstYmd(new Date(u.lastVisitedAt));
        activeUsersByDate.set(vKey, (activeUsersByDate.get(vKey) || 0) + 1);
      }
    });

    const days: Array<{
      date: string;
      label: string;
      shortLabel: string;
      registeredVisits: number;
      guestVisits: number;
      newSignups: number;
      totalVisits: number;
    }> = [];

    const now = new Date();
    for (let i = footfallRange - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ymd = getIstYmd(d);
      const stat = statsByDate.get(ymd);
      const signups = signupsByDate.get(ymd) || 0;
      const lastVisitCount = activeUsersByDate.get(ymd) || 0;

      // Ensure registeredVisits is at least the number of users whose lastVisitedAt or signup is on that day
      const regVisits = Math.max(
        stat?.registeredVisits || 0,
        lastVisitCount,
        signups
      );
      const gstVisits = stat?.guestVisits || 0;

      const label = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const shortLabel =
        footfallRange === 7
          ? d.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
            })
          : d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            });

      days.push({
        date: ymd,
        label,
        shortLabel,
        registeredVisits: regVisits,
        guestVisits: gstVisits,
        newSignups: signups,
        totalVisits: regVisits + gstVisits,
      });
    }

    // For 90 days (3 months), group into ~13 weekly bars for clean graphical display
    const chartBars =
      footfallRange === 90
        ? (() => {
            const buckets: typeof days = [];
            for (let i = 0; i < days.length; i += 7) {
              const slice = days.slice(i, i + 7);
              const first = slice[0];
              const last = slice[slice.length - 1];
              const reg = slice.reduce((a, b) => a + b.registeredVisits, 0);
              const gst = slice.reduce((a, b) => a + b.guestVisits, 0);
              const sgn = slice.reduce((a, b) => a + b.newSignups, 0);
              buckets.push({
                date: `${first.date} – ${last.date}`,
                label: `${first.label} – ${last.label}`,
                shortLabel: first.label,
                registeredVisits: reg,
                guestVisits: gst,
                newSignups: sgn,
                totalVisits: reg + gst,
              });
            }
            return buckets;
          })()
        : days;

    const maxBarValue = Math.max(
      1,
      ...chartBars.map((b) => b.totalVisits),
      ...chartBars.map((b) => b.newSignups)
    );

    const totalRegVisits = days.reduce((a, b) => a + b.registeredVisits, 0);
    const totalGuestVisits = days.reduce((a, b) => a + b.guestVisits, 0);
    const totalSignupsInWindow = days.reduce((a, b) => a + b.newSignups, 0);

    const cutoffMs = Date.now() - footfallRange * 24 * 60 * 60 * 1000;
    const visitingUsersInWindow = users.filter((u) => {
      const refIso = u.lastVisitedAt || u.createdAt;
      if (!refIso) return false;
      return new Date(refIso).getTime() >= cutoffMs;
    });

    return {
      chartBars,
      maxBarValue,
      totalRegVisits,
      totalGuestVisits,
      totalSignupsInWindow,
      visitingUsersInWindow,
    };
  }, [dailyStats, users, footfallRange]);

  const handleManualVerify = async (u: AdminUserRow) => {
    setBusyUserId(u.id);
    const res = await adminVerifyUserEmail(u.id);
    setBusyUserId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Verified ${u.email}!`);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === u.id
            ? { ...item, emailVerified: new Date().toISOString() }
            : item
        )
      );
    }
  };

  const handleDeleteUser = async (u: AdminUserRow) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${u.firstName} ${u.lastName} (${u.email}) and their saved tithis?`
      )
    )
      return;
    setBusyUserId(u.id);
    const res = await adminDeleteUser(u.id);
    setBusyUserId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Removed user ${u.email}.`);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email ID",
      "Registration Date",
      "Last Visited Date",
      "Email Verified",
      "Vohorvods Saved",
      "Shraads Saved",
    ];
    const rows = filteredUsers.map((u) => [
      `"${(u.firstName || "").replace(/"/g, '""')}"`,
      `"${(u.lastName || "").replace(/"/g, '""')}"`,
      `"${(u.email || "").replace(/"/g, '""')}"`,
      `"${formatDateTime(u.createdAt)}"`,
      `"${u.lastVisitedAt ? `${formatDateTime(u.lastVisitedAt)} ${formatTimeOnly(u.lastVisitedAt)}` : "Never"}"`,
      `"${u.emailVerified ? "Yes" : "No"}"`,
      u.vohorvodCount,
      u.shraadCount,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `vitasta_hub_users_${getIstYmd(new Date())}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-4 animate-pulse">
          <span className="text-amber-700 font-serif font-bold text-xl">ॐ</span>
        </div>
        <p className="text-sm font-serif font-bold text-stone-700">
          Loading Super Admin Console...
        </p>
      </div>
    );
  }

  if (!session?.user || !isAdmin || error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-800 mb-2">
            Super Admin Access Only
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
            {error ||
              "Please sign in on the homepage using the Super Admin account (vitastahub@gmail.com) to access this console."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kashmiri Heritage Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans pb-16">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#1c1614]/95 backdrop-blur-xl border-b border-amber-400/20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <span className="text-amber-400 font-serif font-bold text-lg">
                ॐ
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-sm sm:text-lg text-white truncate">
                  Vitasta Hub — Super Admin
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchDashboard}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/"
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Hub Home</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                Registered Users
              </span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {summary.totalUsers}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-semibold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {summary.verifiedUsers} Verified
              </span>
              {summary.unverifiedUsers > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {summary.unverifiedUsers} Pending
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                Saved Family Tithis
              </span>
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {summary.totalTithis}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-semibold text-stone-600">
              <span className="px-2 py-0.5 rounded-full bg-amber-50/90 text-[#6d3029] border border-amber-200/70">
                🎂 {summary.totalVohorvods} Vohorvod
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                🪔 {summary.totalShraads} Shraad
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                Active Users (7d)
              </span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {summary.active7d}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-2 font-medium">
              30d:{" "}
              <strong className="text-stone-800">{summary.active30d}</strong> ·
              90d:{" "}
              <strong className="text-stone-800">{summary.active90d}</strong>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                Avg Tithis / User
              </span>
              <TrendingUp className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {summary.totalUsers > 0
                ? (summary.totalTithis / summary.totalUsers).toFixed(1)
                : "0.0"}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-2 font-medium">
              Max capacity: 12 / user (6 + 6)
            </p>
          </div>
        </div>

        {/* Main Section Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="inline-flex p-1 rounded-2xl bg-stone-200/70 border border-stone-200">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "users"
                  ? "bg-[#2a1b18] text-amber-300 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Registered Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("footfall")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "footfall"
                  ? "bg-[#2a1b18] text-amber-300 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>User Footfall &amp; Growth</span>
            </button>
          </div>

          {activeTab === "users" && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              Export CSV
            </button>
          )}
        </div>

        {/* TAB 1: REGISTERED USERS TABLE */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
            {/* Search, Filter & Sort Toolbar */}
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by first name, last name, or email..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-[11px] font-bold">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "verified", label: "Verified" },
                      { id: "unverified", label: "Unverified" },
                      { id: "with_tithis", label: "Saved Tithis" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        statusFilter === f.id
                          ? "bg-amber-100 text-[#6d3029]"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="registered_desc">Sort: Newest Registered</option>
                  <option value="visited_desc">Sort: Recently Visited</option>
                  <option value="tithis_desc">Sort: Most Saved Tithis</option>
                </select>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="py-3.5 px-4">First Name</th>
                    <th className="py-3.5 px-4">Last Name</th>
                    <th className="py-3.5 px-4">Email ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">
                      Registered On
                    </th>
                    <th className="py-3.5 px-4 whitespace-nowrap">
                      Last Visited
                    </th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">
                      Email Verified
                    </th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">
                      Vohorvod Saved
                    </th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">
                      Shraad Saved
                    </th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-stone-400 font-medium"
                      >
                        No users match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuperAdminRow =
                        u.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-amber-50/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-stone-800 whitespace-nowrap">
                            {u.firstName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-stone-700 whitespace-nowrap">
                            {u.lastName}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-stone-700">
                                {u.email}
                              </span>
                              {isSuperAdminRow && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#6d3029] border border-amber-300 text-[9px] font-extrabold uppercase tracking-wider">
                                  Super Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                            <div className="font-semibold text-stone-800">
                              {formatDateTime(u.createdAt)}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {formatTimeOnly(u.createdAt)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {u.lastVisitedAt ? (
                              <div>
                                <div className="font-semibold text-stone-800">
                                  {formatDateTime(u.lastVisitedAt)}
                                </div>
                                <div className="text-[10px] text-amber-700 font-semibold">
                                  {formatRelativeAgo(u.lastVisitedAt)} ·{" "}
                                  {formatTimeOnly(u.lastVisitedAt)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-stone-400 italic">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {u.emailVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Yes
                              </span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  No
                                </span>
                                <button
                                  onClick={() => handleManualVerify(u)}
                                  disabled={busyUserId === u.id}
                                  className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-700 text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                                  title="Manually verify this user's email"
                                >
                                  Verify
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.vohorvodCount > 0
                                  ? "bg-amber-50 text-[#6d3029] border border-amber-200"
                                  : "bg-stone-100 text-stone-400"
                              }`}
                            >
                              {u.vohorvodCount} / 6
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.shraadCount > 0
                                  ? "bg-stone-800 text-amber-200"
                                  : "bg-stone-100 text-stone-400"
                              }`}
                            >
                              {u.shraadCount} / 6
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {!isSuperAdminRow ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={busyUserId === u.id}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-300 font-semibold">
                                Protected
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FOOTFALL & GROWTH GRAPHICAL VIEW */}
        {activeTab === "footfall" && (
          <div className="space-y-6">
            {/* Filter Controls + Window Summary */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 block mb-1">
                    Community Footfall Analytics
                  </span>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                    User Visits &amp; Registration Progression
                  </h2>
                </div>

                {/* 7 Days / 30 Days / 3 Months Filter */}
                <div className="inline-flex p-1 rounded-2xl bg-stone-100 border border-stone-200 self-start sm:self-auto">
                  {(
                    [
                      { days: 7, label: "Last 7 Days" },
                      { days: 30, label: "Last 30 Days" },
                      { days: 90, label: "Last 3 Months" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.days}
                      onClick={() => {
                        setFootfallRange(opt.days);
                        setHoveredIdx(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        footfallRange === opt.days
                          ? "bg-[#6d3029] text-white shadow-sm"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Period Summary Pills */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Unique Registered Users Visited
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#6d3029] mt-1">
                    {footfallAnalytics.visitingUsersInWindow.length}
                  </div>
                  <span className="text-[11px] text-amber-900/70">
                    In the last {footfallRange} days
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Logged-In User Sessions
                  </span>
                  <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
                    {footfallAnalytics.totalRegVisits}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Total active user visits
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Guest / Anonymous Visits
                  </span>
                  <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
                    {footfallAnalytics.totalGuestVisits}
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Unauthenticated daily visits
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    New Registrations
                  </span>
                  <div className="text-2xl font-serif font-bold text-emerald-900 mt-1">
                    +{footfallAnalytics.totalSignupsInWindow}
                  </div>
                  <span className="text-[11px] text-emerald-800/80">
                    Joined in last {footfallRange} days
                  </span>
                </div>
              </div>

              {/* Smooth Area / Line Trend Chart (Stripe / Google Analytics Style) */}
              {(() => {
                const items = footfallAnalytics.chartBars;
                const count = items.length;
                const activeIndex =
                  hoveredIdx !== null && hoveredIdx < count
                    ? hoveredIdx
                    : count - 1;
                const activeItem = items[activeIndex] || {
                  date: "",
                  label: "Today",
                  shortLabel: "Today",
                  registeredVisits: 0,
                  guestVisits: 0,
                  newSignups: 0,
                  totalVisits: 0,
                };

                // Compute nice integer Y-axis scale
                const rawMax = Math.max(
                  1,
                  ...items.map((b) =>
                    chartMetric === "registered"
                      ? b.registeredVisits
                      : chartMetric === "guest"
                        ? b.guestVisits
                        : chartMetric === "signups"
                          ? b.newSignups
                          : Math.max(
                              b.registeredVisits,
                              b.guestVisits,
                              b.newSignups
                            )
                  )
                );
                const yMax =
                  rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
                const yTicks = [yMax, (yMax * 3) / 4, yMax / 2, yMax / 4, 0];

                // SVG Coordinate system
                const svgW = 860;
                const svgH = 260;
                const padLeft = 42;
                const padRight = 22;
                const padTop = 22;
                const padBottom = 38;
                const plotW = svgW - padLeft - padRight;
                const plotH = svgH - padTop - padBottom;
                const baselineY = padTop + plotH;

                const getX = (i: number) =>
                  count <= 1
                    ? padLeft + plotW / 2
                    : padLeft + (i / (count - 1)) * plotW;
                const getY = (val: number) =>
                  baselineY - (Math.min(val, yMax) / yMax) * plotH;

                const regPoints = items.map((b, i) => ({
                  x: getX(i),
                  y: getY(b.registeredVisits),
                  val: b.registeredVisits,
                }));
                const guestPoints = items.map((b, i) => ({
                  x: getX(i),
                  y: getY(b.guestVisits),
                  val: b.guestVisits,
                }));
                const signupPoints = items.map((b, i) => ({
                  x: getX(i),
                  y: getY(b.newSignups),
                  val: b.newSignups,
                }));

                const regPaths = buildSmoothSvgPaths(regPoints, baselineY);
                const guestPaths = buildSmoothSvgPaths(guestPoints, baselineY);
                const signupPaths = buildSmoothSvgPaths(signupPoints, baselineY);

                const showRegistered =
                  chartMetric === "all" || chartMetric === "registered";
                const showGuest =
                  chartMetric === "all" || chartMetric === "guest";
                const showSignups =
                  chartMetric === "all" || chartMetric === "signups";

                const activeX = getX(activeIndex);

                return (
                  <div className="rounded-2xl border border-stone-200/90 bg-[#FAF8F5] p-4 sm:p-6 space-y-4">
                    {/* Top Interactive Readout + Metric Curve Selector */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
                      {/* Live Hovered / Selected Point Readout */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-[#2a1b18] text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{activeItem.label}</span>
                          {hoveredIdx === null && (
                            <span className="text-[10px] font-normal text-amber-300/80 ml-0.5">
                              (Latest)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200/90 font-semibold text-stone-700 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
                            Logged-In:{" "}
                            <strong className="text-stone-900">
                              {activeItem.registeredVisits}
                            </strong>
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200/90 font-semibold text-stone-700 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            Guest:{" "}
                            <strong className="text-stone-900">
                              {activeItem.guestVisits}
                            </strong>
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200/90 font-semibold text-stone-700 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            New Signups:{" "}
                            <strong className="text-emerald-700">
                              +{activeItem.newSignups}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Curve Filter Pills */}
                      <div className="inline-flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-[11px] font-bold self-start lg:self-auto">
                        {(
                          [
                            { id: "all", label: "All Curves" },
                            { id: "registered", label: "Logged-In Only" },
                            { id: "guest", label: "Guest Only" },
                            { id: "signups", label: "New Signups" },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setChartMetric(m.id)}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              chartMetric === m.id
                                ? "bg-amber-100 text-[#6d3029]"
                                : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Smooth Area & Line SVG Canvas */}
                    <div
                      className="relative w-full select-none"
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <svg
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        className="w-full h-60 sm:h-72 overflow-visible"
                      >
                        <defs>
                          {/* Saffron/Amber Area Gradient for Logged-In Visits */}
                          <linearGradient
                            id="regAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#d97706"
                              stopOpacity="0.34"
                            />
                            <stop
                              offset="65%"
                              stopColor="#d97706"
                              stopOpacity="0.08"
                            />
                            <stop
                              offset="100%"
                              stopColor="#d97706"
                              stopOpacity="0.0"
                            />
                          </linearGradient>

                          {/* Indigo Area Gradient for Guest Visits */}
                          <linearGradient
                            id="guestAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#6366f1"
                              stopOpacity="0.24"
                            />
                            <stop
                              offset="75%"
                              stopColor="#6366f1"
                              stopOpacity="0.05"
                            />
                            <stop
                              offset="100%"
                              stopColor="#6366f1"
                              stopOpacity="0.0"
                            />
                          </linearGradient>

                          {/* Emerald Area Gradient for New Signups */}
                          <linearGradient
                            id="signupAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#10b981"
                              stopOpacity="0.28"
                            />
                            <stop
                              offset="100%"
                              stopColor="#10b981"
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid Lines + Y-Axis Labels */}
                        {yTicks.map((tickVal, tIdx) => {
                          const yPos = getY(tickVal);
                          return (
                            <g key={tIdx}>
                              <line
                                x1={padLeft}
                                y1={yPos}
                                x2={svgW - padRight}
                                y2={yPos}
                                stroke={
                                  tickVal === 0 ? "#d6d3d1" : "#e7e5e4"
                                }
                                strokeWidth={tickVal === 0 ? 1.5 : 1}
                                strokeDasharray={
                                  tickVal === 0 ? undefined : "4 4"
                                }
                              />
                              <text
                                x={padLeft - 10}
                                y={yPos + 4}
                                textAnchor="end"
                                className="fill-stone-400 text-[11px] font-semibold"
                              >
                                {tickVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Vertical Crosshair Guide on Active/Hovered Point */}
                        <line
                          x1={activeX}
                          y1={padTop}
                          x2={activeX}
                          y2={baselineY}
                          stroke="#b45309"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          opacity={0.55}
                        />

                        {/* Guest Visits Area + Smooth Curve */}
                        {showGuest && (
                          <g>
                            <path
                              d={guestPaths.areaPath}
                              fill="url(#guestAreaGrad)"
                            />
                            <path
                              d={guestPaths.linePath}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )}

                        {/* New Signups Area + Smooth Curve */}
                        {showSignups && (
                          <g>
                            {chartMetric === "signups" && (
                              <path
                                d={signupPaths.areaPath}
                                fill="url(#signupAreaGrad)"
                              />
                            )}
                            <path
                              d={signupPaths.linePath}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth={chartMetric === "signups" ? 2.75 : 2}
                              strokeDasharray={
                                chartMetric === "all" ? "5 4" : undefined
                              }
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )}

                        {/* Logged-In Visits Area + Smooth Curve (Primary) */}
                        {showRegistered && (
                          <g>
                            <path
                              d={regPaths.areaPath}
                              fill="url(#regAreaGrad)"
                            />
                            <path
                              d={regPaths.linePath}
                              fill="none"
                              stroke="#b45309"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )}

                        {/* Data Points & X-Axis Labels */}
                        {items.map((bar, idx) => {
                          const cx = getX(idx);
                          const isHovered = idx === activeIndex;
                          const showXLabel =
                            footfallRange === 7
                              ? true
                              : footfallRange === 30
                                ? idx % 4 === 0 || idx === count - 1
                                : idx % 2 === 0 || idx === count - 1;

                          return (
                            <g key={bar.date}>
                              {/* Guest Dot */}
                              {showGuest && (
                                <circle
                                  cx={cx}
                                  cy={guestPoints[idx].y}
                                  r={
                                    isHovered
                                      ? 5.5
                                      : footfallRange === 30
                                        ? 2.5
                                        : 3.5
                                  }
                                  fill={isHovered ? "#4f46e5" : "#ffffff"}
                                  stroke="#6366f1"
                                  strokeWidth={isHovered ? 2.5 : 2}
                                />
                              )}

                              {/* New Signup Dot */}
                              {showSignups &&
                                (bar.newSignups > 0 ||
                                  chartMetric === "signups" ||
                                  isHovered) && (
                                  <circle
                                    cx={cx}
                                    cy={signupPoints[idx].y}
                                    r={
                                      isHovered
                                        ? 5.5
                                        : bar.newSignups > 0
                                          ? 4
                                          : 2.5
                                    }
                                    fill={
                                      bar.newSignups > 0 ? "#10b981" : "#ffffff"
                                    }
                                    stroke="#059669"
                                    strokeWidth={2}
                                  />
                                )}

                              {/* Logged-In Dot */}
                              {showRegistered && (
                                <>
                                  {isHovered && (
                                    <circle
                                      cx={cx}
                                      cy={regPoints[idx].y}
                                      r={10}
                                      fill="#d97706"
                                      opacity={0.2}
                                    />
                                  )}
                                  <circle
                                    cx={cx}
                                    cy={regPoints[idx].y}
                                    r={
                                      isHovered
                                        ? 6
                                        : footfallRange === 30
                                          ? 3
                                          : 4
                                    }
                                    fill={isHovered ? "#6d3029" : "#ffffff"}
                                    stroke="#b45309"
                                    strokeWidth={isHovered ? 2.5 : 2.2}
                                  />
                                </>
                              )}

                              {/* Value Badge directly above peak/active point */}
                              {(isHovered ||
                                (footfallRange !== 30 &&
                                  bar.totalVisits > 0)) && (
                                <text
                                  x={cx}
                                  y={
                                    Math.min(
                                      showRegistered
                                        ? regPoints[idx].y
                                        : baselineY,
                                      showGuest
                                        ? guestPoints[idx].y
                                        : baselineY,
                                      showSignups
                                        ? signupPoints[idx].y
                                        : baselineY
                                    ) - 10
                                  }
                                  textAnchor="middle"
                                  className={`text-[10px] font-bold ${
                                    isHovered
                                      ? "fill-[#6d3029]"
                                      : "fill-stone-500"
                                  }`}
                                >
                                  {chartMetric === "registered"
                                    ? bar.registeredVisits
                                    : chartMetric === "guest"
                                      ? bar.guestVisits
                                      : chartMetric === "signups"
                                        ? bar.newSignups
                                        : bar.totalVisits}
                                </text>
                              )}

                              {/* X-Axis Label */}
                              {showXLabel && (
                                <text
                                  x={cx}
                                  y={svgH - 10}
                                  textAnchor="middle"
                                  className={`text-[10px] font-semibold ${
                                    isHovered
                                      ? "fill-[#6d3029] font-bold"
                                      : "fill-stone-500"
                                  }`}
                                >
                                  {bar.shortLabel}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Invisible Full-Height Hit Columns for Effortless Hover / Touch */}
                        {items.map((bar, idx) => {
                          const colW = plotW / Math.max(1, count - 1);
                          const xStart = Math.max(
                            padLeft,
                            getX(idx) - colW / 2
                          );
                          return (
                            <rect
                              key={`hit-${bar.date}`}
                              x={xStart}
                              y={padTop}
                              width={colW}
                              height={plotH + padBottom}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredIdx(idx)}
                              onClick={() => setHoveredIdx(idx)}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Footer Legend & Hint */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                      <div className="flex flex-wrap items-center gap-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-[#b45309] inline-block rounded-full" />
                          <span className="w-2 h-2 rounded-full border-2 border-[#b45309] bg-white -ml-2.5" />
                          Logged-In Visits (Solid Saffron Curve)
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded-full" />
                          <span className="w-2 h-2 rounded-full border-2 border-indigo-500 bg-white -ml-2.5" />
                          Guest Visits (Solid Indigo Curve)
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          New Registrations (Dashed Emerald Curve)
                        </span>
                      </div>
                      <span className="text-stone-400">
                        Hover or tap anywhere along the timeline to inspect{" "}
                        {footfallRange === 90 ? "weekly" : "daily"} counts
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Registered Users Who Visited in Selected Period */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-800">
                    Registered Users Active in Last {footfallRange} Days (
                    {footfallAnalytics.visitingUsersInWindow.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Users who logged in or visited the Hub during this time
                    window
                  </p>
                </div>
              </div>

              {footfallAnalytics.visitingUsersInWindow.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-6 text-center">
                  No registered user visits recorded in this window yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {footfallAnalytics.visitingUsersInWindow.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {u.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100/80 text-[#6d3029] text-[10px] font-bold">
                          {formatRelativeAgo(u.lastVisitedAt || u.createdAt)}
                        </span>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {formatDateTime(u.lastVisitedAt || u.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
