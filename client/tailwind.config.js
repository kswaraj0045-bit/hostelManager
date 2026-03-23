export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        dark: '#0F0E17',
        surface: '#1C1B29',
        surface2: '#252436',
        success: '#2CB67D',
        warning: '#FF8906',
        danger: '#FF6584',
        muted: '#A7A9BE',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
