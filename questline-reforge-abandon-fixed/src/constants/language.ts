/**
 * THE LANGUAGE OF THE WORLD
 * Source: Book I, Chapter 9 — "The Language of the World"
 *
 * This file is the single source of truth for every in-world term Questline
 * uses. Per Book I Ch.9: "This glossary should be treated as close to a legal
 * contract for every writer and designer on the team." Nothing outside this
 * file should hardcode a player-facing term that appears below — import it
 * from here instead, so terminology can never drift screen to screen.
 *
 * Also encodes Book III, Chapter 5's banned-phrase table, since voice
 * discipline and naming discipline are the same discipline: both exist to
 * stop "software language" from puncturing the world.
 */

// ---------------------------------------------------------------------------
// CORE TERMINOLOGY MAP (Book I, Ch.9)
// ---------------------------------------------------------------------------
export const TERMS = {
  dashboard: 'Camp',
  settings: 'Backpack',
  profile: 'Character',
  notifications: 'Messenger Owl',
  notificationsAlt: 'Guild Mail',
  tasks: 'Quests',
  goals: 'Campaigns',
  progress: 'Journey',
  achievements: 'Relics',
  skills: 'Attributes',
  calendar: 'Quest Log',
  search: 'Map',
  statistics: 'Character Sheet',
  saveChanges: 'Forge Changes',
  deleteGoal: 'Abandon Quest',
  createGoal: 'Begin New Adventure',
  /** Book IX, Ch.2 — the personal-history feature the Empty Camp State
   * (Ch.3) links out to. Term is defined here now, ahead of the feature
   * itself, since Ch.3 is Phase 5 but Ch.2's real Archive is deliberately
   * not — see PHASE_ROADMAP.md. */
  archive: 'Archive',
} as const;

// ---------------------------------------------------------------------------
// CAMPAIGN HIERARCHY LABELS (Book II, Ch.1)
// Kept here (not just in types/campaign.ts) because these are also
// player-facing display strings, not just internal structural names.
// ---------------------------------------------------------------------------
export const HIERARCHY_LABELS = {
  objective: 'Objective',
  campaign: 'Campaign',
  chapter: 'Chapter',
  quest: 'Quest',
  mission: 'Mission',
  bossBattle: 'Boss Battle',
  enemy: 'Enemy',
} as const;

// ---------------------------------------------------------------------------
// LOADING SCREEN LANGUAGE (Book I, Ch.9)
// Never a bare spinner with no words — the wait itself should feel purposeful
// (this is explicitly called out again in Book VI, Ch.6 for onboarding).
// ---------------------------------------------------------------------------
export const LOADING_PHRASES = [
  'Mapping Your Journey…',
  "Consulting History's Greatest Adventurers…",
  'Discovering Hidden Paths…',
] as const;

// ---------------------------------------------------------------------------
// ERROR LANGUAGE (Book I, Ch.9 + Book III, Ch.5)
// Never "Something went wrong." Ever.
// ---------------------------------------------------------------------------
export const ERROR_MESSAGE =
  'Our cartographers lost the trail. Give us a moment to find your next path.';

// ---------------------------------------------------------------------------
// BANNED PHRASES → REPLACEMENTS (Book III, Ch.5)
// This table exists as a practical, checkable enforcement tool per the
// chapter's own Designer Notes. It is not just documentation — components
// should never contain the left-hand strings anywhere in player-facing copy.
// ---------------------------------------------------------------------------
export const BANNED_PHRASE_TABLE: Array<{
  banned: string;
  reason: string;
  replacement: string;
}> = [
  {
    banned: 'Error / Something went wrong',
    reason: 'Breaks immersion (Book I, Ch.9)',
    replacement: ERROR_MESSAGE,
  },
  {
    banned: 'You failed',
    reason: 'Judgmental, violates Principle 9 (Every setback is data)',
    replacement: "That attempt didn't land — here's what it taught us.",
  },
  {
    banned: 'You should have...',
    reason: 'Guilt-based, violates the Questline Promise',
    replacement: 'Neutral trade-off framing (Book I, Ch.8)',
  },
  {
    banned: "Don't give up!",
    reason: 'Generic, empty encouragement',
    replacement: 'Specific, evidence-based encouragement',
  },
  {
    banned: 'Congratulations! (alone, unearned)',
    reason: 'Cheapens real celebration (Book I, Ch.10)',
    replacement: 'Specific, earned acknowledgment',
  },
  {
    banned: 'Are you sure you want to quit?',
    reason: 'Guilt-trap dark pattern',
    replacement: 'Honest, respectful framing of the choice (Principle 4)',
  },
  {
    banned: 'Based on our algorithm...',
    reason: 'Breaks evidence-not-tech framing (Book I, Ch.7)',
    replacement: 'Based on patterns we\'ve studied...',
  },
  {
    banned: "You haven't opened Questline in N days! Don't lose your progress!",
    reason: 'Manufactured urgency / FOMO (Book V, Ch.4 & Ch.6)',
    replacement:
      'Warm, low-pressure re-entry copy referencing the actual chapter waiting, not the absence.',
  },
];

// ---------------------------------------------------------------------------
// RE-ENTRY / RETURN LANGUAGE (Book V, Ch.6) — reference examples
// Not exhaustive copy, just the tone anchor every re-entry string must match.
// ---------------------------------------------------------------------------
export const RETURN_TONE_EXAMPLE =
  'Welcome back. A lot of life probably happened — that\'s alright. Here\'s exactly where your journey stood, and here\'s what\'s changed since.';
