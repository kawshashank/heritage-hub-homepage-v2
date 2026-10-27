"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  X,
  Info,
  Sparkles,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  getSavedRecords,
  saveVohorvodRecord,
  deleteVohorvodRecord,
  saveShraadRecord,
  deleteShraadRecord,
} from "@/app/actions";

const ENG_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const VOHORVOD_MONTHS = [
  "Chetra",
  "Vaisakh",
  "Zeth",
  "Haar",
  "Shravun",
  "Bhadrapeth",
  "Ashid",
  "Kartik",
  "Monjhor",
  "Poh",
  "Magh",
  "Phagun",
];

const VOHORVOD_PAKSHAS = ["Zoon Pachh (Bright)", "Gatta Pachh (Dark)"];

const VOHORVOD_TITHIS = [
  "Pratipada",
  "Duya",
  "Truya",
  "Chorum",
  "Ponchum",
  "Sheyam",
  "Satam",
  "Ashtami",
  "Navam",
  "Dahom",
  "Kahyom",
  "Duvadashi",
  "Truvahsh",
  "Chodah",
  "Purnima/Amavasya",
];

const SHRAAD_TIMEZONES = [
  "Delhi, India (IST)",
  "New York, USA (EST/EDT)",
  "London, UK (GMT/BST)",
  "Dubai, UAE (GST)",
  "Singapore (SGT)",
  "Toronto, CAN (EST/EDT)",
  "San Francisco, USA (PST/PDT)",
  "Sydney, AUS (AEST/AEDT)",
];

function formatDateReadable(ymd?: string | null) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  const mIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${ENG_MONTHS[mIdx] || m} ${y}`;
}

export default function SavedRecordsSection({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName?: string | null;
}) {
  const [vohorvods, setVohorvods] = useState<any[]>([]);
  const [shraads, setShraads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileVaultTab, setMobileVaultTab] = useState<"vohorvod" | "shraad">("vohorvod");

  // Vohorvod Modal State
  const [vohorvodModalOpen, setVohorvodModalOpen] = useState(false);
  const [editingVohorvodId, setEditingVohorvodId] = useState<string | undefined>(undefined);
  const [vName, setVName] = useState("");
  const [vMode, setVMode] = useState<"by_dob" | "by_tithi">("by_dob");
  const [vDob, setVDob] = useState("");
  const [vDay, setVDay] = useState("");
  const [vMonth, setVMonth] = useState("");
  const [vYear, setVYear] = useState("");
  const [vLunarMonth, setVLunarMonth] = useState(VOHORVOD_MONTHS[0]);
  const [vPaksha, setVPaksha] = useState(VOHORVOD_PAKSHAS[0]);
  const [vTithi, setVTithi] = useState(VOHORVOD_TITHIS[0]);
  const [savingV, setSavingV] = useState(false);

  // Shraad Modal State
  const [shraadModalOpen, setShraadModalOpen] = useState(false);
  const [editingShraadId, setEditingShraadId] = useState<string | undefined>(undefined);
  const [sName, setSName] = useState("");
  const [sDate, setSDate] = useState("");
  const [sDay, setSDay] = useState("");
  const [sMonth, setSMonth] = useState("");
  const [sYear, setSYear] = useState("");
  const [sKnowsTime, setSKnowsTime] = useState(false);
  const [sHour, setSHour] = useState("01");
  const [sMin, setSMin] = useState("00");
  const [sAmPm, setSAmPm] = useState("AM");
  const [sTimezone, setSTimezone] = useState(SHRAAD_TIMEZONES[0]);
  const [savingS, setSavingS] = useState(false);

  const currentYear = new Date().getFullYear();

  const loadRecords = async () => {
    setLoading(true);
    const res = await getSavedRecords();
    setVohorvods(res.vohorvods || []);
    setShraads(res.shraads || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userEmail) {
      loadRecords();
    }
  }, [userEmail]);

  // Sync Vohorvod mobile dropdowns -> vDob
  const handleVDateDropdown = (field: "day" | "month" | "year", val: string) => {
    const nextD = field === "day" ? val : vDay;
    const nextM = field === "month" ? val : vMonth;
    const nextY = field === "year" ? val : vYear;
    if (field === "day") setVDay(val);
    if (field === "month") setVMonth(val);
    if (field === "year") setVYear(val);
    if (nextD && nextM && nextY) {
      setVDob(`${nextY}-${String(nextM).padStart(2, "0")}-${String(nextD).padStart(2, "0")}`);
    }
  };

  const handleVDesktopDate = (val: string) => {
    setVDob(val);
    if (val) {
      const [y, m, d] = val.split("-");
      setVYear(y || "");
      setVMonth(m ? String(parseInt(m, 10)) : "");
      setVDay(d ? String(parseInt(d, 10)) : "");
    }
  };

  // Sync Shraad mobile dropdowns -> sDate
  const handleSDateDropdown = (field: "day" | "month" | "year", val: string) => {
    const nextD = field === "day" ? val : sDay;
    const nextM = field === "month" ? val : sMonth;
    const nextY = field === "year" ? val : sYear;
    if (field === "day") setSDay(val);
    if (field === "month") setSMonth(val);
    if (field === "year") setSYear(val);
    if (nextD && nextM && nextY) {
      setSDate(`${nextY}-${String(nextM).padStart(2, "0")}-${String(nextD).padStart(2, "0")}`);
    }
  };

  const handleSDesktopDate = (val: string) => {
    setSDate(val);
    if (val) {
      const [y, m, d] = val.split("-");
      setSYear(y || "");
      setSMonth(m ? String(parseInt(m, 10)) : "");
      setSDay(d ? String(parseInt(d, 10)) : "");
    }
  };

  const MAX_RECORDS = 6;

  const openAddVohorvod = () => {
    if (vohorvods.length >= MAX_RECORDS) {
      toast("You can currently store up to 6 Vohorvods. We plan to expand this in the future!", {
        icon: "ℹ️",
      });
      return;
    }
    setEditingVohorvodId(undefined);
    setVName("");
    setVMode("by_dob");
    setVDob("");
    setVDay("");
    setVMonth("");
    setVYear("");
    setVLunarMonth(VOHORVOD_MONTHS[0]);
    setVPaksha(VOHORVOD_PAKSHAS[0]);
    setVTithi(VOHORVOD_TITHIS[0]);
    setVohorvodModalOpen(true);
  };

  const openEditVohorvod = (item: any) => {
    setEditingVohorvodId(item.id);
    setVName(item.personName);
    setVMode(item.mode === "by_tithi" ? "by_tithi" : "by_dob");
    if (item.dob) {
      handleVDesktopDate(item.dob);
    } else {
      setVDob("");
      setVDay("");
      setVMonth("");
      setVYear("");
    }
    setVLunarMonth(item.lunarMonth || VOHORVOD_MONTHS[0]);
    setVPaksha(item.paksha || VOHORVOD_PAKSHAS[0]);
    setVTithi(item.tithi || VOHORVOD_TITHIS[0]);
    setVohorvodModalOpen(true);
  };

  const handleSaveVohorvod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingV(true);
    const res = await saveVohorvodRecord({
      id: editingVohorvodId,
      personName: vName,
      mode: vMode,
      dob: vMode === "by_dob" ? vDob : undefined,
      lunarMonth: vMode === "by_tithi" ? vLunarMonth : undefined,
      paksha: vMode === "by_tithi" ? vPaksha : undefined,
      tithi: vMode === "by_tithi" ? vTithi : undefined,
    });
    setSavingV(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(editingVohorvodId ? "Vohorvod updated!" : "Vohorvod saved!");
      setVohorvodModalOpen(false);
      loadRecords();
    }
  };

  const handleDeleteVohorvod = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}'s saved Vohorvod?`)) return;
    const res = await deleteVohorvodRecord(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Removed from Saved Vohorvods.");
      setVohorvods((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const openAddShraad = () => {
    if (shraads.length >= MAX_RECORDS) {
      toast("You can currently store up to 6 Shraads. We plan to expand this in the future!", {
        icon: "ℹ️",
      });
      return;
    }
    setEditingShraadId(undefined);
    setSName("");
    setSDate("");
    setSDay("");
    setSMonth("");
    setSYear("");
    setSKnowsTime(false);
    setSHour("01");
    setSMin("00");
    setSAmPm("AM");
    setSTimezone(SHRAAD_TIMEZONES[0]);
    setShraadModalOpen(true);
  };

  const openEditShraad = (item: any) => {
    setEditingShraadId(item.id);
    setSName(item.personName);
    handleSDesktopDate(item.deathDate || "");
    setSKnowsTime(Boolean(item.knowsTime));
    setSHour(item.deathHour || "01");
    setSMin(item.deathMin || "00");
    setSAmPm(item.deathAmPm || "AM");
    setSTimezone(item.timezone || SHRAAD_TIMEZONES[0]);
    setShraadModalOpen(true);
  };

  const handleSaveShraad = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingS(true);
    const res = await saveShraadRecord({
      id: editingShraadId,
      personName: sName,
      deathDate: sDate,
      knowsTime: sKnowsTime,
      deathHour: sHour,
      deathMin: sMin,
      deathAmPm: sAmPm,
      timezone: sTimezone,
    });
    setSavingS(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(editingShraadId ? "Shraad updated!" : "Shraad saved!");
      setShraadModalOpen(false);
      loadRecords();
    }
  };

  const handleDeleteShraad = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}'s saved Shraad?`)) return;
    const res = await deleteShraadRecord(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Removed from Saved Shraads.");
      setShraads((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    setIsLocal(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  const getVohorvodBase = () => (isLocal ? "http://localhost:3001" : "/vohorvod");
  const getShraadBase = () => (isLocal ? "http://localhost:3002" : "/shraad");

  const buildVohorvodUrl = (item: any) => {
    const params = new URLSearchParams();
    params.set("autofill", "1");
    params.set("name", item.personName);
    params.set("mode", item.mode || "by_dob");
    if (item.mode === "by_tithi") {
      if (item.lunarMonth) params.set("month", item.lunarMonth);
      if (item.paksha) params.set("paksha", item.paksha);
      if (item.tithi) params.set("tithi", item.tithi);
    } else if (item.dob) {
      params.set("dob", item.dob);
    }
    if (userName) params.set("hub_user", userName);
    return `${getVohorvodBase()}?${params.toString()}`;
  };

  const buildShraadUrl = (item: any) => {
    const params = new URLSearchParams();
    params.set("autofill", "1");
    params.set("name", item.personName);
    params.set("date", item.deathDate);
    if (item.timezone) params.set("tz", item.timezone);
    if (item.knowsTime) {
      params.set("knows_time", "1");
      if (item.deathHour) params.set("hr", item.deathHour);
      if (item.deathMin) params.set("min", item.deathMin);
      if (item.deathAmPm) params.set("ampm", item.deathAmPm);
    }
    if (userName) params.set("hub_user", userName);
    return `${getShraadBase()}?${params.toString()}`;
  };

  return (
    <div id="saved-family-tithis" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-16 pt-2 sm:pt-6 pb-2">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-[0_12px_35px_-10px_rgba(109,48,41,0.08)] p-3.5 sm:p-7">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-4 border-b border-stone-200/70">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles className="w-3 h-3" />
              Personal Family Vault
            </div>
            <h2 className="text-base sm:text-2xl font-serif font-bold text-stone-800 leading-snug">
              My Saved Vohorvods &amp; Shraads
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Tap any saved entry below to auto-fill the calculator.
            </p>
          </div>

          {/* Mobile Segmented Switcher (cuts vertical scroll in half on mobile!) */}
          <div className="flex lg:hidden bg-stone-100 p-1 rounded-xl border border-stone-200/80 mt-1">
            <button
              type="button"
              onClick={() => setMobileVaultTab("vohorvod")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileVaultTab === "vohorvod"
                  ? "bg-[#6d3029] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Vohorvods ({vohorvods.length}/{MAX_RECORDS})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileVaultTab("shraad")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileVaultTab === "shraad"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Shraads ({shraads.length}/{MAX_RECORDS})</span>
            </button>
          </div>
        </div>

        {/* Two Columns on Laptop/Desktop, Tabbed Single Box on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-5">
          {/* 1. SAVED VOHORVODS */}
          <div
            className={`${
              mobileVaultTab === "vohorvod" ? "flex" : "hidden lg:flex"
            } bg-[#FDFBF7] border border-stone-200/90 rounded-2xl p-3 sm:p-5 flex-col`}
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-100/70 text-[#6d3029] flex items-center justify-center border border-amber-200/80 shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm sm:text-lg text-stone-800 leading-tight truncate">
                    Saved Vohorvods <span className="text-xs font-sans font-semibold text-stone-400">({vohorvods.length}/{MAX_RECORDS})</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">Lunar Birthdays (By DOB or Tithi)</p>
                </div>
              </div>
              <button
                onClick={openAddVohorvod}
                className={`inline-flex items-center justify-center gap-1 h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all shrink-0 active:scale-95 ${
                  vohorvods.length >= MAX_RECORDS
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-[#6d3029] hover:bg-[#5a2a24] text-amber-50"
                }`}
              >
                {vohorvods.length >= MAX_RECORDS ? (
                  <span>Max {MAX_RECORDS}/{MAX_RECORDS}</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                    <span className="hidden sm:inline">Vohorvod</span>
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="py-5 text-center text-xs text-stone-400 animate-pulse">
                Loading saved Vohorvods...
              </div>
            ) : vohorvods.length === 0 ? (
              <div className="py-4 sm:py-6 px-3 text-center border border-dashed border-stone-200 rounded-xl bg-white/60 my-auto">
                <p className="text-xs font-semibold text-stone-600 mb-0.5">
                  No Vohorvods saved yet
                </p>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto mb-2">
                  Save family members by their English DOB or Kashmiri Tithi.
                </p>
                <button
                  onClick={openAddVohorvod}
                  className="text-xs font-bold text-[#6d3029] hover:underline"
                >
                  + Save your first Vohorvod
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[215px] sm:max-h-[260px] overflow-y-auto pr-0.5">
                {vohorvods.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white border border-stone-200/90 hover:border-amber-400 rounded-xl px-3 py-2.5 sm:p-3.5 flex items-center justify-between gap-2 shadow-xs hover:shadow-md transition-all"
                  >
                    <a
                      href={buildVohorvodUrl(item)}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-stone-800 group-hover:text-[#6d3029] transition-colors truncate">
                          {item.personName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 truncate">
                          <span className="font-semibold text-amber-800/90">
                            {item.mode === "by_tithi" ? "Tithi:" : "DOB:"}
                          </span>
                          <span className="truncate">
                            {item.mode === "by_tithi"
                              ? `${item.lunarMonth} • ${item.paksha?.split(" ")[0]} • ${item.tithi}`
                              : formatDateReadable(item.dob)}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#6d3029] bg-amber-50/90 group-hover:bg-[#6d3029] group-hover:text-white w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg transition-colors shrink-0">
                        <span className="hidden sm:inline">Calculate</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </a>

                    <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 border-l border-stone-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditVohorvod(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVohorvod(item.id, item.personName)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SAVED SHRAADS */}
          <div
            className={`${
              mobileVaultTab === "shraad" ? "flex" : "hidden lg:flex"
            } bg-[#FDFBF7] border border-stone-200/90 rounded-2xl p-3 sm:p-5 flex-col`}
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-200/80 text-slate-800 flex items-center justify-center border border-slate-300/80 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm sm:text-lg text-stone-800 leading-tight truncate">
                    Saved Shraads <span className="text-xs font-sans font-semibold text-stone-400">({shraads.length}/{MAX_RECORDS})</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">Ancestral Remembrance Tithis</p>
                </div>
              </div>
              <button
                onClick={openAddShraad}
                className={`inline-flex items-center justify-center gap-1 h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all shrink-0 active:scale-95 ${
                  shraads.length >= MAX_RECORDS
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {shraads.length >= MAX_RECORDS ? (
                  <span>Max {MAX_RECORDS}/{MAX_RECORDS}</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                    <span className="hidden sm:inline">Shraad</span>
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="py-5 text-center text-xs text-stone-400 animate-pulse">
                Loading saved Shraads...
              </div>
            ) : shraads.length === 0 ? (
              <div className="py-4 sm:py-6 px-3 text-center border border-dashed border-stone-200 rounded-xl bg-white/60 my-auto">
                <p className="text-xs font-semibold text-stone-600 mb-0.5">
                  No Shraads saved yet
                </p>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto mb-2">
                  Save departed loved ones&apos; dates of passing to check in one tap.
                </p>
                <button
                  onClick={openAddShraad}
                  className="text-xs font-bold text-slate-800 hover:underline"
                >
                  + Save your first Shraad
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[215px] sm:max-h-[260px] overflow-y-auto pr-0.5">
                {shraads.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white border border-stone-200/90 hover:border-slate-400 rounded-xl px-3 py-2.5 sm:p-3.5 flex items-center justify-between gap-2 shadow-xs hover:shadow-md transition-all"
                  >
                    <a
                      href={buildShraadUrl(item)}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-stone-800 group-hover:text-slate-900 transition-colors truncate">
                          {item.personName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 truncate">
                          <span className="truncate">
                            Passed: {formatDateReadable(item.deathDate)}
                            {item.knowsTime ? ` • ${item.deathHour}:${item.deathMin} ${item.deathAmPm}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg transition-colors shrink-0">
                        <span className="hidden sm:inline">Calculate</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </a>

                    <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 border-l border-stone-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditShraad(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShraad(item.id, item.personName)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtle Capacity Footer */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-stone-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
          <span>Up to {MAX_RECORDS} entries per category • Expanding capacity soon</span>
        </div>
      </div>

      {/* --- ADD / EDIT VOHORVOD MODAL --- */}
      <AnimatePresence>
        {vohorvodModalOpen && (
          <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setVohorvodModalOpen(false)}
                className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-7 shadow-2xl border border-stone-200 z-10 my-4 text-left"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 block">
                      Vohorvod Calculator
                    </span>
                    <h3 className="text-xl font-serif font-bold text-stone-800">
                      {editingVohorvodId ? "Edit Saved Vohorvod" : "Save a Family Vohorvod"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setVohorvodModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveVohorvod} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Person&apos;s Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                      placeholder="e.g. Aarav / Mother"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  {/* Mode Selector: By DOB vs By Tithi */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      How would you like to save it?
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setVMode("by_dob")}
                        className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
                          vMode === "by_dob"
                            ? "bg-white text-[#6d3029] shadow-xs"
                            : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        By Actual DOB
                      </button>
                      <button
                        type="button"
                        onClick={() => setVMode("by_tithi")}
                        className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
                          vMode === "by_tithi"
                            ? "bg-white text-[#6d3029] shadow-xs"
                            : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        By Lunar Tithi
                      </button>
                    </div>
                  </div>

                  {vMode === "by_dob" ? (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                        Actual Date of Birth <span className="text-rose-600">*</span>
                      </label>
                      {/* Desktop date input */}
                      <div className="hidden sm:block">
                        <input
                          type="date"
                          required
                          value={vDob}
                          onChange={(e) => handleVDesktopDate(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                      {/* Mobile Day/Month/Year dropdowns */}
                      <div className="grid grid-cols-3 gap-2 sm:hidden">
                        <select
                          required
                          value={vDay}
                          onChange={(e) => handleVDateDropdown("day", e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                        >
                          <option value="" disabled>
                            Day
                          </option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={String(d)}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          required
                          value={vMonth}
                          onChange={(e) => handleVDateDropdown("month", e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                        >
                          <option value="" disabled>
                            Month
                          </option>
                          {ENG_MONTHS.map((m, idx) => (
                            <option key={m} value={String(idx + 1)}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          required
                          value={vYear}
                          onChange={(e) => handleVDateDropdown("year", e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                        >
                          <option value="" disabled>
                            Year
                          </option>
                          {Array.from({ length: currentYear - 1923 }, (_, i) => currentYear - i).map(
                            (y) => (
                              <option key={y} value={String(y)}>
                                {y}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                          Kashmiri Month
                        </label>
                        <select
                          value={vLunarMonth}
                          onChange={(e) => setVLunarMonth(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800"
                        >
                          {VOHORVOD_MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                          Paksha
                        </label>
                        <select
                          value={vPaksha}
                          onChange={(e) => setVPaksha(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800"
                        >
                          {VOHORVOD_PAKSHAS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                          Birth Tithi
                        </label>
                        <select
                          value={vTithi}
                          onChange={(e) => setVTithi(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800"
                        >
                          {VOHORVOD_TITHIS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingV}
                    className="w-full py-3.5 bg-gradient-to-r from-[#5a2a24] to-[#7d3730] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
                  >
                    {savingV ? "Saving..." : editingVohorvodId ? "Update Vohorvod" : "Save Vohorvod"}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD / EDIT SHRAAD MODAL --- */}
      <AnimatePresence>
        {shraadModalOpen && (
          <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShraadModalOpen(false)}
                className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-7 shadow-2xl border border-stone-200 z-10 my-4 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block">
                      Shraad Calculator
                    </span>
                    <h3 className="text-xl font-serif font-bold text-stone-800">
                      {editingShraadId ? "Edit Saved Shraad" : "Save a Family Shraad"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShraadModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Helpful Tip for users who only know Year & Tithi */}
                <div className="mb-4 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Only know the Year &amp; Lunar Tithi?</strong> Check the exact English date of passing first using{" "}
                    <a
                      href={`${getShraadBase()}?tab=reverse${userName ? `&hub_user=${encodeURIComponent(userName)}` : ""}`}
                      className="font-bold underline text-[#6d3029] hover:text-black"
                    >
                      Reverse Lookup in the Shraad Calculator &rarr;
                    </a>{" "}
                    and then save that date here!
                  </p>
                </div>

                <form onSubmit={handleSaveShraad} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Name of Departed Soul <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      placeholder="e.g. Late Pt. Ram Joo"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Actual Date of Passing <span className="text-rose-600">*</span>
                    </label>
                    <div className="hidden sm:block">
                      <input
                        type="date"
                        required
                        value={sDate}
                        onChange={(e) => handleSDesktopDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:hidden">
                      <select
                        required
                        value={sDay}
                        onChange={(e) => handleSDateDropdown("day", e.target.value)}
                        className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                      >
                        <option value="" disabled>
                          Day
                        </option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select
                        required
                        value={sMonth}
                        onChange={(e) => handleSDateDropdown("month", e.target.value)}
                        className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                      >
                        <option value="" disabled>
                          Month
                        </option>
                        {ENG_MONTHS.map((m, idx) => (
                          <option key={m} value={String(idx + 1)}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        required
                        value={sYear}
                        onChange={(e) => handleSDateDropdown("year", e.target.value)}
                        className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-3 text-sm text-stone-800"
                      >
                        <option value="" disabled>
                          Year
                        </option>
                        {Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i).map(
                          (y) => (
                            <option key={y} value={String(y)}>
                              {y}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                      Timezone of Passing
                    </label>
                    <select
                      value={sTimezone}
                      onChange={(e) => setSTimezone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800"
                    >
                      {SHRAAD_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sKnowsTime}
                        onChange={(e) => setSKnowsTime(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 rounded"
                      />
                      <span className="text-xs font-semibold text-stone-700">
                        I know the exact time of passing (Optional)
                      </span>
                    </label>
                    {sKnowsTime && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <select
                          value={sHour}
                          onChange={(e) => setSHour(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-800"
                        >
                          {Array.from({ length: 12 }, (_, i) =>
                            String(i + 1).padStart(2, "0")
                          ).map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <select
                          value={sMin}
                          onChange={(e) => setSMin(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-800"
                        >
                          {Array.from({ length: 60 }, (_, i) =>
                            String(i).padStart(2, "0")
                          ).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={sAmPm}
                          onChange={(e) => setSAmPm(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-800"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={savingS}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 mt-2"
                  >
                    {savingS ? "Saving..." : editingShraadId ? "Update Shraad" : "Save Shraad"}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
