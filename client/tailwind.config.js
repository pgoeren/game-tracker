/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: {
          DEFAULT: '#2d1b69',
          dark: '#1e1248',
          hover: '#3d2b7a',
          active: 'rgba(255,255,255,0.15)',
        },
      },
    },
  },
  plugins: [],
};
