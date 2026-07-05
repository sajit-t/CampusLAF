import React from 'react';
import { useApp } from '../context/AppContext';
import { FloatingObjects } from '../components/FloatingObjects';
import { HowItWorks } from '../components/HowItWorks';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Scan, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  Sliders,
  Sparkles,
  Shield,
  Clock,
  Phone
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { 
    currentUser, 
    setPage, 
    setAdminActiveTab,
    setStudentActiveTab, 
    setShowLoginModal,
    setReportType
  } = useApp();

  const capabilities = [
    {
      title: 'Intelligent Query Matching',
      desc: 'Compares descriptions, categories, and location indicators to match lost claims instantly.',
      icon: Cpu,
      color: 'bg-primary-light/50 text-primary',
    },
    {
      title: 'Barcode ID Check-Out',
      desc: 'Verify students securely using college Code 39 barcodes to ensure returns go to correct owners.',
      icon: Scan,
      color: 'bg-accent-light/50 text-accent',
    },
    {
      title: 'Granular Campus Logging',
      desc: 'Structured locations detailing college blocks, floors, and rooms for precise recovery tracking.',
      icon: MapPin,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Instant Email Alerts',
      desc: 'Receive alerts when matching candidate records are registered by students or Safety Office admins.',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Secure Claims Registry',
      desc: 'Ownership verification through custom questionnaires and signed digital receipts.',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Safety Audits & Metrics',
      desc: 'Safety office metrics tracking recovery efficiency, pending queues, and active catalog reports.',
      icon: Sliders,
      color: 'bg-sky-50 text-sky-600',
    },
  ];

  const handleBrowseClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
    } else if (['admin', 'super_admin'].includes(currentUser.role)) {
      setAdminActiveTab('dashboard');
      setPage('admin');
      window.scrollTo(0, 0);
    } else {
      setStudentActiveTab('lost');
      setPage('dashboard');
      window.scrollTo(0, 0);
    }
  };

  const handleReportActionClick = (type: 'lost' | 'found') => {
    setReportType(type);
    if (!currentUser) {
      setShowLoginModal(true);
    } else if (['admin', 'super_admin'].includes(currentUser.role)) {
      setAdminActiveTab('receive');
      setPage('admin');
      window.scrollTo(0, 0);
    } else {
      setStudentActiveTab('report');
      setPage('dashboard');
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-[#FFF8F9]">
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-center overflow-visible">
        {/* Soft background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl -z-20 animate-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl -z-20 animate-blob" style={{ animationDelay: '5s' }} />

        {/* Hero Content */}
        <div className="md:col-span-6 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light border border-primary/10 text-primary font-sans text-xs font-semibold mb-6"
          >
            <Sparkles size={12} />
            <span>Official Campus Lost & Found Registry</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-textMain tracking-tight leading-[1.08] mb-6"
          >
            Retrieve Lost Belongings.<br />
            Securely. Instantly.<br />
            <span className="text-primary">CampusReturn.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-textMuted leading-relaxed max-w-lg mb-8 font-medium"
          >
            Recover lost essentials on campus. Access the real-time database, match descriptions automatically, and complete owner validation check-outs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button
              onClick={handleBrowseClick}
              className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-sans text-sm font-semibold shadow-md hover:shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse Lost & Found Items
            </button>
          </motion.div>
        </div>

        {/* Hero Right Graphic */}
        <div className="md:col-span-6 w-full overflow-visible">
          <FloatingObjects />
        </div>
      </section>

      {/* 2. REPORT ACTION PANEL (Equally important triggers) */}
      <section className="py-12 px-4 bg-white border-t border-b border-borderMain/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-lg md:text-xl font-sans font-bold text-textMain tracking-tight">
            Have you lost an item on campus?
          </h3>
          <p className="text-xs text-textMuted max-w-lg mx-auto leading-relaxed">
            Report details immediately to help safety officers log your lost items and correlate claims. Choose the option below to begin:
          </p>

          <div className="flex gap-4 justify-center max-w-xs mx-auto pt-2">
            <button
              onClick={() => handleReportActionClick('lost')}
              className="w-full py-3.5 px-6 bg-white border border-borderMain hover:border-rose-300 text-rose-600 font-sans text-xs font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
              Report Lost Item
            </button>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <HowItWorks />

      {/* 4. REDESIGNED CORE CAPABILITIES (Minimalist, human-designed cards) */}
      <section className="py-20 px-4 bg-white border-b border-borderMain/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-accent bg-accent-light px-3.5 py-1.5 rounded-full">
              System Features
            </span>
            <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-textMain tracking-tight mt-4">
              Core Capabilities Built for Students
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-bgMain border border-borderMain/60 p-6 rounded-2xl text-left hover:border-primary/30 hover:shadow-soft transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${item.color} group-hover:scale-105 transition-transform`}>
                      <Icon size={18} />
                    </div>
                    <h4 className="font-sans font-bold text-xs text-textMain group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-textMuted leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CAMPUS SAFETY & MISSION */}
      <section className="py-20 px-4 bg-bgMain border-b border-borderMain/50">
        <div className="max-w-4xl mx-auto text-left grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100/50">
              Campus Security Mission
            </span>
            <h3 className="text-2xl md:text-3xl font-sans font-extrabold text-textMain tracking-tight">
              Establishing a Secure, Compliant Recovery Ecosystem
            </h3>
            <p className="text-xs text-textMuted leading-relaxed font-medium">
              CampusReturn was created to streamline lost property audits and return operations. We aim to reunite students with their belongings quickly and securely, using barcode verification and automated receipt records to ensure accountability at every step.
            </p>
          </div>

          <div className="md:col-span-5 bg-white border border-borderMain rounded-3xl p-6 shadow-soft space-y-4 text-xs font-semibold text-textMain">
            <h4 className="font-bold text-[10px] uppercase text-primary tracking-wider flex items-center gap-1.5">
              <Shield size={14} />
              <span>Safety Office Directory</span>
            </h4>
            
            <div className="space-y-3.5 pt-1.5">
              <div className="flex gap-2.5 items-start">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold">Office Room 102</p>
                  <p className="text-[10px] text-textMuted font-medium mt-0.5">IT Block, Ground Floor</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <Clock size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold">Operating Hours</p>
                  <p className="text-[10px] text-textMuted font-medium mt-0.5">Mon – Fri, 9:00 AM – 5:00 PM</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold">Direct Assistance</p>
                  <p className="text-[10px] text-textMuted font-medium mt-0.5">+91 452 248 2240 (ext. 404)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-12 px-4 bg-white mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-xs">CR</span>
            </div>
            <span className="font-sans font-bold text-sm text-textMain">
              Campus<span className="text-primary font-medium">Return</span>
            </span>
          </div>

          <p className="text-xs text-textMuted font-medium">
            &copy; {new Date().getFullYear()} CampusReturn Safety Portal. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-textMuted">
            <button className="hover:text-primary transition-colors">Privacy Policy</button>
            <button className="hover:text-primary transition-colors">Terms of Use</button>
            <button className="hover:text-primary transition-colors">Safety Code</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
