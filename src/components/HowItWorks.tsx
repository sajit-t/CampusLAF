import React from 'react';
import { ClipboardCheck, SearchCode, ShieldAlert, BadgeCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: 'Report an Item',
      desc: 'Report a lost or found item in under a minute. Add photos, location, category, and details to help identify it.',
      icon: ClipboardCheck,
      color: 'bg-primary-light/50 text-primary border-primary/20',
      badge: 'Step 1'
    },
    {
      title: 'Smart Matching',
      desc: 'Our system compares reports using item details, categories, locations, and images to identify possible matches.',
      icon: SearchCode,
      color: 'bg-accent-light/50 text-accent border-accent/20',
      badge: 'Step 2'
    },
    {
      title: 'Verification',
      desc: "Office staff verify ownership using the student's ID card barcode or roll number before releasing the item.",
      icon: ShieldAlert,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'Step 3'
    },
    {
      title: 'Collect Your Item',
      desc: 'Once verified, collect your belongings from the campus lost and found office.',
      icon: BadgeCheck,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'Step 4'
    },
  ];

  return (
    <section className="py-16 px-4 bg-white border-y border-borderMain/50 relative overflow-hidden select-none">
      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest font-extrabold text-primary bg-primary-light px-3.5 py-1.5 rounded-full">
            Process Overview
          </span>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-textMain tracking-tight">
            How Campus Lost & Found Works
          </h2>
          <p className="text-xs md:text-sm text-textMuted leading-relaxed max-w-lg mx-auto">
            A fast and secure way to report, discover, and recover belongings across campus.
          </p>
        </div>

        {/* Steps Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.title}
                className="bg-bgMain border border-borderMain/60 p-6 rounded-2xl flex flex-col justify-between text-left hover:border-primary/20 hover:shadow-soft transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Step badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-sans font-extrabold text-textMuted bg-borderMain/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {step.badge}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold ${step.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-xs text-textMain group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-textMuted leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
