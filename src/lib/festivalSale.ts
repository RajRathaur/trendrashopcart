// Festival sale (Diwali / Dussehra etc.) — settings live in site_content so admin can edit them.

export const SALE_KEYS = {
  enabled: 'festival_sale_enabled',
  theme: 'festival_sale_theme',
  title: 'festival_sale_title',
  subtitle: 'festival_sale_subtitle',
  coupon: 'festival_sale_coupon',
  startAt: 'festival_sale_start_at',
  endAt: 'festival_sale_end_at',
} as const;

export type SaleTheme = 'diwali' | 'dussehra' | 'custom';

export const SALE_PRESETS: Record<SaleTheme, { label: string; emoji: string; title: string; subtitle: string }> = {
  diwali: {
    label: 'Diwali Offer',
    emoji: '🪔',
    title: 'Diwali Mega Sale',
    subtitle: 'Roshni ka tyohar, bachat ki bahaar — aaj hi khareedein',
  },
  dussehra: {
    label: 'Dussehra Offer',
    emoji: '🏹',
    title: 'Dussehra Dhamaka Offer',
    subtitle: 'Buraai par jeet, daamon par bhi jeet — sirf 24 ghante',
  },
  custom: {
    label: 'Apna Offer',
    emoji: '🎉',
    title: 'Festive Sale',
    subtitle: 'Limited time offer — jaldi kijiye',
  },
};

export const DEFAULT_SALE_HOURS = 24;

export interface FestivalSale {
  enabled: boolean;
  theme: SaleTheme;
  title: string;
  subtitle: string;
  coupon: string;
  startAt: Date | null;
  endAt: Date | null;
}

const toDate = (v?: string) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const parseSale = (content: Record<string, string>): FestivalSale => {
  const theme = (content[SALE_KEYS.theme] as SaleTheme) || 'diwali';
  const preset = SALE_PRESETS[theme] || SALE_PRESETS.diwali;
  return {
    enabled: content[SALE_KEYS.enabled] === 'true',
    theme: SALE_PRESETS[theme] ? theme : 'diwali',
    title: content[SALE_KEYS.title] || preset.title,
    subtitle: content[SALE_KEYS.subtitle] ?? preset.subtitle,
    coupon: (content[SALE_KEYS.coupon] || '').trim().toUpperCase(),
    startAt: toDate(content[SALE_KEYS.startAt]),
    endAt: toDate(content[SALE_KEYS.endAt]),
  };
};

export type SaleStatus = 'off' | 'scheduled' | 'live' | 'ended';

export const getSaleStatus = (sale: Pick<FestivalSale, 'enabled' | 'startAt' | 'endAt'>, now: Date = new Date()): SaleStatus => {
  if (!sale.enabled || !sale.endAt) return 'off';
  if (now.getTime() >= sale.endAt.getTime()) return 'ended';
  if (sale.startAt && now.getTime() < sale.startAt.getTime()) return 'scheduled';
  return 'live';
};

export const isSaleLive = (sale: Pick<FestivalSale, 'enabled' | 'startAt' | 'endAt'>, now: Date = new Date()) =>
  getSaleStatus(sale, now) === 'live';

/** Default window: starts now, ends after `hours` (24 by default). */
export const defaultSaleWindow = (now: Date = new Date(), hours = DEFAULT_SALE_HOURS) => ({
  startAt: new Date(now.getTime()),
  endAt: new Date(now.getTime() + hours * 60 * 60 * 1000),
});

export const getTimeLeft = (endAt: Date, now: Date = new Date()) => {
  const ms = Math.max(0, endAt.getTime() - now.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

/** Date -> value for <input type="datetime-local"> in the viewer's local time. */
export const toLocalInput = (d: Date | null) => {
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
