/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Lab-bench / signal-processing palette
        base: '#0b0d12',
        panel: '#131722',
        'panel-2': '#1b2030',
        line: '#262c3d',
        'line-soft': '#1f2434',
        ink: '#e4e8f0',
        muted: '#8893a6',
        faint: '#4f5970',
        // primary phosphor green — "benign" / OK signal
        signal: {
          DEFAULT: '#6dd596',
          bright: '#9febb4',
          dim: '#2c5a3e',
        },
        // hot magenta — "adversarial" / attack trace
        attack: {
          DEFAULT: '#ff5db1',
          bright: '#ff8fd0',
          dim: '#6a1e4a',
        },
        // data blue — neutral data overlay
        data: {
          DEFAULT: '#7fb6ff',
          bright: '#a8cdff',
          dim: '#26466f',
        },
        // amber/warn for callouts
        warn: {
          DEFAULT: '#ffc857',
          bright: '#ffd989',
          dim: '#664c14',
        },
        fault: '#ff5c5c',
        go: '#34e07a',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(109,213,150,0.25), 0 0 24px -4px rgba(109,213,150,0.40)',
        'glow-attack': '0 0 0 1px rgba(255,93,177,0.25), 0 0 24px -4px rgba(255,93,177,0.40)',
        'glow-data': '0 0 0 1px rgba(127,182,255,0.25), 0 0 24px -4px rgba(127,182,255,0.40)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.2' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.4s ease-in-out infinite',
        flow: 'flow 0.6s linear infinite',
        sweep: 'sweep 2.4s linear infinite',
        blink: 'blink 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
