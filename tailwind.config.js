/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        blue: {
          100: '#dbeafe',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
        green: {
          100: '#dcfce7',
          700: '#15803d',
        },
        yellow: {
          100: '#fef3c7',
          700: '#b45309',
        },
        purple: {
          100: '#f3e8ff',
          700: '#7e22ce',
        },
        orange: {
          100: '#fed7aa',
          700: '#b45309',
        },
        red: {
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      spacing: {
        8: '2rem',
      },
      fontSize: {
        sm: '0.875rem',
        base: '1rem',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      transitionProperty: {
        colors: 'color, background-color, border-color',
      },
    },
  },
  plugins: [],
};