import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Cpu, Package } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: 'Lose Item',
      desc: 'Misplace your laptop, keys, water bottle, or headphones on campus.',
      icon: AlertCircle,
      color: '#FF8DA1', // Accent
    },
    {
      title: 'Report',
      desc: 'Quickly log the item description, category, and date on our smart portal.',
      icon: FileText,
      color: '#AD56C4', // Primary
    },
    {
      title: 'AI Match',
      desc: 'Our neural matching engine cross-references and computes confidence scores.',
      icon: Cpu,
      color: '#FF9CE9', // Secondary
    },
    {
      title: 'Collect',
      desc: 'Scan your student ID barcode, verify ownership, and collect your item.',
      icon: Package,
      color: '#10B981', // Success
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 15,
      },
    },
  };

  return (
    <section className="py-24 px-4 bg-white border-y border-borderMain/50 relative overflow-hidden">
      {/* Decorative dots background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ 
        backgroundImage: 'radial-gradient(#AD56C4 1.5px, transparent 1.5px)', 
        backgroundSize: '24px 24px' 
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-widest font-extrabold text-primary bg-primary-light px-3.5 py-1.5 rounded-full"
          >
            How it works
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-sans font-bold text-textMain tracking-tight mt-4"
          >
            Simple, automated, and secure
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm text-textMuted mt-3 leading-relaxed"
          >
            Say goodbye to messy Facebook groups and manual lost-and-found spreadsheets. 
            CampusReturn takes care of the retrieval pipeline in four clean steps.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative"
        >
          {/* Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-[2px] bg-borderMain/70 z-0">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent via-primary to-emerald-400 origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={step.title}
                variants={itemVariants}
                className="flex flex-col items-center text-center relative z-10 group"
              >
                {/* Step circle */}
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-300 group-hover:scale-105 shadow-soft bg-white"
                  style={{ 
                    borderColor: '#F2E6EA',
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: step.color }}
                  >
                    <Icon size={26} />
                  </div>
                </div>

                {/* Step badge */}
                <div className="text-[10px] font-sans font-bold text-textMuted bg-borderMain/50 px-2.5 py-1 rounded-full mb-3">
                  STEP 0{idx + 1}
                </div>

                {/* Details */}
                <h3 className="font-sans font-bold text-base text-textMain group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-textMuted leading-relaxed mt-2 max-w-[200px] md:max-w-none">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
