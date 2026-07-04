import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface TimelineProps {
  status: 'reported' | 'matched' | 'claiming' | 'verified' | 'returned';
}

export const Timeline: React.FC<TimelineProps> = ({ status }) => {
  const steps = [
    { key: 'reported', label: 'Reported', desc: 'Item logged on platform' },
    { key: 'matched', label: 'Matched', desc: 'AI found a candidate match' },
    { key: 'claiming', label: 'Claim Requested', desc: 'Ownership questions submitted' },
    { key: 'verified', label: 'Verified ID', desc: 'Student barcode validated' },
    { key: 'returned', label: 'Returned', desc: 'Handed back & receipt issued' },
  ];

  // Determine current step index
  const statusIndexes: Record<string, number> = {
    reported: 0,
    matched: 1,
    claiming: 2,
    verified: 3,
    returned: 4,
  };

  const currentIndex = statusIndexes[status] ?? 0;

  return (
    <div className="w-full py-8 px-4">
      {/* Horizontal timeline for desktop */}
      <div className="hidden md:flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-borderMain -translate-y-1/2 z-0 rounded-full" />

        {/* Foreground active progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: currentIndex / (steps.length - 1) }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ width: '100%' }}
        />

        {/* Timeline nodes */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center z-10 relative w-32 text-center">
              {/* Node bubble */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isActive ? [1, 1.1, 1] : 1,
                  opacity: 1
                }}
                transition={{ 
                  scale: isActive ? { repeat: Infinity, duration: 2 } : { duration: 0.3 },
                  opacity: { duration: 0.3 }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                    : isActive 
                      ? 'bg-white border-primary text-primary shadow-lg shadow-primary/10 ring-4 ring-primary-light' 
                      : 'bg-white border-borderMain text-textMuted'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span className="font-sans font-bold text-xs">{idx + 1}</span>
                )}
              </motion.div>

              {/* Text labels */}
              <div className="mt-3">
                <p className={`font-sans font-bold text-xs transition-colors duration-300 ${
                  isActive ? 'text-primary' : isFuture ? 'text-textMuted' : 'text-textMain'
                }`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-textMuted mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical timeline for mobile viewports */}
      <div className="md:hidden space-y-6 relative pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:bg-borderMain">
        {/* Active progress track for mobile */}
        <motion.div 
          className="absolute left-[15px] top-2 w-1 bg-primary rounded-full origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: currentIndex / (steps.length - 1) }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ 
            height: 'calc(100% - 16px)',
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.key} className="flex gap-4 items-start relative z-10">
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.08, 1] : 1
                }}
                transition={{
                  scale: isActive ? { repeat: Infinity, duration: 2 } : {}
                }}
                className={`w-8 h-8 -ml-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-white' 
                    : isActive 
                      ? 'bg-white border-primary text-primary ring-4 ring-primary-light' 
                      : 'bg-white border-borderMain text-textMuted'
                }`}
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="font-sans font-bold text-xs">{idx + 1}</span>
                )}
              </motion.div>

              <div>
                <h4 className={`font-sans font-bold text-sm leading-none ${
                  isActive ? 'text-primary' : 'text-textMain'
                }`}>
                  {step.label}
                </h4>
                <p className="text-xs text-textMuted mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
