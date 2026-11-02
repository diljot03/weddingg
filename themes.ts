import type { ThemeChoice } from './defaults';

export type Palette = {
  name: string;
  dark?: boolean;
  primary: string;
  onPrimary: string;
  page: string;
  card: string;
  blush: string;
  gold: string;
  onGold: string;
  ink: string;
  muted: string;
};

export const PALETTES: Record<string, Palette> = {
  royal: {
    name: 'Royal Maroon',
    primary: '#581826', onPrimary: '#FAF5EE', page: '#FAF5EE', card: '#FFFCF7', blush: '#E8D5D8',
    gold: '#C6A355', onGold: '#3E0F1A', ink: '#2E1418', muted: '#7A5A60',
  },
  emerald: {
    name: 'Mughal Emerald',
    primary: '#0F4D3F', onPrimary: '#F7F2E6', page: '#F6F2E7', card: '#FFFDF6', blush: '#D6E6DC',
    gold: '#C9A24A', onGold: '#0B2E26', ink: '#10251F', muted: '#4F6A61',
  },
  marigold: {
    name: 'Haldi Marigold',
    primary: '#8A3B0F', onPrimary: '#FFF8E8', page: '#FFF7E6', card: '#FFFDF5', blush: '#FBE1AE',
    gold: '#D9A21B', onGold: '#3A1F0A', ink: '#3A1F0A', muted: '#80583A',
  },
  blush: {
    name: 'Rose Blush',
    primary: '#8E3F5F', onPrimary: '#FFF7F8', page: '#FFF6F5', card: '#FFFDFC', blush: '#F5DCE3',
    gold: '#C9A27E', onGold: '#3D2330', ink: '#3D2330', muted: '#86636F',
  },
  midnight: {
    name: 'Sangeet Midnight',
    dark: true,
    primary: '#8C3A5B', onPrimary: '#FFF4F7', page: '#0F1424', card: '#171E33', blush: '#26304F',
    gold: '#D4B062', onGold: '#1A1426', ink: '#F3EAD8', muted: '#A9B0C6',
  },
};

export const SCRIPT_FONTS = ['Great Vibes', 'Parisienne', 'Cormorant Garamond'];
export const HEADING_FONTS = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond'];
export const BODY_FONTS = ['EB Garamond', 'Cormorant Garamond', 'Jost'];

export const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600' +
  '&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Jost:wght@400;500;600' +
  '&family=Parisienne&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};

const stack = (font: string, kind: 'script' | 'serif' | 'sans') => {
  const fallback = kind === 'sans' ? 'system-ui, sans-serif' : kind === 'script' ? 'cursive' : 'Georgia, serif';
  return `'${font}', ${fallback}`;
};

export function applyTheme(t: ThemeChoice) {
  if (typeof document === 'undefined') return;
  const p = PALETTES[t.palette] ?? PALETTES.royal;
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--primary', hexToRgb(p.primary));
  set('--on-primary', hexToRgb(p.onPrimary));
  set('--page', hexToRgb(p.page));
  set('--card', hexToRgb(p.card));
  set('--blush', hexToRgb(p.blush));
  set('--gold', hexToRgb(p.gold));
  set('--on-gold', hexToRgb(p.onGold));
  set('--ink', hexToRgb(p.ink));
  set('--muted', hexToRgb(p.muted));
  set('--font-script', t.script === 'Cormorant Garamond' ? stack(t.script, 'serif') : stack(t.script, 'script'));
  set('--script-style', t.script === 'Cormorant Garamond' ? 'italic' : 'normal');
  set('--font-heading', stack(t.heading, 'serif'));
  set('--font-body', stack(t.body, t.body === 'Jost' ? 'sans' : 'serif'));
  root.style.colorScheme = p.dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.primary);
}
