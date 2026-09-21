/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        agri: {
          green: '#16a34a',
          emerald: '#22c55e',
          lightGreen: '#dcfce7',
          darkGreen: '#14532d',
          blue: '#2563eb',
          lightBlue: '#dbeafe',
          darkBlue: '#1e3a8a',
          orange: '#16a34a',
          lightOrange: '#dcfce7',
          gold: '#eab308',
          earth: '#78350f'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
