import type { SVGProps } from 'react';
import type { PrayerKey } from '@/lib/types';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const MapPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15" rx="4" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
    <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);

export const SpeakerIcon = ({ muted, ...p }: IconProps & { muted?: boolean }) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
    {muted ? (
      <path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" />
    ) : (
      <>
        <path d="M15.5 9a4 4 0 0 1 0 6" />
        <path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />
      </>
    )}
  </svg>
);

export const InfoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.6" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
    <path d="M16 7.2a3 3 0 0 1 0 5.6M17.5 14.6c2 .5 3.2 2.1 3.2 4.4" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.6" r="3.6" />
    <path d="M5 19.4c0-3.4 3.1-5.4 7-5.4s7 2 7 5.4" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.2C6.5 4 9.5 4 12 5.6 14.5 4 17.5 4 20 5.2v13c-2.5-1.2-5.5-1.2-8 .4-2.5-1.6-5.5-1.6-8-.4Z" />
    <path d="M12 5.6v13" />
  </svg>
);

/* --- weather glyphs ------------------------------------------------ */

const SunGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" />
  </svg>
);

const CloudGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 18h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 11 3.5 3.5 0 0 0 7 18Z" />
  </svg>
);

const CloudSunGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="7.6" r="3" />
    <path d="M8 2.4v1.4M3.4 7.6H2M12.6 7.6h1.2M4.6 4.2 3.7 3.3M11.4 4.2l.9-.9" />
    <path d="M10 19h7.6a3.3 3.3 0 0 0 .3-6.6A5 5 0 0 0 9 12.6 3.2 3.2 0 0 0 10 19Z" />
  </svg>
);

const RainGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 15h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 8 3.5 3.5 0 0 0 7 15Z" />
    <path d="M8.5 18l-1 2.6M13 18l-1 2.6M17.5 18l-1 2.6" />
  </svg>
);

const SnowGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 14h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 7 3.5 3.5 0 0 0 7 14Z" />
    <path d="M9 17.5v3M7.6 18.4l2.8 1.6M10.4 18.4l-2.8 1.6M15 17.5v3M13.6 18.4l2.8 1.6M16.4 18.4l-2.8 1.6" />
  </svg>
);

const FogGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 12h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 5 3.5 3.5 0 0 0 7 12Z" />
    <path d="M4 15.5h16M6 19h12" />
  </svg>
);

const ThunderGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 14h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 7 3.5 3.5 0 0 0 7 14Z" />
    <path d="M13 15.5 10 19.5h3l-1 3.5" />
  </svg>
);

const DrizzleGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 15h9.5a3.7 3.7 0 0 0 .4-7.4A5.6 5.6 0 0 0 6.4 8 3.5 3.5 0 0 0 7 15Z" />
    <path d="M9.5 18.4v1.4M13 18.4v1.4M16.5 18.4v1.4" />
  </svg>
);

const MoonGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.8 8.8 0 1 0 20 14.4Z" />
  </svg>
);

const CloudMoonGlyph = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13.6 8.6A5.6 5.6 0 0 1 6.8 1.8 5.7 5.7 0 1 0 13.6 8.6Z" />
    <path d="M10 19.4h7.6a3.3 3.3 0 0 0 .3-6.6A5 5 0 0 0 9 13 3.2 3.2 0 0 0 10 19.4Z" />
  </svg>
);

export const WEATHER_GLYPHS: Record<string, (p: IconProps) => React.JSX.Element> = {
  moon: MoonGlyph,
  'cloud-moon': CloudMoonGlyph,
  sun: SunGlyph,
  cloud: CloudGlyph,
  'cloud-sun': CloudSunGlyph,
  rain: RainGlyph,
  drizzle: DrizzleGlyph,
  sleet: RainGlyph,
  snow: SnowGlyph,
  fog: FogGlyph,
  thunder: ThunderGlyph,
};

export function WeatherGlyph({ name, ...props }: IconProps & { name: string }) {
  const Glyph = WEATHER_GLYPHS[name] ?? SunGlyph;
  return <Glyph {...props} />;
}

/* --- prayer glyphs -------------------------------------------------- */

/** Filled, coloured marks - these sit inside the raised clay badges. */
export function PrayerGlyph({ prayer, ...props }: IconProps & { prayer: PrayerKey }) {
  const common = { viewBox: '0 0 32 32', ...props };
  switch (prayer) {
    case 'fajr':
      return (
        <svg {...common}>
          <path
            d="M21.5 6a10.5 10.5 0 1 0 6 12.6A8.4 8.4 0 0 1 21.5 6Z"
            fill="#4E7A52"
          />
          <path d="m10.5 8 1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1Z" fill="#7CB07F" />
        </svg>
      );
    case 'sunrise':
      return (
        <svg {...common}>
          <circle cx="16" cy="17" r="6" fill="#F2C24E" />
          <path d="M16 4v3.5M26 9.5l-2.4 2.4M6 9.5l2.4 2.4" stroke="#E7A93C" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="4" y="21.5" width="24" height="3.4" rx="1.7" fill="#8CA778" />
        </svg>
      );
    case 'dhuhr':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="7" fill="#F5C445" />
          <g stroke="#EDB13B" strokeWidth="2.6" strokeLinecap="round">
            <path d="M16 3v3.4M16 25.6V29M29 16h-3.4M6.4 16H3M25.2 6.8l-2.4 2.4M9.2 22.8l-2.4 2.4M25.2 25.2l-2.4-2.4M9.2 9.2 6.8 6.8" />
          </g>
        </svg>
      );
    case 'asr':
      return (
        <svg {...common}>
          <circle cx="16" cy="18" r="6.4" fill="#EFB855" />
          <g stroke="#DFA13F" strokeWidth="2.4" strokeLinecap="round">
            <path d="M16 6.4v2.6M26.4 12.6l-2.2 1.6M5.6 12.6l2.2 1.6" />
          </g>
          <rect x="4" y="23" width="24" height="3.2" rx="1.6" fill="#A8B98F" />
        </svg>
      );
    case 'maghrib':
      return (
        <svg {...common}>
          <path d="M9 20a7 7 0 0 1 14 0Z" fill="#E8804B" />
          <path d="M6 20h20" stroke="#E8804B" strokeWidth="2.6" strokeLinecap="round" />
          <g stroke="#F3A45F" strokeWidth="2.4" strokeLinecap="round">
            <path d="M16 6.6v2.6M25.4 11.4l-1.9 1.9M6.6 11.4l1.9 1.9" />
          </g>
          <rect x="4" y="23.6" width="24" height="3.2" rx="1.6" fill="#C2A98C" />
        </svg>
      );
    case 'isha':
    default:
      return (
        <svg {...common}>
          <path d="M22 5a11 11 0 1 0 5.6 13.2A8.8 8.8 0 0 1 22 5Z" fill="#2F4A36" />
          <path d="m10 7.5 1.1 2.8 2.8 1.1-2.8 1.1L10 15.3l-1.1-2.8L6.1 11.4l2.8-1.1Z" fill="#E8C468" />
        </svg>
      );
  }
}
