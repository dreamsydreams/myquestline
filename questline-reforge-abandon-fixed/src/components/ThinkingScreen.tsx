import { LOADING_PHRASES } from '../constants/language';

export function ThinkingScreen() {
  const phrase = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
  return (
    <div className="flex min-h-full items-center justify-center px-6">
      <p className="font-display text-lg text-camp-parchment-dim">{phrase}</p>
    </div>
  );
}
