import type { AvatarConfig } from '../types/avatar';

interface AvatarSVGProps {
  config: AvatarConfig;
  size?: number;
}

/**
 * A deliberately simple stick figure, not an illustrated character —
 * matches the scope of what's actually buildable with zero art budget
 * (same honest-MVP calibration used throughout this project). Geometric
 * shapes only: circle head, line body/limbs, small overlays for hair and
 * accessory. Every visual choice comes from AvatarConfig — nothing here
 * is hardcoded to look a specific way regardless of customization.
 */
export function AvatarSVG({ config, size = 96 }: AvatarSVGProps) {
  const { skinTone, hairStyle, hairColor, outfitColor, accessory } = config;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Your character">
      {/* Body + limbs */}
      <line x1="50" y1="45" x2="50" y2="75" stroke={outfitColor} strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="52" x2="35" y2="65" stroke={outfitColor} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="52" x2="65" y2="65" stroke={outfitColor} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="75" x2="38" y2="92" stroke="#5b5348" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="75" x2="62" y2="92" stroke="#5b5348" strokeWidth="5" strokeLinecap="round" />

      {/* Head */}
      <circle cx="50" cy="28" r="16" fill={skinTone} />

      {/* Hair, by style */}
      {hairStyle === 'short' && (
        <path d="M 34 24 A 16 16 0 0 1 66 24 L 66 18 L 34 18 Z" fill={hairColor} />
      )}
      {hairStyle === 'long' && (
        <path
          d="M 34 22 A 16 16 0 0 1 66 22 L 68 46 L 60 46 L 58 30 L 42 30 L 40 46 L 32 46 Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'ponytail' && (
        <>
          <path d="M 34 22 A 16 16 0 0 1 66 22 L 66 16 L 34 16 Z" fill={hairColor} />
          <path d="M 65 20 Q 78 24 72 40" stroke={hairColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* bald: no hair path rendered */}

      {/* Accessory overlays */}
      {accessory === 'glasses' && (
        <g stroke="#1a1a1a" strokeWidth="1.5" fill="none">
          <circle cx="44" cy="28" r="5" />
          <circle cx="56" cy="28" r="5" />
          <line x1="49" y1="28" x2="51" y2="28" />
        </g>
      )}
      {accessory === 'scarf' && <path d="M 40 40 Q 50 46 60 40 L 60 46 Q 50 52 40 46 Z" fill="#c25c4e" />}
      {accessory === 'hat' && (
        <g fill="#2f2a24">
          <rect x="35" y="10" width="30" height="5" rx="2" />
          <rect x="41" y="2" width="18" height="10" rx="2" />
        </g>
      )}
    </svg>
  );
}
