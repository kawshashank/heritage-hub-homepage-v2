'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, ChevronLeft, Calculator, Calendar, BookOpen, MessageCircle, Quote, ArrowRight, X, Menu, Lightbulb, MessageSquare, ShieldCheck, LogIn, LogOut, User, Lock, ChevronDown, Sparkles, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AuthModal from "@/components/AuthModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import SavedRecordsSection from "@/components/SavedRecordsSection";
import { recordDailyVisit } from "@/app/actions";


// --- Types ---

const UPCOMING_FESTIVALS = [
  {
    id: "gaad_bath_2026",
    name: "Gaad Bath",
    dateObj: "2026-12-24",
    dateStr: "Dec 24, 2026",
    desc: "A winter tradition of preparing fish and rice as an offering to the Ghar Divta.",
    history: "Gaad Bath (Fish and Rice) is uniquely celebrated in the harsh Kashmiri winter during the dark fortnight of Pausha. Families prepare fish and rice and place it in the highest room (Kaeni) of the house as an offering to the 'Ghar Divta' or protecting deity of the house. It reflects the deep localized protective traditions preserved by the community.",
    image: "/festivals/gaad_bath.jpg"
  },
  {
    id: "hearath_2027",
    name: "Hearath (Mahashivratri)",
    dateObj: "2027-03-05",
    dateStr: "Mar 5, 2027",
    desc: "The most important Kashmiri Pandit festival, celebrating the marriage of Shiva and Parvati.",
    history: "Hearath (Mahashivratri) is the crown jewel of Kashmiri Pandit festivals. Unlike other regions where it is celebrated on Chaturdashi, Kashmiri Pandits celebrate it on Phalguna Krishna Trayodashi. The festival involves an elaborate puja using Walnuts (Vatak Nath) kept in water-filled earthen pots. It symbolizes the marriage of Lord Shiva and Goddess Parvati.",
    image: "/festivals/hearath.jpg"
  },
  {
    id: "navreh_2027",
    name: "Navreh",
    dateObj: "2027-04-07",
    dateStr: "Apr 7, 2027",
    desc: "The Kashmiri Hindu New Year, marking the first day of the Chaitra Navratras.",
    history: "Navreh is derived from the Sanskrit word 'Nava Varsha', meaning New Year. Celebrated on the first day of Chaitra Navratras, it begins with the beautiful tradition of looking at a 'Thaal' (plate) filled with rice, yogurt, a coin, a mirror, walnut, pen, and the traditional almanac first thing in the morning. It represents a prayer for prosperity and sweetness.",
    image: "/festivals/navreh.jpg"
  },
  {
    id: "zetha_ashtami_2027",
    name: "Zetha Ashtami",
    dateObj: "2027-05-13",
    dateStr: "May 13, 2027",
    desc: "The sacred day dedicated to Mata Kheer Bhawani at Tulmulla, Kashmir.",
    history: "Zetha Ashtami is celebrated on the eighth day of the bright half of Jyeshtha month. It is the most auspicious day for Kashmiri Pandits to worship Goddess Ragnya Bhagwati (Kheer Bhawani). Thousands historically gather at the sacred spring in Tulmulla, Ganderbal, offering milk and kheer. The changing color of the spring's water is traditionally believed to indicate the coming fate of the region.",
    image: "/festivals/zetha_ashtami.jpg"
  },
  {
    id: "jaramsatam_2027",
    name: "Jaramsatam (Janmashtami)",
    dateObj: "2027-08-25",
    dateStr: "Aug 25, 2027",
    desc: "The celebration of Lord Krishna's birth, observed with fasting and night-long prayers.",
    history: "Known locally as Jaramsatam, Janmashtami marks the birth of Lord Krishna. Kashmiri Pandits observe a strict fast throughout the day, spending the time singing devotional bhajans. The fast is broken at midnight after offering prayers to the moon and Lord Krishna.",
    image: "/festivals/jaramsatam.jpg"
  },
  {
    id: "pann_2027",
    name: "Pann / Roth Puza",
    dateObj: "2027-08-05",
    dateStr: "Aug 5 - Aug 16, 2027",
    desc: "A unique tradition of baking sweet breads (Roth) dedicated to Goddess Mata Bhawani.",
    history: "Pann is a deeply cultural Kashmiri Pandit festival held in the month of Bhadrapada. Families prepare 'Roth' – sweet traditional breads made of flour, sugar, and ghee, fried or baked on auspicious days. A sacred red thread (Pann) is tied to the pot, and the story of Beeb Garb Maej is recited.",
    image: "/festivals/pann.jpg"
  }
];


const TOOL_DATA = [
  {
    id: 'saath',
    title: 'Saath Calculator',
    path: '/saath',
    keywords: ['saath', 'sath', 'saaath', 'muhurat', 'auspicious', 'good', 'time', 'date', 'calendar']
  },
  {
    id: 'vohorvod',
    title: 'Vohorvod (Birthday)',
    path: '/vohorvod',
    keywords: ['birthday', 'voharvod', 'vohorvod', 'english', 'janam', 'janamdin', 'anniversary']
  },
  {
    id: 'shraad',
    title: 'Shraad Calculator',
    path: '/shraad',
    keywords: ['shraad', 'shrad', 'death', 'expired', 'sad', 'tithi', 'punya', 'remembrance', 'ancestors']
  },
  {
    id: 'festivals',
    title: 'Upcoming Festivals',
    path: '/festivals',
    keywords: ['festival', 'festivals', 'herath', 'shivratri', 'navreh', 'kheer bhawani', 'zang', 'pooja', 'puja']
  }
];

type Slide = { id: number; headline: string; subhead: string; desc: string; bgImage: string; bgPosition?: string; quote: string };


// --- Data ---
const slides: Slide[] = [
  {
    id: 1,
    headline: "Digital tools for a living heritage.",
    subhead: "PEOPLE • PLACES • TRADITIONS",
    desc: "Preserving our roots, connecting our community, and keeping our traditions alive.",
    bgImage: "https://upload.wikimedia.org/wikipedia/commons/9/9b/The_Ancient_Shankaracharya_Temple_%28Srinagar%2C_Jammu_and_Kashmir%29_%28cropped%29.jpg", 
    bgPosition: "center 10%",
    quote: "Our heritage lives on through people, places and shared knowledge."
  },
  {
    id: 2,
    headline: "Traditions for every generation.",
    subhead: "OUR ROOTS, OUR TOMORROW.",
    desc: "From lunar birthdays to cherished celebrations, carry a little piece of home wherever you go.",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop", 
    quote: "The traditions we share today become the memories of tomorrow."
  },
  {
    id: 3,
    headline: "One heritage. Many stories.",
    subhead: "ROOTED IN KASHMIR. CONNECTED EVERYWHERE.",
    desc: "Discover thoughtful tools that bring our culture and community into everyday life.",
    bgImage: "https://images.unsplash.com/photo-1507371341162-763b5e419408?q=80&w=2000&auto=format&fit=crop", 
    quote: "Across places and generations, our stories keep us connected."
  }
];

const allTools = [
  { name: 'Saath Calculator', desc: 'Auspicious timings', icon: Calculator, href: '/saath' },
  { name: 'Vohorvod', desc: 'Lunar birthday calculator', icon: Calendar, href: '/vohorvod' },
  { name: 'Shraad', desc: 'Ancestral tithi calculator', icon: BookOpen, href: '/shraad' },
  { name: 'Festivals', desc: 'Our festivals & traditions', icon: Calendar, href: '/festivals' },
  { name: 'Suggest a Tool', desc: 'Got a brilliant idea?', icon: Lightbulb, href: '#', action: 'suggest' }
];

const HERITAGE_THOUGHTS = [
  {
    quote: "Preserving traditions today, for generations tomorrow.",
    subtitle: "Our heritage, carried forward.",
  },
  {
    quote: "Uprooted from our soil, yet unbroken in our soul.",
    subtitle: "Resilience in every generation.",
  },
  {
    quote: "Where the Vitasta flows in memory, our roots remain eternal.",
    subtitle: "The sacred valley within us.",
  },
  {
    quote: "Children of Sharada—carrying the light of knowledge wherever we go.",
    subtitle: "Namaste Sharada Devi.",
  },
  {
    quote: "A home is not just walls of stone; it lives in every ritual we keep alive.",
    subtitle: "From Hearath to Navreh.",
  },
  {
    quote: "Every spoken word of Koshur is a bridge back to our ancestors.",
    subtitle: "Keep our mother tongue alive.",
  },
  {
    quote: "Distance may separate us from Kashmir, never from our Kashmiriyat and Sanskriti.",
    subtitle: "One community, across the world.",
  },
  {
    quote: "In remembering our Pitras and Tithis, we honour the lineage that made us.",
    subtitle: "Sacred continuity of family.",
  },
  {
    quote: "Like the Chinar in autumn, we have weathered the storm and stood tall.",
    subtitle: "Rooted in five thousand years.",
  },
  {
    quote: "May the Thal of Navreh always remind our children of who they are.",
    subtitle: "Passing the torch of tradition.",
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeSlide, setActiveSlide] = useState(0);
  const [thoughtIndex, setThoughtIndex] = useState(0);

  // Pick initial 5-minute thought slot on mount
  useEffect(() => {
    const FIVE_MINS_MS = 5 * 60 * 1000;
    const slot = Math.floor(Date.now() / FIVE_MINS_MS) % HERITAGE_THOUGHTS.length;
    setThoughtIndex(slot);
  }, []);

  // Rotate to the next thought every 5 minutes (resets timer on manual prev/next click)
  useEffect(() => {
    const timer = setInterval(() => {
      setThoughtIndex((prev) => (prev + 1) % HERITAGE_THOUGHTS.length);
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [thoughtIndex]);

  // Auth & Profile Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">("login");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userFirstName = useMemo(() => {
    if (!session?.user) return null;
    const fn = (session.user as any).firstName || session.user.name?.split(' ')[0] || session.user.email?.split('@')[0];
    return fn || 'Member';
  }, [session]);

  const isSuperAdmin = useMemo(() => {
    if (!session?.user) return false;
    return (
      session.user.email?.trim().toLowerCase() === 'vitastahub@gmail.com' ||
      (session.user as any).role === 'ADMIN'
    );
  }, [session]);

  // Track daily footfall once per day per browser/user (zero wasted DB calls)
  useEffect(() => {
    if (status === 'loading') return;

    const todayIst = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    try {
      const guestKey = 'vitasta_gvisit_date';
      const convertedKey = 'vitasta_gvisit_converted';
      const adminDeviceKey = 'vitasta_is_admin_device';

      if (status === 'authenticated' && session?.user?.email) {
        const emailLower = session.user.email.trim().toLowerCase();
        if (isSuperAdmin) {
          localStorage.setItem(adminDeviceKey, 'true');
        }

        const userKey = `vitasta_uvisit_${emailLower}`;
        const hadGuestVisitToday =
          localStorage.getItem(guestKey) === todayIst &&
          localStorage.getItem(convertedKey) !== todayIst;

        if (localStorage.getItem(userKey) !== todayIst || hadGuestVisitToday) {
          localStorage.setItem(userKey, todayIst);
          if (hadGuestVisitToday) {
            localStorage.setItem(convertedKey, todayIst);
          }
          recordDailyVisit('user', hadGuestVisitToday).catch(() => {});
        }
      } else if (status === 'unauthenticated') {
        // Do not count the Super Admin's own browser as a guest when signed out
        if (localStorage.getItem(adminDeviceKey) === 'true') return;

        if (localStorage.getItem(guestKey) !== todayIst) {
          localStorage.setItem(guestKey, todayIst);
          recordDailyVisit('guest').catch(() => {});
        }
      }
    } catch {}
  }, [status, session?.user?.email, isSuperAdmin]);

  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    setIsLocal(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }, []);

  const getToolHref = (baseHref: string) => {
    if (!baseHref.startsWith('/')) return baseHref;
    let resolved = baseHref;
    if (isLocal && baseHref === '/vohorvod') resolved = 'http://localhost:3001';
    if (isLocal && baseHref === '/shraad') resolved = 'http://localhost:3002';

    if (
      (baseHref === '/vohorvod' ||
        baseHref === '/shraad' ||
        baseHref === '/saath' ||
        baseHref === '/festivals') &&
      userFirstName
    ) {
      return `${resolved}?hub_user=${encodeURIComponent(userFirstName)}`;
    }
    return resolved;
  };

  const nextFestival = useMemo(() => {
    const today = new Date();
    // Reset time for accurate date comparison
    today.setHours(0, 0, 0, 0);
    const upcoming = UPCOMING_FESTIVALS.filter(f => new Date(f.dateObj) >= today);
    return upcoming.length > 0 ? upcoming[0] : UPCOMING_FESTIVALS[UPCOMING_FESTIVALS.length - 1];
  }, []);

  const [modal, setModal] = useState<'about' | 'contact' | 'connect' | 'suggest' | 'festival' | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSearchTools = useMemo(() => {
    if (searchQuery.trim().length < 1) return [];
    const query = searchQuery.toLowerCase();
    return TOOL_DATA.filter(tool => 
      tool.title.toLowerCase().includes(query) || 
      tool.keywords.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQuery]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Ribbon Scroll Logic
  const ribbonRef = useRef<HTMLDivElement>(null);
  const scrollRibbon = (direction: 'left' | 'right') => {
    if (ribbonRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ribbonRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Remembrance Counter Logic
  const [counter, setCounter] = useState({ years: 0, months: 0, days: 0 });
  
  useEffect(() => {
    const calculateExodus = () => {
      const exodusDate = new Date('1990-01-19T00:00:00');
      const now = new Date();
      
      let years = now.getFullYear() - exodusDate.getFullYear();
      let months = now.getMonth() - exodusDate.getMonth();
      let days = now.getDate() - exodusDate.getDate();
      
      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      
      setCounter({ years, months, days });
    };

    calculateExodus();
    const interval = setInterval(calculateExodus, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  // Sticky header scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when modal or mobile menu is open
  useEffect(() => {
    if (modal || mobileMenuOpen || isAuthModalOpen || isChangePasswordOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modal, mobileMenuOpen, isAuthModalOpen, isChangePasswordOpen]);

  const filteredTools = allTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSavedSection = () => {
    const el = document.getElementById('saved-family-tithis');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-amber-200 overflow-x-hidden">
      
      {/* Mobile Top Counter Banner (Fixed at absolute top for small screens) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-[70] h-[52px] bg-black text-white px-4 flex flex-col justify-center items-center text-[10px] tracking-widest font-bold border-b border-white/10 shadow-lg">
        <span className="text-white/60 uppercase mb-0.5">Uprooted, Unheard, yet Unbroken</span>
        <div className="flex gap-2 text-amber-400">
          <span>{counter.years} Years</span>
          <span>{counter.months} Months</span>
          <span>{counter.days} Days</span>
        </div>
      </div>

      {/* Desktop Sticky Navbar (Apple Frosted Glass Effect on Scroll) */}
      <header className={`hidden lg:block fixed top-0 inset-x-0 z-[60] transition-all duration-500 ease-in-out ${scrolled ? 'bg-black/30 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent border-b border-transparent'}`}>
        <nav className="flex items-center justify-between px-6 py-4 w-full text-white">
          <div className="flex items-center gap-4 xl:gap-8 w-full lg:w-auto justify-between lg:justify-start flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                <span className="text-amber-400 font-serif font-bold text-lg leading-none">ॐ</span>
              </div>
              <span className="font-serif font-semibold text-base xl:text-lg tracking-wide whitespace-nowrap">Kashmiri Heritage Hub</span>
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-6 text-sm font-medium text-white/90">
              <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-amber-300 transition-colors">Home</button>
              <button onClick={() => window.scrollTo({top:800, behavior:'smooth'})} className="hover:text-amber-300 transition-colors">Our tools</button>
              {session?.user && (
                <button onClick={scrollToSavedSection} className="hover:text-amber-300 transition-colors flex items-center gap-1 text-amber-300">
                  <Bookmark className="w-3.5 h-3.5" />
                  Saved Tithis
                </button>
              )}
              <button onClick={() => setModal('about')} className="hover:text-amber-300 transition-colors">About</button>
              <button onClick={() => setModal('contact')} className="hover:text-amber-300 transition-colors">Contact</button>
            </div>
          </div>

          {/* Desktop Search, Auth & Counter */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a tool..." 
                className={`w-36 lg:w-44 xl:w-56 border rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/70 focus:outline-none transition-all ${scrolled ? 'bg-white/5 border-white/20 focus:border-amber-400/50 focus:bg-white/10' : 'bg-black/20 border-white/20 focus:border-amber-400/50 focus:bg-black/40 backdrop-blur-md'}`}
              />
              <AnimatePresence>
                {searchQuery.trim().length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-stone-100 overflow-hidden z-50 text-stone-800"
                  >
                    {filteredSearchTools.length > 0 ? (
                      <div className="py-2">
                        {filteredSearchTools.map(tool => (
                          <Link href={getToolHref(tool.path)} key={tool.id} onClick={() => setSearchQuery('')} className="block px-4 py-2.5 hover:bg-stone-50 transition-colors">
                            <div className="text-sm font-bold text-stone-800">{tool.title}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-sm text-stone-500 text-center">No tools found.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth Button / Profile Dropdown */}
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3.5 py-2 rounded-full text-xs font-bold text-amber-200 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-[10px] font-extrabold">
                    {userFirstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{userFirstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-52 bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-800 truncate">{session.user.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{session.user.email}</p>
                      </div>
                      {isSuperAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#6d3029] bg-amber-50/70 hover:bg-amber-100/80 flex items-center gap-2.5 transition-colors border-b border-amber-100"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                          Admin Console
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserDropdownOpen(false); scrollToSavedSection(); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-[#6d3029] flex items-center gap-2.5 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                        My Saved Tithis
                      </button>
                      <button
                        onClick={() => { setUserDropdownOpen(false); setIsChangePasswordOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5 text-stone-500" />
                        Change Password
                      </button>
                      <div className="h-px bg-stone-100 my-1" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => { setAuthModalView("login"); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-bold tracking-wide transition-all whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
            
            <div className={`flex flex-col items-end px-4 py-1.5 rounded-lg text-right ${scrolled ? 'bg-white/5 border border-white/10' : 'bg-black/40 backdrop-blur-md border border-white/10'}`}>
              <div className="flex items-baseline gap-1.5 text-amber-400 font-bold">
                <span className="text-lg">{counter.years}</span> <span className="text-[10px]">YEARS</span>
                <span className="text-lg ml-1">{counter.months}</span> <span className="text-[10px]">MONTHS</span>
                <span className="text-lg ml-1">{counter.days}</span> <span className="text-[10px]">DAYS</span>
              </div>
              <span className="hidden xl:block text-[9px] tracking-[0.2em] font-semibold text-white/70 uppercase">Uprooted, Unheard, yet Unbroken</span>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-xl flex flex-col p-6 overflow-y-auto overscroll-contain"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                  <span className="text-amber-400 font-serif font-bold text-lg leading-none">ॐ</span>
                </div>
                <span className="text-white font-serif font-semibold text-lg tracking-wide">Heritage Hub</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-6 z-50">
              <div className="relative z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a tool..." 
                  className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-6 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>
              <AnimatePresence>
                {searchQuery.trim().length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                  >
                    {filteredSearchTools.length > 0 ? (
                      <div className="py-2">
                        {filteredSearchTools.map(tool => (
                          <Link href={getToolHref(tool.path)} key={tool.id} onClick={() => { setSearchQuery(''); setMobileMenuOpen(false); }} className="block px-6 py-3.5 hover:bg-white/5 transition-colors">
                            <div className="text-base font-bold text-white">{tool.title}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-4 text-sm text-white/50 text-center">No tools found.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Auth Card (Compact) */}
            <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
              {session?.user ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-[11px] font-extrabold shrink-0">
                        {userFirstName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate leading-tight">{session.user.name}</p>
                        <p className="text-[10px] text-white/55 truncate leading-tight">{session.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                  </div>
                  <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    {isSuperAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1.5 px-2 rounded-lg bg-amber-400 text-stone-950 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); scrollToSavedSection(); }}
                      className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <Bookmark className="w-3 h-3" />
                      Saved Tithis
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setIsChangePasswordOpen(true); }}
                      className="py-1.5 px-2.5 rounded-lg bg-white/10 text-white/90 text-[11px] font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3 h-3" />
                      Password
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/75 leading-snug">
                    Save family <strong>Vohorvod</strong> &amp; <strong>Shraad</strong> dates
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setMobileMenuOpen(false); setAuthModalView("login"); setIsAuthModalOpen(true); }}
                      className="py-1.5 px-3 rounded-lg bg-amber-500 text-stone-950 font-bold text-[11px] flex items-center gap-1 whitespace-nowrap"
                    >
                      <LogIn className="w-3 h-3" />
                      Sign In
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setAuthModalView("register"); setIsAuthModalOpen(true); }}
                      className="py-1.5 px-3 rounded-lg bg-white/10 border border-white/20 text-white font-bold text-[11px] whitespace-nowrap"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 text-xl font-serif text-white">
              <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-left border-b border-white/10 pb-4">Home</button>
              <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({top:500, behavior:'smooth'}); }} className="text-left border-b border-white/10 pb-4">Our tools</button>
              <button onClick={() => { setMobileMenuOpen(false); setModal('about'); }} className="text-left border-b border-white/10 pb-4">About</button>
              <button onClick={() => { setMobileMenuOpen(false); setModal('contact'); }} className="text-left">Contact</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative h-[85vh] min-h-[550px] md:min-h-[600px] w-full overflow-hidden flex flex-col justify-end pb-32 md:pb-40 mt-[52px] lg:mt-0">
        
        {/* Mobile Scrolling Navbar (Attached exactly to the top of Hero, inside Hero container) */}
        <div className="lg:hidden absolute top-0 inset-x-0 z-[50] flex items-center justify-between gap-2 px-3.5 sm:px-6 py-3.5 w-full text-white bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30 shrink-0">
              <span className="text-amber-400 font-serif font-bold text-base sm:text-lg leading-none">ॐ</span>
            </div>
            <span className="font-serif font-semibold text-[13px] sm:text-base tracking-normal whitespace-nowrap">
              Kashmiri Heritage Hub
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[10px] sm:text-[11px] font-bold"
                >
                  <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-[9px] font-extrabold shrink-0">
                    {userFirstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[58px] sm:max-w-[90px] truncate">{userFirstName}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-2 w-52 bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-xs font-bold text-stone-800 truncate">{session.user.name}</p>
                          <p className="text-[10px] text-stone-400 truncate">{session.user.email}</p>
                        </div>
                        {isSuperAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#6d3029] bg-amber-50/70 hover:bg-amber-100/80 flex items-center gap-2.5 transition-colors border-b border-amber-100"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            Admin Console
                          </Link>
                        )}
                        <button
                          onClick={() => { setUserDropdownOpen(false); scrollToSavedSection(); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-[#6d3029] flex items-center gap-2.5 transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                          My Saved Tithis
                        </button>
                        <button
                          onClick={() => { setUserDropdownOpen(false); setIsChangePasswordOpen(true); }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5 text-stone-500" />
                          Change Password
                        </button>
                        <div className="h-px bg-stone-100 my-1" />
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => { setAuthModalView("login"); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[10px] sm:text-[11px] font-bold whitespace-nowrap"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            )}
            <button 
              className="text-white hover:text-amber-400 transition-colors p-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Background Images */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${slide.bgImage})`, backgroundPosition: slide.bgPosition || 'center' }}
          />
        ))}
        
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/20 to-transparent md:from-black/80" />

        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between w-full max-w-7xl mx-auto gap-5 md:gap-8 px-6 md:px-16">
          <motion.div 
            key={`text-${activeSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl text-white space-y-3 md:space-y-4"
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold text-amber-400 mb-2 block">
              {slides[activeSlide].subhead}
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight">
              Kashmiri <br/> Heritage Hub
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-amber-100/90 max-w-lg mt-3 md:mt-4 drop-shadow-md">
              {slides[activeSlide].headline}
            </p>
            <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium max-w-md leading-relaxed mt-3 drop-shadow-md">
              {slides[activeSlide].desc}
            </p>
          </motion.div>

          {/* Quote Box */}
          <motion.div 
            key={`quote-${activeSlide}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center w-[90%] sm:w-80 md:w-72 p-4 md:p-6 bg-black/40 backdrop-blur-md border-l-4 border-amber-500 rounded-r-xl md:rounded-r-2xl shadow-lg mt-2 md:mt-0"
          >
            <p className="text-white/95 font-serif italic text-sm md:text-lg leading-relaxed md:leading-snug">
              &ldquo;{slides[activeSlide].quote}&rdquo;
            </p>
          </motion.div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setActiveSlide(i)}
              className={`transition-all duration-300 rounded-full ${i === activeSlide ? 'w-8 h-2 bg-amber-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Tools Ribbon Area */}
      <div className="relative z-30 -mt-10 sm:-mt-12 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-16">
        {filteredTools.length > 0 ? (
          <>
            {/* Desktop Horizontal Scroll */}
            <div className="hidden md:block relative group">
              <button 
                onClick={() => scrollRibbon('left')} 
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-40 bg-white p-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-stone-100 text-stone-700 hover:text-amber-700 hover:scale-110 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div ref={ribbonRef} className="flex overflow-x-auto pb-6 hide-scrollbar gap-4 snap-x">
                {filteredTools.map((tool, idx) => (
                  <a 
                    key={idx} 
                    href={getToolHref(tool.href)}
                    onClick={(e) => {
                      if (tool.action) {
                        e.preventDefault();
                        setModal(tool.action as any);
                      }
                    }}
                    className="flex-shrink-0 snap-start w-56 bg-white/95 backdrop-blur-xl rounded-xl p-3 border border-stone-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors border border-amber-100 flex-shrink-0">
                        <tool.icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-stone-800 text-sm group-hover:text-amber-700 transition-colors truncate">{tool.name}</h3>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5 truncate">{tool.desc}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              <button 
                onClick={() => scrollRibbon('right')} 
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-40 bg-white p-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-stone-100 text-stone-700 hover:text-amber-700 hover:scale-110 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Grid Layout (No horizontal scrolling) */}
            <div className="md:hidden grid grid-cols-2 gap-3 pb-6">
              {filteredTools.map((tool, idx) => (
                <a 
                  key={idx} 
                  href={getToolHref(tool.href)}
                  onClick={(e) => {
                    if (tool.action) {
                      e.preventDefault();
                      setModal(tool.action as any);
                    }
                  }}
                  className={`bg-white/95 backdrop-blur-xl rounded-xl p-4 flex flex-col items-center justify-center text-center border border-stone-200/80 shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${idx === filteredTools.length - 1 && filteredTools.length % 2 !== 0 ? 'col-span-2' : 'col-span-1'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-3 border border-amber-100">
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-800 text-xs sm:text-sm leading-tight">{tool.name}</h3>
                  <p className="text-[10px] text-stone-500 font-medium mt-1 line-clamp-1">{tool.desc}</p>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="pb-8">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-stone-200 shadow-xl flex items-center gap-3 text-stone-500 font-medium text-sm">
              <Search className="w-5 h-5 text-stone-400" />
              No tools or traditions found for &ldquo;{searchQuery}&rdquo;.
            </div>
          </div>
        )}
      </div>

      {/* Saved Family Tithis Vault (Logged-In View OR Non-Intrusive Sign-In Callout) */}
      {session?.user?.email ? (
        <SavedRecordsSection userEmail={session.user.email} userName={userFirstName} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-16 pt-2 pb-1">
          <div className="bg-gradient-to-r from-[#2a1b18] via-[#4a2522] to-[#5a2a24] rounded-2xl p-3.5 sm:px-6 sm:py-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-amber-400/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-[13px] sm:text-base text-white leading-snug">
                  <span className="sm:hidden">Save family Vohorvod &amp; Shraad dates</span>
                  <span className="hidden sm:inline">Tired of re-typing family Vohorvod &amp; Shraad dates every year?</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-100/80 mt-0.5 leading-snug">
                  <span className="sm:hidden">Create a free account to pre-fill &amp; calculate in one tap.</span>
                  <span className="hidden sm:inline">Create a free account to save your family&apos;s birth dates &amp; ancestral tithis and calculate them in a single tap.</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
              <button
                onClick={() => { setAuthModalView("register"); setIsAuthModalOpen(true); }}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs whitespace-nowrap flex items-center justify-center transition-all shadow-sm"
              >
                Create Free Account
              </button>
              <button
                onClick={() => { setAuthModalView("login"); setIsAuthModalOpen(true); }}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs whitespace-nowrap flex items-center justify-center transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Content Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Festivals */}
        <div className="col-span-1 space-y-4 md:space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-serif font-bold text-xl text-stone-800">Upcoming festivals</h2>
          </div>
          <div 
            onClick={() => { setSelectedFestival(nextFestival); setModal('festival'); }}
            className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
          >
            <div className="flex gap-4 relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-200 overflow-hidden flex-shrink-0 shadow-inner">
                <img src={nextFestival.image} alt={nextFestival.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1">{nextFestival.dateStr}</div>
                <h3 className="font-serif font-bold text-lg text-stone-800 mb-1 leading-tight">{nextFestival.name}</h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-2 leading-relaxed line-clamp-2">{nextFestival.desc}</p>
                <span className="text-[11px] sm:text-xs font-bold text-stone-800 flex items-center gap-1 mt-2 group-hover:text-amber-700 transition-colors">
                  Discover the tradition <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Community Corner */}
        <div className="col-span-1 space-y-4 md:space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-serif font-bold text-xl text-stone-800">Community corner</h2>
            <button onClick={() => setModal('connect')} className="text-xs font-bold uppercase tracking-widest text-[#25D366] flex items-center gap-1 hover:text-[#20bd5a] transition-colors">
              Connect <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-7 border border-stone-200 h-auto shadow-sm">
            
            <div className="mb-6 pb-5 border-b border-stone-200/60">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                <span className="text-stone-800 font-bold block mb-1">Never miss an update.</span>
                Join via the <strong className="text-[#25D366]">Connect</strong> link above for first access to new tools and festival reminders. 100% spam-free.
              </p>
            </div>

            <div className="space-y-6">
              <div onClick={() => setModal('connect')} className="flex gap-4 group cursor-pointer">
                <MessageCircle className="w-6 h-6 text-[#25D366] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-[#25D366] transition-colors">Stay close to the community</h4>
                  <p className="text-xs text-stone-500 mt-1">WhatsApp updates &amp; connections.</p>
                </div>
              </div>
              <div className="flex gap-4 group cursor-pointer">
                <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-blue-700 transition-colors">Deepen your roots</h4>
                  <p className="text-xs text-stone-500 mt-1">Discover guides on our rituals &amp; celebrations.</p>
                </div>
              </div>
              <div onClick={() => setModal('suggest')} className="flex gap-4 group cursor-pointer">
                <Lightbulb className="w-6 h-6 text-amber-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-amber-700 transition-colors">Your ideas belong here</h4>
                  <p className="text-xs text-stone-500 mt-1">Share feedback &amp; suggest new tools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Banner (Rotates every 5 minutes across 10 Kashmiri Pandit thoughts + manual Prev/Next) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-end mt-4 md:mt-0">
          <div className="bg-amber-50 rounded-3xl p-7 sm:p-8 border border-amber-200 flex flex-col justify-between h-full relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <Quote className="absolute -top-4 -right-4 w-32 h-32 text-amber-200/40 transform -rotate-12 pointer-events-none group-hover:-rotate-6 transition-transform duration-500" />
            <AnimatePresence mode="wait">
              <motion.div
                key={thoughtIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="relative z-10"
              >
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-900 leading-snug">
                  {HERITAGE_THOUGHTS[thoughtIndex].quote}
                </h3>
              </motion.div>
            </AnimatePresence>

            <div className="relative z-10 flex items-center justify-between gap-3 mt-6 pt-1">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`sub-${thoughtIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-amber-700/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                >
                  {HERITAGE_THOUGHTS[thoughtIndex].subtitle}
                </motion.p>
              </AnimatePresence>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setThoughtIndex(
                      (prev) => (prev - 1 + HERITAGE_THOUGHTS.length) % HERITAGE_THOUGHTS.length
                    )
                  }
                  aria-label="Previous thought"
                  className="w-6 h-6 rounded-full border border-amber-300/70 bg-amber-100/50 hover:bg-amber-200/70 text-amber-800/80 hover:text-amber-950 flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setThoughtIndex((prev) => (prev + 1) % HERITAGE_THOUGHTS.length)
                  }
                  aria-label="Next thought"
                  className="w-6 h-6 rounded-full border border-amber-300/70 bg-amber-100/50 hover:bg-amber-200/70 text-amber-800/80 hover:text-amber-950 flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Auth & Password Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setModal(null)}
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative w-full ${modal === 'suggest' ? 'max-w-lg' : 'max-w-md'} bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-stone-100 overflow-hidden text-center z-10 my-4`}
              >
              <button onClick={() => setModal(null)} className="absolute top-4 sm:top-6 right-4 sm:right-6 text-stone-400 hover:text-stone-800 transition-colors bg-stone-100/50 p-2 rounded-full z-20">
                <X className="w-5 h-5" />
              </button>

              {modal === 'about' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6 text-amber-700">
                    <span className="font-serif font-bold text-xl">ॐ</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-2 block">
                    Our Story
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">
                    Rooted in heritage. Made for tomorrow.
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed mb-8">
                    Kashmiri Heritage Hub is a home for the traditions, memories and knowledge that connect our community. Through thoughtful digital tools, we hope to make our culture easier to discover, practice and pass on — wherever life takes us.
                  </p>
                  <button onClick={() => setModal(null)} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                    Back to the hub &rarr;
                  </button>
                </>
              )}

              {modal === 'contact' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-700">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-2 block">
                    Let&apos;s Connect
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                    We&apos;d love to hear from you.
                  </h2>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const email = formData.get('email');
                      const message = formData.get('message');
                      window.location.href = `mailto:vitastahub@gmail.com?subject=Contact Request from Heritage Hub&body=${encodeURIComponent("From: " + email + "\n\n" + message)}`;
                      setModal(null);
                    }} 
                    className="text-left space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Your Email Address</label>
                      <input type="email" name="email" placeholder="name@example.com" className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Message</label>
                      <textarea name="message" rows={4} placeholder="How can we help?" className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm" required></textarea>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                      Send Message &rarr;
                    </button>
                  </form>
                </>
              )}

              {modal === 'connect' && (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mx-auto mb-5 text-[#25D366]">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-2 block">
                    Join the Inner Circle
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">
                    Stay close to our roots.
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed mb-6">
                    Join our close-knit WhatsApp community to stay updated on new tools, upcoming festivals, and important cultural announcements.
                  </p>
                  
                  {/* High Prominence Anti-Spam Promise */}
                  <div className="mb-6 p-4 bg-green-50/80 border border-green-200 rounded-xl flex items-start gap-3 text-left shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Our Promise: Zero Spam</h4>
                      <p className="text-[11px] sm:text-xs text-stone-500 mt-1.5 leading-relaxed font-medium">This is a quiet, respectful space. The group is restricted so your phone will not be flooded with unnecessary forwards or daily messages.</p>
                    </div>
                  </div>

                  <a 
                    href="https://chat.whatsapp.com/KuhFWvN0BdAA7JqJf6bdTf" 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={() => setModal(null)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-white" />
                    Join the WhatsApp Group
                  </a>
                </>
              )}

              {modal === 'suggest' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-1 block">
                    Idea Submission
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                    Got a brilliant idea?
                  </h2>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const email = formData.get('email');
                      const toolName = formData.get('toolName');
                      const shortDesc = formData.get('shortDesc');
                      const longDesc = formData.get('longDesc');
                      
                      const bodyText = `New Tool Suggestion: ${toolName}\n\nShort Description:\n${shortDesc}\n\nLong Description:\n${longDesc}\n\nFrom: ${email}`;
                      window.location.href = `mailto:vitastahub@gmail.com?subject=[Heritage Hub] New Tool Suggestion: ${toolName}&body=${encodeURIComponent(bodyText)}`;
                      setModal(null);
                    }} 
                    className="text-left space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1.5">Tool Name *</label>
                      <input type="text" name="toolName" placeholder="e.g., Kashmiri Names Generator" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1.5">Short Description *</label>
                      <textarea name="shortDesc" rows={2} placeholder="A one-sentence summary of what it does..." className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm" required></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1.5">Long Description <span className="text-stone-400 normal-case tracking-normal font-normal">(Optional)</span></label>
                      <textarea name="longDesc" rows={3} placeholder="Any specific details, features, or references you want to include..." className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1.5">Your Email Address *</label>
                      <input type="email" name="email" placeholder="name@example.com" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm" required />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2">
                      Submit Idea &rarr;
                    </button>
                  </form>
                </>
              )}

            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 text-center text-xs font-semibold text-stone-400 tracking-wider uppercase">
        © {new Date().getFullYear()} Kashmiri Heritage Hub
      </footer>
      {/* Festival Detail Modal */}
      <AnimatePresence>
        {modal === 'festival' && selectedFestival && (
          <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
            <div className="min-h-full flex items-center justify-center p-4 text-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setModal(null)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 my-4 text-left"
                onClick={e => e.stopPropagation()}
              >
              <div className="h-48 md:h-64 w-full relative">
                <img src={selectedFestival.image} alt={selectedFestival.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <button onClick={() => setModal(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-1">{selectedFestival.dateStr}</div>
                  <h2 className="font-serif font-bold text-3xl leading-tight">{selectedFestival.name}</h2>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-lg font-bold text-stone-800 mb-3">Historical Significance</h3>
                <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-6">
                  {selectedFestival.history}
                </p>
                <div className="flex justify-end">
                  <Link href={getToolHref('/festivals')} className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2.5 rounded-full text-sm font-bold transition-colors">
                    <span>View all festivals</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
