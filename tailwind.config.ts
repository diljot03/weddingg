import type { Config } from 'tailwindcss';

// Every colour reads from a CSS variable so the Host Studio can re-theme the
// whole app at runtime (see lib/themes.ts).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './standalone/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: v('primary'),
        'on-primary': v('on-primary'),
        page: v('page'),
        card: v('card'),
        blush: v('blush'),
        gold: v('gold'),
        'on-gold': v('on-gold'),
        ink: v('ink'),
        muted: v('muted'),
      },
      fontFamily: {
        script: 'var(--font-script)',
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
    },
  },
  plugins: [],
};
export default config;
