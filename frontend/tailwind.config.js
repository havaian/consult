/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'royal-gold': '#D4AF37',
        'royal-gold-light': '#E5C547',
        'royal-gold-dark': '#B8941F',
        'noble-black': '#0F0F0F',
        'charcoal': '#1A1A1A',
        'dark-gray': '#2A2A2A',
        'medium-gray': '#4A4A4A',
        'light-gray': '#6A6A6A',
        'silver': '#C0C0C0',
        'pearl': '#F8F8F8',
        'ivory': '#FFFEF7',
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #FFFEF7 0%, #F8F8F8 50%, #FFFFFF 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #E5C547 50%, #B8941F 100%)',
      },
      animation: {
        'float-legal': 'floatLegal 4s ease-in-out infinite',
        'pulse-legal': 'pulse 3s ease-in-out infinite',
        'slide-in': 'slideIn 1.2s ease-out',
      },
      keyframes: {
        floatLegal: {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)',
          },
          '25%': {
            transform: 'translateY(-10px) rotate(1deg)',
          },
          '50%': {
            transform: 'translateY(-15px) rotate(0deg)',
          },
          '75%': {
            transform: 'translateY(-10px) rotate(-1deg)',
          },
        },
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(50px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      boxShadow: {
        'glow': '0 20px 40px rgba(212, 175, 55, 0.15)',
        'glow-gold': '0 20px 40px rgba(212, 175, 55, 0.2)',
        'luxury-shadow': '0 25px 50px rgba(15, 15, 15, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}