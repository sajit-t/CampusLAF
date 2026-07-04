import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FloatingObjects } from '../components/FloatingObjects';
import { HowItWorks } from '../components/HowItWorks';
import { motion, useInView } from 'framer-motion';
import { 
  Cpu, 
  Scan, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  Sliders, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';

// Count-up helper component for stats
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 1.5, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const isInView = useInView(elementRef, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const endVal = end;
    const totalTicks = 60;
    const stepTime = (duration * 1000) / totalTicks;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      const progress = tick / totalTicks;
      // Ease out quad
      const current = Math.floor(endVal * (progress * (2 - progress)));
      setCount(current);

      if (tick >= totalTicks) {
        setCount(endVal);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end, duration, isInView]);

  return <span ref={elementRef}>{count}{suffix}</span>;
};

export const LandingPage: React.FC = () => {
  const { setPage } = useApp();

  const features = [
    {
      title: 'Smart AI Matching',
      desc: 'Neural language heuristics compare descriptions, colors, shapes, and location keywords instantly to find matching pairs.',
      icon: Cpu,
      color: 'bg-primary-light text-primary',
    },
    {
      title: 'Barcode ID Verification',
      desc: 'Verify students and item claimants securely using their university barcode. Prevent false claims in one scan.',
      icon: Scan,
      color: 'bg-accent-light text-accent',
    },
    {
      title: 'Descriptive Location Logs',
      desc: 'Verify where items were turned in or found using structured campus locations, including blocks, floors, and corridors.',
      icon: MapPin,
      color: 'bg-emerald-50 text-emerald-500',
    },
    {
      title: 'Real-time Notifications',
      desc: 'Get alerted instantly when a candidate matches your lost item, or when claims are verified by administrators.',
      icon: Bell,
      color: 'bg-amber-50 text-amber-500',
    },
    {
      title: 'Secure Claims Portal',
      desc: 'Verify ownership through custom validation questionnaires, digital signatures, and automated receipts.',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-500',
    },
    {
      title: 'Admin Analytics Panel',
      desc: 'Rich dashboards for campus staff to trace recovery times, item locations, claim approvals, and campus metrics.',
      icon: Sliders,
      color: 'bg-sky-50 text-sky-500',
    },
  ];

  const stats = [
    { label: 'Recovered Items', val: 1240, suffix: '+', icon: CheckCircle2, color: 'text-primary' },
    { label: 'Average Return Time', val: 4, suffix: ' hrs', icon: Clock, color: 'text-accent' },
    { label: 'Success Match Rate', val: 94, suffix: '%', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Students Helped', val: 890, suffix: '', icon: Users, color: 'text-sky-500' },
  ];

  const testimonials = [
    {
      quote: "Losing my MacBook at the library right before finals was a nightmare. CampusReturn matched it with a found report within 10 minutes. The barcode scan check-out was fast and secure.",
      author: "Alex Rivers",
      role: "Computer Science Junior",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    },
    {
      quote: "I found a designer leather wallet in the dining hall and posted it here. The admin verified the owner via scanner, and I got a thank you note the next day. It's so clean and simple.",
      author: "Derrick Vance",
      role: "Business Sophomore",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
    },
    {
      quote: "As campus safety admins, managing lost and found used to take hours of logging. Now, the AI matching does the heavy lifting, and students scan their own IDs. Massive timesaver.",
      author: "Chief Miller",
      role: "Campus Safety Director",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-center overflow-visible">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl -z-20 animate-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl -z-20 animate-blob" style={{ animationDelay: '5s' }} />

        {/* Hero Left Content */}
        <div className="md:col-span-6 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light border border-primary/10 text-primary font-sans text-xs font-semibold mb-6"
          >
            <Sparkles size={12} />
            <span>Built exclusively for college campuses</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl font-sans font-extrabold text-textMain tracking-tight leading-[1.08] mb-6"
          >
            Find it.<br />
            Report it.<br />
            <span className="text-primary">Return it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-textMuted leading-relaxed max-w-lg mb-8 font-medium"
          >
            The smartest way to recover lost belongings across your campus. Instantly matches items and verifies ownership in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => {
                setPage('dashboard');
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-sans text-sm font-semibold shadow-md hover:shadow-lg shadow-primary/10 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Browse Lost Catalog
            </button>
            <button
              onClick={() => {
                setPage('admin');
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-bgMain text-textMain font-sans text-sm font-semibold border border-borderMain hover:border-textMuted transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-1.5"
            >
              Office Admin Access
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>

        {/* Hero Right Graphic */}
        <div className="md:col-span-6 w-full overflow-visible">
          <FloatingObjects />
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <HowItWorks />

      {/* 3. FEATURES SECTION */}
      <section className="py-24 px-4 bg-bgMain border-b border-borderMain/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-accent bg-accent-light px-3.5 py-1.5 rounded-full">
              Core Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-textMain tracking-tight mt-4">
              Everything you need to retrieve items safely
            </h2>
            <p className="text-sm text-textMuted mt-3 leading-relaxed">
              Designed with college student lifespans in mind. Fast reporting, automated matches, descriptive campus locations, and zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
                  className="bg-white border border-borderMain/60 p-8 rounded-2xl shadow-soft hover:shadow-hover hover:-translate-y-1.5 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 font-bold ${feature.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-sans font-bold text-base text-textMain mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-textMuted leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. STATISTICS SECTION */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full bg-borderMain/30 flex items-center justify-center ${stat.color} mb-3.5`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-4xl md:text-5xl font-sans font-extrabold text-textMain tracking-tight">
                    <CountUp end={stat.val} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs text-textMuted font-semibold uppercase tracking-wider mt-2.5">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section className="py-24 px-4 bg-bgMain border-t border-borderMain/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-primary bg-primary-light px-3.5 py-1.5 rounded-full">
              Wall of Trust
            </span>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-textMain tracking-tight mt-4">
              Loved by students and safety officers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <motion.div
                key={test.author}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-borderMain/60 p-6 rounded-2xl shadow-soft flex flex-col justify-between"
              >
                <p className="text-xs text-textMuted italic leading-relaxed mb-6">
                  "{test.quote}"
                </p>
                <div className="flex items-center gap-3.5">
                  <img
                    src={test.avatar}
                    alt={test.author}
                    className="w-10 h-10 rounded-full object-cover border border-borderMain"
                  />
                  <div className="text-left">
                    <h4 className="font-sans font-bold text-xs text-textMain">{test.author}</h4>
                    <p className="text-[10px] text-textMuted font-medium">{test.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. MINIMAL FOOTER */}
      <footer className="mt-auto py-12 px-4 border-t border-borderMain/50 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-xs">CR</span>
            </div>
            <span className="font-sans font-bold text-sm text-textMain">
              Campus<span className="text-primary font-medium">Return</span>
            </span>
          </div>

          <p className="text-xs text-textMuted">
            &copy; {new Date().getFullYear()} CampusReturn Inc. Built for college retrieval compliance.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-textMuted">
            <button className="hover:text-primary transition-colors">Privacy</button>
            <button className="hover:text-primary transition-colors">Terms of Service</button>
            <button className="hover:text-primary transition-colors">Safety Guidelines</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
