/**
 * Design system "Tactical NOC & Command Center" — tokens copiados do
 * `tailwind.config` das telas do Google Stitch (fonte de verdade do layout).
 *
 * Única diferença: as cores apontam para variáveis CSS (ver index.css) em vez
 * de HEX fixo. O tema escuro usa exatamente os HEX do Stitch; as variáveis
 * existem para o tema Claro e o modo Sistema, que são funcionalidades reais
 * do Orbi (Configurações > Geral & Aparência).
 *
 * Orbi — Criado por Vinicius Braga
 */
const path = require('path');

const COLOR_TOKENS = [
  'inverse-surface', 'secondary-fixed-dim', 'surface-container-low', 'on-tertiary-container', 'tertiary-fixed-dim',
  'surface-bright', 'on-surface', 'on-secondary-fixed', 'secondary', 'error-container', 'tertiary',
  'inverse-on-surface', 'outline-variant', 'on-secondary', 'surface-container-high', 'on-tertiary-fixed-variant',
  'primary-fixed', 'primary', 'on-background', 'on-secondary-container', 'primary-container', 'on-tertiary-fixed',
  'background', 'on-error', 'on-primary-fixed-variant', 'inverse-primary', 'on-primary-container', 'secondary-fixed',
  'surface-variant', 'on-tertiary', 'on-primary-fixed', 'surface-container-highest', 'error', 'surface-dim',
  'primary-fixed-dim', 'on-secondary-fixed-variant', 'on-primary', 'surface-container', 'outline', 'surface',
  'surface-tint', 'secondary-container', 'on-error-container', 'tertiary-container', 'tertiary-fixed',
  'surface-container-lowest', 'on-surface-variant',
];

const colors = Object.fromEntries(COLOR_TOKENS.map((t) => [t, `rgb(var(--c-${t}) / <alpha-value>)`]));

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [path.join(__dirname, 'src/renderer/index.html'), path.join(__dirname, 'src/renderer/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors,
      borderRadius: { DEFAULT: '0.125rem', lg: '0.25rem', xl: '0.5rem', full: '0.75rem' },
      spacing: {
        'space-lg': '1.25rem',
        gutter: '0.75rem',
        margin: '1rem',
        'space-md': '0.75rem',
        'space-sm': '0.375rem',
        'space-xs': '0.25rem',
        'space-xl': '1.75rem',
      },
      fontFamily: {
        // Rótulos em fonte normal; a monoespaçada fica para números e métricas.
        'label-sm': ['Inter', 'Segoe UI', 'sans-serif'],
        'metric-xl': ['JetBrains Mono', 'Consolas', 'monospace'],
        'title-md': ['Inter', 'Segoe UI', 'sans-serif'],
        'headline-sm': ['Inter', 'Segoe UI', 'sans-serif'],
        'metric-md': ['JetBrains Mono', 'Consolas', 'monospace'],
        'body-lg': ['Inter', 'Segoe UI', 'sans-serif'],
        'body-sm': ['Inter', 'Segoe UI', 'sans-serif'],
        'badge-micro': ['JetBrains Mono', 'Consolas', 'monospace'],
        'code-sm': ['JetBrains Mono', 'Consolas', 'monospace'],
        'headline-lg': ['Inter', 'Segoe UI', 'sans-serif'],
        'headline-md': ['Inter', 'Segoe UI', 'sans-serif'],
        'display-lg': ['Inter', 'Segoe UI', 'sans-serif'],
        'body-md': ['Inter', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'metric-xl': ['28px', { lineHeight: '32px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'metric-md': ['18px', { lineHeight: '22px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'badge-micro': ['10px', { lineHeight: '12px', letterSpacing: '0.04em', fontWeight: '700' }],
        'code-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      keyframes: {
        'pulse-dot': { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.4', transform: 'scale(0.85)' } },
      },
      animation: { 'pulse-dot': 'pulse-dot 1.8s infinite ease-in-out' },
    },
  },
  plugins: [],
};
