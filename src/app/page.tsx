'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Calculator, Calendar, BookOpen, MoreHorizontal, MessageCircle, Quote, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Slide = { id: number; headline: string; subhead: string; desc: string; bgImage: string; quote: string };

// --- Data ---
const slides: Slide[] = [
  {
    id: 1,
    headline: "Digital tools for a living heritage.",
    subhead: "PEOPLE • PLACES • TRADITIONS",
    desc: "Preserving our roots, connecting our community, and keeping our traditions alive.",
    bgImage: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2000&auto=format&fit=crop", // Dal Lake
    quote: "Our heritage lives on through people, places and shared knowledge."
  },
  {
    id: 2,
    headline: "Traditions for every generation.",
    subhead: "OUR ROOTS, OUR TOMORROW.",
    desc: "From lunar birthdays to cherished celebrations, carry a little piece of home wherever you go.",
    bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop", // Mountains
    quote: "The traditions we share today become the memories of tomorrow."
  },
  {
    id: 3,
    headline: "One heritage. Many stories.",
    subhead: "ROOTED IN KASHMIR. CONNECTED EVERYWHERE.",
    desc: "Discover thoughtful tools that bring our culture and community into everyday life.",
    bgImage: "https://images.unsplash.com/photo-1507371341162-763b5e419408?q=80&w=2000&auto=format&fit=crop", // Shikara
    quote: "Across places and generations, our stories keep us connected."
  }
];

const allTools = [
  { name: 'Saath Calculator', desc: 'Auspicious timings', icon: Calculator, href: '/saath' },
  { name: 'Vohorvod', desc: 'Lunar birthday calculator', icon: Calendar, href: '/vohorvod' },
  { name: 'Shraad', desc: 'Ancestral tithi calculator', icon: BookOpen, href: '/shraad' },
  { name: 'Festivals', desc: 'Our festivals & traditions', icon: Calendar, href: '/festivals' },
  { name: 'More tools', desc: 'Explore what\'s next', icon: MoreHorizontal, href: '#' }
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [modal, setModal] = useState<'about' | 'contact' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredTools = allTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-amber-200 overflow-x-hidden">
      
      {/* Top Navbar */}
      <nav className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent text-white">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
              <span className="text-amber-400 font-serif font-bold text-lg leading-none">ॐ</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-wide hidden sm:block">Kashmiri Heritage Hub</span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/90">
            <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-amber-300 transition-colors">Home</button>
            <button onClick={() => window.scrollTo({top:800, behavior:'smooth'})} className="hover:text-amber-300 transition-colors">Our tools</button>
            <button onClick={() => setModal('about')} className="hover:text-amber-300 transition-colors">About</button>
            <button onClick={() => setModal('contact')} className="hover:text-amber-300 transition-colors">Contact</button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a tool or tradition..." 
              className="w-64 bg-black/20 border border-white/20 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/70 focus:outline-none focus:bg-black/40 focus:border-amber-400/50 transition-all backdrop-blur-md"
            />
          </div>
          
          <div className="hidden sm:flex flex-col items-end bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-lg text-right">
            <div className="flex items-baseline gap-1.5 text-amber-400 font-bold">
              <span className="text-lg">{counter.years}</span> <span className="text-[10px]">YRS</span>
              <span className="text-lg ml-1">{counter.months}</span> <span className="text-[10px]">MOS</span>
              <span className="text-lg ml-1">{counter.days}</span> <span className="text-[10px]">DAYS</span>
            </div>
            <span className="text-[9px] tracking-[0.2em] font-semibold text-white/70 uppercase">Uprooted, unhoused, yet unbroken.</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden flex flex-col justify-end pb-32 md:pb-40 px-6 md:px-16">
        {/* Render all images, change opacity for foolproof transitions */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${slide.bgImage})` }}
          />
        ))}
        
        {/* Gradients for readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

        <div className="relative z-20 flex flex-col md:flex-row items-end justify-between w-full max-w-7xl mx-auto gap-8">
          
          <motion.div 
            key={`text-${activeSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl text-white space-y-4"
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold text-amber-400 mb-2 block">
              {slides[activeSlide].subhead}
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight">
              Kashmiri <br/> Heritage Hub
            </h1>
            <p className="text-xl md:text-2xl font-serif font-semibold text-amber-100/90 max-w-lg mt-4 drop-shadow-md">
              {slides[activeSlide].headline}
            </p>
            <p className="text-sm md:text-base text-white/80 font-medium max-w-md leading-relaxed mt-2 drop-shadow-md">
              {slides[activeSlide].desc}
            </p>
            <button className="mt-8 flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-full text-sm font-bold tracking-wide hover:shadow-[0_0_20px_rgba(217,119,6,0.5)] transition-all group">
              Explore our tools
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Quote Box */}
          <motion.div 
            key={`quote-${activeSlide}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex items-center w-72 p-6 bg-black/40 backdrop-blur-md border-l-4 border-amber-500 rounded-r-2xl"
          >
            <p className="text-white/95 font-serif italic text-lg leading-snug">
              "{slides[activeSlide].quote}"
            </p>
          </motion.div>
        </div>

        {/* Dots - Moved much higher to prevent overlap */}
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

      {/* Tools Ribbon - with Scroll Arrows and Smaller Cards */}
      <div className="relative z-30 -mt-10 sm:-mt-12 w-full max-w-7xl mx-auto px-6 md:px-16">
        {filteredTools.length > 0 ? (
          <div className="relative group">
            {/* Scroll Left Arrow */}
            <button 
              onClick={() => scrollRibbon('left')} 
              className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-40 bg-white p-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-stone-100 text-stone-700 hover:text-amber-700 hover:scale-110 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Scrollable Container */}
            <div ref={ribbonRef} className="flex overflow-x-auto pb-6 hide-scrollbar gap-4 snap-x">
              {filteredTools.map((tool, idx) => (
                <a 
                  key={idx} 
                  href={tool.href}
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

            {/* Scroll Right Arrow */}
            <button 
              onClick={() => scrollRibbon('right')} 
              className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-40 bg-white p-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-stone-100 text-stone-700 hover:text-amber-700 hover:scale-110 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="pb-8">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-stone-200 shadow-xl flex items-center gap-3 text-stone-500 font-medium text-sm">
              <Search className="w-5 h-5 text-stone-400" />
              No tools or traditions found for "{searchQuery}".
            </div>
          </div>
        )}
      </div>

      {/* Bottom Content Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Festivals */}
        <div className="col-span-1 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-serif font-bold text-xl text-stone-800">Upcoming festivals</h2>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
            <div className="flex gap-4 relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-stone-200 overflow-hidden flex-shrink-0 shadow-inner">
                <img src="https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=400&auto=format&fit=crop" alt="Herath" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-bold text-stone-800 text-lg group-hover:text-amber-700 transition-colors">Herath (Shivratri)</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Dates to be announced
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed line-clamp-2">A celebration of faith, family and belonging.</p>
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1 mt-2 group-hover:text-amber-700 transition-colors">
                  Discover the tradition <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Community Corner */}
        <div className="col-span-1 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-serif font-bold text-xl text-stone-800">Community corner</h2>
            <button onClick={() => setModal('contact')} className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1 hover:text-amber-700 transition-colors">
              Connect <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-[#FAF8F5] rounded-3xl p-7 border border-stone-200 h-auto shadow-sm">
            <div className="space-y-6">
              <div className="flex gap-4 group cursor-pointer">
                <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-green-700 transition-colors">Stay close to the community</h4>
                  <p className="text-xs text-stone-500 mt-1">WhatsApp updates & connections.</p>
                </div>
              </div>
              <div className="flex gap-4 group cursor-pointer">
                <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-blue-700 transition-colors">Building our next chapter</h4>
                  <p className="text-xs text-stone-500 mt-1">Share your heritage link in our docs.</p>
                </div>
              </div>
              <div onClick={() => setModal('contact')} className="flex gap-4 group cursor-pointer">
                <Quote className="w-6 h-6 text-amber-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-amber-700 transition-colors">Your ideas belong here</h4>
                  <p className="text-xs text-stone-500 mt-1">Share feedback on our tools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Banner */}
        <div className="col-span-1 flex flex-col justify-end">
          <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 flex flex-col justify-center h-full relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <Quote className="absolute -top-4 -right-4 w-32 h-32 text-amber-200/40 transform -rotate-12 pointer-events-none group-hover:-rotate-6 transition-transform duration-500" />
            <h3 className="font-serif font-bold text-2xl text-amber-900 leading-snug relative z-10">
              Preserving traditions today, for generations tomorrow.
            </h3>
            <p className="text-amber-700/80 text-xs font-bold uppercase tracking-widest mt-6 relative z-10">
              Our heritage, carried forward.
            </p>
          </div>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-stone-100 overflow-hidden text-center z-10"
            >
              <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {modal === 'about' ? (
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
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-700">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-2 block">
                    Let's Connect
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                    We'd love to hear from you.
                  </h2>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const email = formData.get('email');
                      const message = formData.get('message');
                      window.location.href = `mailto:kawshashank@gmail.com?subject=Contact Request from Heritage Hub&body=${encodeURIComponent("From: " + email + "\n\n" + message)}`;
                      setModal(null);
                    }} 
                    className="text-left space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Your Email Address</label>
                      <input type="email" name="email" placeholder="name@example.com" className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Message</label>
                      <textarea name="message" rows={4} placeholder="How can we help?" className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" required></textarea>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                      Send Message &rarr;
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 text-center text-xs font-semibold text-stone-400 tracking-wider uppercase">
        © {new Date().getFullYear()} Kashmiri Heritage Hub
      </footer>
    </div>
  );
}
