import { TERMS } from '../constants/language';

export type Screen = 'camp' | 'character' | 'backpack' | 'map';

interface NavigationProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS: Array<{ screen: Screen; label: string }> = [
  { screen: 'camp', label: TERMS.dashboard },
  { screen: 'character', label: TERMS.profile },
  { screen: 'backpack', label: TERMS.settings },
  { screen: 'map', label: TERMS.search },
];

export function Navigation({ current, onNavigate }: NavigationProps) {
  return (
    <nav className="flex justify-center gap-1 border-t border-camp-night-soft bg-camp-night/95 px-4 py-2 backdrop-blur">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
            current === item.screen
              ? 'bg-camp-ember/20 text-camp-ember-bright'
              : 'text-camp-parchment-dim hover:text-camp-parchment'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
