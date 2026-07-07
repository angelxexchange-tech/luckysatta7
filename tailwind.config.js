/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      animation: {
        'blink-glow': 'blinkGlow 1s infinite',
        'blink': 'blink 1s infinite',
        'blink-black': 'blinkBlack 1s infinite',
      },
      keyframes: {
        blinkGlow: {
          '0%, 100%': { 
            opacity: '1', 
            textShadow: '0 0 5px #fff, 0 0 10px #ff4da6, 0 0 20px #3b82f6' 
          },
          '50%': { 
            opacity: '0.5', 
            textShadow: 'none' 
          },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        blinkBlack: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      },
      fontFamily: {
        Roboto: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
