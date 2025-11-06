/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          925: "#151515"
        }
      }
    },
  },
  plugins: [],
}
