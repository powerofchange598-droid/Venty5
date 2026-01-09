/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,jsx}',
    './components/**/*.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Inter', 'serif'],
      },
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'border-primary': 'var(--border-primary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'brand-primary': 'var(--brand-primary)',
        'brand-on-primary': 'var(--brand-on-primary)',
        'brand-accent': 'var(--brand-accent)',
        'feedback-success': 'var(--feedback-success)',
        'feedback-error': 'var(--feedback-error)',
        'feedback-warning': 'var(--feedback-warning)',
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        'card-hover': 'var(--shadow-md)',
        floating: 'var(--shadow-lg)',
        btn: 'var(--btn-shadow)',
      },
    },
  },
  plugins: [],
};
