/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#D4A853',
        'primary-foreground': '#FFFFFF',
        background: '#FFFFF7',
        foreground: '#1A1A1A',
        muted: '#E8E4D9',
        'muted-foreground': '#1A1A1A/60',
        card: '#FFFFFF',
        destructive: '#EF4444',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
};
