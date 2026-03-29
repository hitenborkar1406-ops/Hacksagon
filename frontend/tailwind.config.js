/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'clinical-bg':      '#F4F6F8',
        'clinical-surface': '#FFFFFF',
        'clinical-raised':  '#F0F2F5',
        'clinical-border':  '#E2E6EA',
        'clinical-border2': '#CDD2D8',
        'clinical-text':    '#1A1D23',
        'clinical-muted':   '#52606D',
        'clinical-hint':    '#8A97A4',
        'accent-blue':      '#2C7BE5',
        'accent-blue-bg':   '#EBF3FD',
        'accent-blue-dark': '#1A4F9C',
        'alert-red':        '#D93025',
        'alert-red-bg':     '#FDECEA',
        'alert-red-dark':   '#9B2218',
        'warn-amber':       '#F4A100',
        'warn-amber-bg':    '#FEF6E4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
