/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vocational: {
          DEFAULT: '#932D16',
          50: '#FDF4F2',
          100: '#FCE7E3',
          200: '#F8D1C8',
          300: '#F1B0A1',
          400: '#E47B62',
          500: '#BE4427',
          600: '#932D16', // สีแดงอาชีวะตามที่ผู้ใช้ระบุ
          700: '#7A2411',
          800: '#641E0F',
          900: '#521B10',
          950: '#2E0C06',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
