/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: { DEFAULT: '#05050e', 800: '#0a0a1a', 700: '#101024' },
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'pulse-ring': 'pulseRing 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'spin-slow': 'spinSlow 12s linear infinite',
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(34, 211, 238, 0.4)',
        'glow-magenta': '0 0 24px rgba(232, 121, 249, 0.4)',
      },
    },
  },
  plugins: [],
};