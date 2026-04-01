/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-pink-500', 'bg-lime-500', 'bg-orange-500', 'bg-sky-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
