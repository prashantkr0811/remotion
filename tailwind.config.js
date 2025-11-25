/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Ye opacity fix ke liye (Turbopack error solve karega)
      backgroundOpacity: (theme) => theme('opacity'),
      textOpacity: (theme) => theme('opacity'),
      borderOpacity: (theme) => theme('opacity'),
      // Backdrop blur fix ke liye
      backdropBlur: {
        xs: '2px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}