/**
 * Player identity / avatar. Added in response to direct feedback that
 * JourneyReveal's "This is you" beat was a placeholder compass emoji, not
 * an actual character — the player asked for something closer to a
 * customizable stick figure, matching how the rest of the app already
 * avoids needing real art assets (Book VI's palette/icon system is all
 * CSS + SVG, no illustration budget exists).
 *
 * This is deliberately simple: shape + color choices, not an illustrated
 * character. It reuses the same "honest MVP" calibration as everything
 * else in this project — a real, working customization system built at
 * the scale actually achievable with zero art budget, not a fake version
 * dressed up to look more produced than it is.
 */

export type HairStyle = 'short' | 'long' | 'ponytail' | 'bald';
export type Accessory = 'none' | 'glasses' | 'scarf' | 'hat';

export interface AvatarConfig {
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  outfitColor: string;
  accessory: Accessory;
}

/** Defaults deliberately reuse the app's own existing palette tokens
 * (resolved to concrete hex here since SVG fill attributes can't reference
 * CSS custom properties the same way Tailwind classes can) — a new
 * player's default look is already visually "on brand," not an arbitrary
 * placeholder color. */
export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: '#d9a86c',
  hairStyle: 'short',
  hairColor: '#3a2f28',
  outfitColor: '#e8a355', // camp-ember
  accessory: 'none',
};

export const SKIN_TONE_OPTIONS = ['#f2cfa0', '#d9a86c', '#b97e52', '#8a5a35', '#5c3b23'];
export const HAIR_COLOR_OPTIONS = ['#0f0d0a', '#3a2f28', '#6b4a2f', '#a85c32', '#c9c2b5'];
export const OUTFIT_COLOR_OPTIONS = [
  '#e8a355', // camp-ember
  '#5b9bd5', // attr-discipline
  '#e0704f', // attr-confidence
  '#a67fd1', // attr-network
  '#6bab7f', // attr-resilience
];
