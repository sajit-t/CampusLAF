import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const FloatingObjects: React.FC = () => {
  // Parallax mouse tracker
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for translation
  const springConfig = { stiffness: 60, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Map mouse coordinates to pixel offsets from center
      const x = (clientX - innerWidth / 2) / 30;
      const y = (clientY - innerHeight / 2) / 30;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Different parallax levels for each item
  const laptopX = useTransform(smoothX, (x) => x * 0.4);
  const laptopY = useTransform(smoothY, (y) => y * 0.4);

  const headphonesX = useTransform(smoothX, (x) => x * 0.8);
  const headphonesY = useTransform(smoothY, (y) => y * 0.8);

  const idCardX = useTransform(smoothX, (x) => x * 1.2);
  const idCardY = useTransform(smoothY, (y) => y * 1.2);

  const bottleX = useTransform(smoothX, (x) => x * 0.6);
  const bottleY = useTransform(smoothY, (y) => y * 0.6);

  const walletX = useTransform(smoothX, (x) => x * 0.5);
  const walletY = useTransform(smoothY, (y) => y * 0.5);

  const keysX = useTransform(smoothX, (x) => x * 0.9);
  const keysY = useTransform(smoothY, (y) => y * 0.9);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center select-none overflow-visible">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-light/30 via-accent-light/20 to-transparent blur-3xl rounded-full scale-75 -z-10" />

      {/* 1. LAPTOP (Center background - slow drift) */}
      <motion.div
        style={{ x: laptopX, y: laptopY }}
        animate={{ y: [0, -12, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[240px] md:w-[320px] left-[2%] md:left-[24%] top-[30%] md:top-[28%] z-10"
      >
        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-xl">
          {/* Laptop Base Shadow */}
          <ellipse cx="160" cy="180" rx="140" ry="12" fill="#E6D3DA" fillOpacity="0.4" />
          {/* Laptop screen back */}
          <rect x="30" y="20" width="260" height="150" rx="12" fill="#3D3A40" />
          {/* Bezel inner */}
          <rect x="38" y="28" width="244" height="134" rx="6" fill="#1C1A1E" />
          {/* Screen Content - Neon Purple wallpaper */}
          <rect x="42" y="32" width="236" height="126" rx="4" fill="url(#screenGrad)" />
          <text x="160" y="90" fill="#FFFFFF" fillOpacity="0.85" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            CampusReturn
          </text>
          <text x="160" y="106" fill="#FF9CE9" fillOpacity="0.7" fontSize="8" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">
            PROTECTING YOUR GEAR
          </text>
          {/* Laptop hinge */}
          <rect x="110" y="165" width="100" height="10" rx="2" fill="#5F5A63" />
          {/* Keyboard deck */}
          <path d="M10 170 C10 170 30 185 45 185 L275 185 C290 185 310 170 310 170 C310 170 305 185 295 188 C285 190 35 190 25 188 C15 185 10 170 10 170 Z" fill="#2E2C30" />
          {/* Trackpad area */}
          <rect x="135" y="177" width="50" height="8" rx="2" fill="#444147" />

          {/* Gradients */}
          <defs>
            <linearGradient id="screenGrad" x1="42" y1="32" x2="278" y2="158" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#AD56C4" />
              <stop offset="50%" stopColor="#FF8DA1" />
              <stop offset="100%" stopColor="#FFF8F9" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* 2. STUDENT ID CARD (Front center-right - fast parallax, floats high) */}
      <motion.div
        style={{ x: idCardX, y: idCardY }}
        animate={{ y: [0, -18, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute w-[160px] md:w-[210px] left-[5%] md:left-auto md:right-[5%] top-[2%] md:top-[6%] z-30"
      >
        <svg viewBox="0 0 210 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-xl">
          {/* ID Card Shadow */}
          <rect x="0" y="0" width="210" height="130" rx="16" fill="black" fillOpacity="0.04" />
          {/* ID Card Base */}
          <rect x="0" y="0" width="210" height="130" rx="16" fill="#FFFFFF" stroke="#F2E6EA" strokeWidth="2.5" />
          {/* Purple Top Ribbon */}
          <rect x="0" y="0" width="210" height="24" rx="16" fill="#AD56C4" />
          {/* Chop top corners of ribbon back to card shape */}
          <path d="M0 16 C0 10 10 0 16 0 L194 0 C200 0 210 10 210 16 L210 24 L0 24 Z" fill="#AD56C4" />
          {/* Header Text */}
          <text x="12" y="16" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">
            STATE UNIVERSITY
          </text>
          {/* Student Photo Frame */}
          <rect x="15" y="38" width="48" height="58" rx="8" fill="#F8EEFA" stroke="#E6D3DA" strokeWidth="1.5" />
          {/* Avatar Icon */}
          <circle cx="39" cy="58" r="12" fill="#AD56C4" fillOpacity="0.2" />
          <path d="M24 82 C24 72 30 70 39 70 C48 70 54 72 54 82 Z" fill="#AD56C4" fillOpacity="0.4" />
          {/* Card Info Details */}
          <text x="75" y="52" fill="#1E1E1E" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
            Student
          </text>
          <text x="75" y="66" fill="#6B7280" fontSize="8" fontFamily="sans-serif">
            Student ID
          </text>
          <text x="75" y="78" fill="#1E1E1E" fontSize="9" fontWeight="medium" fontFamily="sans-serif">
            # 984-512
          </text>
          <text x="75" y="90" fill="#6B7280" fontSize="8" fontFamily="sans-serif">
            Status
          </text>
          <text x="75" y="101" fill="#10B981" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
            ● Active
          </text>
          {/* Barcode representation */}
          <g transform="translate(15, 108)">
            <rect x="0" y="0" width="3" height="12" fill="#1E1E1E" />
            <rect x="5" y="0" width="1.5" height="12" fill="#1E1E1E" />
            <rect x="8" y="0" width="4" height="12" fill="#1E1E1E" />
            <rect x="14" y="0" width="2" height="12" fill="#1E1E1E" />
            <rect x="18" y="0" width="1.5" height="12" fill="#1E1E1E" />
            <rect x="21" y="0" width="5" height="12" fill="#1E1E1E" />
            <rect x="28" y="0" width="2" height="12" fill="#1E1E1E" />
            <rect x="32" y="0" width="4" height="12" fill="#1E1E1E" />
            <rect x="38" y="0" width="1.5" height="12" fill="#1E1E1E" />
            <rect x="41" y="0" width="3.5" height="12" fill="#1E1E1E" />
            <rect x="47" y="0" width="1" height="12" fill="#1E1E1E" />
            <rect x="50" y="0" width="4.5" height="12" fill="#1E1E1E" />
          </g>
        </svg>
      </motion.div>

      {/* 3. WATER BOTTLE (Left foreground - medium speed) */}
      <motion.div
        style={{ x: bottleX, y: bottleY }}
        animate={{ y: [0, -14, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute w-[90px] md:w-[120px] right-[2%] md:right-auto md:left-[4%] top-[4%] md:top-[12%] z-20"
      >
        <svg viewBox="0 0 120 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
          {/* Flask Shadow */}
          <ellipse cx="60" cy="245" rx="35" ry="8" fill="#E6D3DA" fillOpacity="0.4" />
          {/* Flask Body - Oatmeal Color */}
          <rect x="25" y="60" width="70" height="180" rx="14" fill="#EAE0DB" stroke="#F2E6EA" strokeWidth="1" />
          {/* Metal Band on neck */}
          <rect x="35" y="48" width="50" height="12" rx="2" fill="#B3B0A9" />
          {/* Cap Handle/Lid - Black rubber */}
          <path d="M40 25 C40 25 35 48 50 48 L70 48 C85 48 80 25 80 25 C80 25 75 12 60 12 C45 12 40 25 40 25 Z" fill="#2E2C30" />
          {/* Handle center hole */}
          <circle cx="60" cy="28" r="8" fill="#FFF8F9" />
          {/* Yosemite Sticker mockup */}
          <circle cx="60" cy="140" r="22" fill="#AD56C4" />
          <path d="M42 148 L53 130 L60 139 L68 126 L78 148 Z" fill="#FFFFFF" />
          <circle cx="68" cy="128" r="2" fill="#FF9CE9" />
          <text x="60" y="156" fill="#FFFFFF" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            YOSEMITE
          </text>
        </svg>
      </motion.div>

      {/* 4. HEADPHONES (Right background - slow tilt) */}
      <motion.div
        style={{ x: headphonesX, y: headphonesY }}
        animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute w-[160px] md:w-[200px] right-[2%] md:right-[3%] bottom-[2%] md:bottom-[8%] z-10"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-xl">
          {/* Headband */}
          <path d="M40 100 C40 40 160 40 160 100" stroke="#FF8DA1" strokeWidth="12" strokeLinecap="round" />
          {/* Headband cushion */}
          <path d="M55 85 C55 48 145 48 145 85" stroke="#FF9CE9" strokeWidth="8" strokeLinecap="round" />
          {/* Left Earcup Slider */}
          <rect x="36" y="90" width="8" height="30" rx="4" fill="#F2E6EA" />
          {/* Right Earcup Slider */}
          <rect x="156" y="90" width="8" height="30" rx="4" fill="#F2E6EA" />
          {/* Left Cup */}
          <rect x="24" y="105" width="32" height="60" rx="16" fill="#FF8DA1" />
          <rect x="18" y="112" width="8" height="46" rx="4" fill="#FF9CE9" />
          {/* Right Cup */}
          <rect x="144" y="105" width="32" height="60" rx="16" fill="#FF8DA1" />
          <rect x="174" y="112" width="8" height="46" rx="4" fill="#FF9CE9" />
        </svg>
      </motion.div>

      {/* 5. LEATHER WALLET (Bottom-left center - medium-fast speed) */}
      <motion.div
        style={{ x: walletX, y: walletY }}
        animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute w-[120px] md:w-[150px] left-[2%] md:left-[6%] bottom-[4%] md:bottom-[8%] z-30"
      >
        <svg viewBox="0 0 150 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-md">
          {/* Shadow */}
          <rect x="10" y="10" width="130" height="90" rx="12" fill="black" fillOpacity="0.06" />
          {/* Back pocket leather */}
          <rect x="10" y="10" width="130" height="90" rx="12" fill="#8B5A2B" stroke="#70441E" strokeWidth="1.5" />
          {/* Credit card sticking out */}
          <rect x="25" y="2" width="90" height="45" rx="6" fill="#FF9CE9" stroke="#E6D3DA" strokeWidth="1" />
          <circle cx="40" cy="15" r="5" fill="#AD56C4" />
          <rect x="30" y="28" width="40" height="6" rx="2" fill="#FFFFFF" fillOpacity="0.7" />
          {/* Front overlap leather */}
          <path d="M10 40 L140 40 L140 100 C140 106 134 110 128 110 L22 110 C16 110 10 106 10 100 Z" fill="#A0522D" stroke="#70441E" strokeWidth="1.5" />
          {/* Wallet Stitching effect */}
          <path d="M15 45 L135 45 M15 105 L135 105 M15 45 L15 105 M135 45 L135 105" stroke="#CD853F" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </motion.div>

      {/* 6. KEYS & RED LANYARD (Bottom-right center - fast speed) */}
      <motion.div
        style={{ x: keysX, y: keysY }}
        animate={{ y: [0, -17, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute w-[120px] md:w-[155px] left-[35%] md:left-[38%] bottom-[2%] md:bottom-[6%] z-20"
      >
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
          {/* Red Lanyard Fabric */}
          <path d="M60 40 L50 140 C50 145 42 150 35 150 C28 150 20 145 20 140 L40 40 Z" fill="#FF8DA1" />
          <path d="M40 40 L30 140 C30 143 25 146 20 146" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
          {/* Lanyard Text representation */}
          <text x="35" y="90" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle" transform="rotate(-78, 35, 90)" fontFamily="sans-serif">
            CAMPUS RETURN
          </text>
          {/* Key Ring */}
          <circle cx="65" cy="35" r="14" stroke="#B3B0A9" strokeWidth="3" fill="none" />
          {/* Car Key Fob - Black */}
          <rect x="70" y="25" width="30" height="50" rx="8" fill="#2E2C30" stroke="#1E1E1E" strokeWidth="1.5" transform="rotate(15, 85, 50)" />
          {/* Buttons on fob */}
          <circle cx="82" cy="38" r="4" fill="#FF8DA1" />
          <circle cx="92" cy="42" r="4" fill="#B3B0A9" />
          <rect x="83" y="52" width="12" height="6" rx="1.5" fill="#B3B0A9" transform="rotate(15, 89, 55)" />
          {/* Metal Key blade */}
          <path d="M58 24 L42 12 L38 14 L42 22 L35 24 L39 30 L55 28 Z" fill="#B3B0A9" stroke="#7E7B74" strokeWidth="1" />
        </svg>
      </motion.div>
    </div>
  );
};
