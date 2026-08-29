'use client';

import { CalendarIcon, ClockIcon, HomeIcon, UserIcon, UsersIcon } from './icons';

const ITEMS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'prayer', label: 'Prayer', Icon: ClockIcon },
  { id: 'program', label: 'Program', Icon: CalendarIcon },
  { id: 'community', label: 'Community', Icon: UsersIcon },
  { id: 'account', label: 'My Account', Icon: UserIcon },
] as const;

export type NavId = (typeof ITEMS)[number]['id'];

interface Props {
  active: NavId;
  onSelect: (id: NavId) => void;
}

export default function BottomNav({ active, onSelect }: Props) {
  return (
    <nav className="clay nav" aria-label="Sections">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="nav__item"
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon width={26} height={26} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
