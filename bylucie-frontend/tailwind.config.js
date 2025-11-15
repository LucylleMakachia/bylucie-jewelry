/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // color scheme
        'orange-500': '#ff5000',
        'orange-600': '#ff8c00',
        'brown-500': '#b8860b',
        'yellow-400': '#ffc200',
        'yellow-500': '#ffd700',
        'green-900': '#002200',

        sunGold: '#E6A52D',
        sunGoldHighlight: '#FFD700',
        earthyBrownDark: '#3E2C23',
        earthyBrownLight: '#6B4226',
        forestGreenDark: '#52734D',
        forestGreenLight: '#A5B68D',
        creamBg: '#FAF3E0',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Poppins', 'Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}