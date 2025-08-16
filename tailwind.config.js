/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'accent': 'rgb(140, 190, 175)', // Jekyll theme accent color
        'baker-blue': '#007eff', // Jekyll link color
        'light-grey': '#999', // Jekyll light grey
        'dark-text': '#222', // Jekyll body text color
      },
      fontFamily: {
        'asap': ['Asap', 'sans-serif'],
        'simply-sweet': ['SimplySweetSerif', 'serif'],
      },
      screens: {
        'tablet': '450px',
        'mid': '620px',
        'desktop': '900px',
      },
    },
  },
  plugins: [],
}