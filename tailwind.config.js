/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#AD56C4',
          hover: '#9745ad',
          light: '#F8EEFA',
        },
        secondary: {
          DEFAULT: '#FF9CE9',
          light: '#FFEBFB',
        },
        accent: {
          DEFAULT: '#FF8DA1',
          light: '#FFF0F2',
        },
        softBg: '#FFC2BA',
        bgMain: '#FFF8F9',
        cardMain: '#FFFFFF',
        textMain: '#1E1E1E',
        textMuted: '#6B7280',
        borderMain: '#F2E6EA',
      },
      borderRadius: {
        '20': '20px',
        '2xl': '20px', // Standardize 20px to 2xl for ease of use
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(242, 230, 234, 0.8), 0 2px 10px -1px rgba(173, 86, 196, 0.05)',
        premium: '0 10px 40px -10px rgba(173, 86, 196, 0.12), 0 1px 3px rgba(0, 0, 0, 0.01)',
        card: '0 8px 30px rgba(242, 230, 234, 0.6)',
        hover: '0 20px 40px -5px rgba(173, 86, 196, 0.15), 0 1px 5px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
