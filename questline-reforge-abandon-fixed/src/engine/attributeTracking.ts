import type { AttributeKey, Campaign } from '../types/campaign';

/**
 * Source: Book II, Chapter 5 (XP, Attributes & Leveling) + Book VI, Chapter 3
 * (Character Sheet design).
 *
 * This computes totals from whatever is currently in the Campaign object
 * passed in. As of Phase 5, that Campaign is loaded from real localStorage
 * persistence (src/lib/persistence.ts) rather than held only in memory, so
 * growth now survives a page refresh — the Phase 4 "resets on refresh"
 * limitation is fixed. What's still honestly true: this is single-device
 * storage with no backend account system, and it only totals the *current*
 * campaign's data, not a lifetime archive across multiple completed
 * campaigns — that's Book IX Ch.2's future Archive, deliberately deferred.
 */

export const ATTRIBUTE_ORDER: AttributeKey[] = [
  'discipline',
  'craft',
  'confidence',
  'network',
  'resilience',
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  discipline: 'Discipline',
  craft: 'Craft',
  confidence: 'Confidence',
  network: 'Network',
  resilience: 'Resilience',
};

export interface GrowthEvent {
  attribute: AttributeKey;
  xp: number;
  source: string;
  chapterName: string;
  chapterNumber: number;
  fromBossBattle: boolean;
}

export interface AttributeTotal {
  attribute: AttributeKey;
  xp: number;
  events: GrowthEvent[];
}

/** Boss Battles always feed Confidence (Book II Ch.5: "Confidence — growth
 * through facing Boss Battles and Enemies"). This is a flat, honestly
 * calibrated amount, not an inflated number designed to feel exciting
 * (Book II Ch.5's explicit warning against XP grind-creep). */
const BOSS_BATTLE_XP = 40;

export function computeGrowthEvents(campaign: Campaign): GrowthEvent[] {
  const events: GrowthEvent[] = [];

  for (const chapter of campaign.chapters) {
    for (const quest of chapter.quests) {
      for (const mission of quest.missions) {
        if (mission.isComplete && mission.attribute) {
          events.push({
            attribute: mission.attribute,
            xp: mission.xp ?? 0,
            source: mission.title,
            chapterName: chapter.name,
            chapterNumber: chapter.chapterNumber,
            fromBossBattle: false,
          });
        }
      }
    }
    if (chapter.bossBattle?.isDefeated) {
      events.push({
        attribute: 'confidence',
        xp: BOSS_BATTLE_XP,
        source: `Boss Battle: ${chapter.bossBattle.name}`,
        chapterName: chapter.name,
        chapterNumber: chapter.chapterNumber,
        fromBossBattle: true,
      });
    }
  }

  return events;
}

export function computeAttributeTotals(campaign: Campaign): AttributeTotal[] {
  const events = computeGrowthEvents(campaign);
  return ATTRIBUTE_ORDER.map((attribute) => {
    const attrEvents = events.filter((e) => e.attribute === attribute);
    return {
      attribute,
      xp: attrEvents.reduce((sum, e) => sum + e.xp, 0),
      events: attrEvents,
    };
  });
}

/**
 * Book VI Ch.3: "The sheet should occasionally surface a specific, real
 * callback... tying the abstract number back to a real, remembered moment."
 * Prefers a Boss-Battle-sourced callback (bigger, more memorable moment)
 * over a generic mission callback, but never invents a moment that didn't
 * actually happen in this campaign's data.
 */
export function computeTopCallback(totals: AttributeTotal[]): string | null {
  const withGrowth = totals.filter((t) => t.xp > 0);
  if (withGrowth.length === 0) return null;

  const top = withGrowth.reduce((a, b) => (b.xp > a.xp ? b : a));
  const bossEvent = top.events.find((e) => e.fromBossBattle);

  if (bossEvent) {
    return `Your ${ATTRIBUTE_LABELS[top.attribute]} grew most during Chapter ${bossEvent.chapterNumber}: ${bossEvent.chapterName} — right when you faced the ${bossEvent.source}.`;
  }

  const topEvent = top.events[0];
  return `Your ${ATTRIBUTE_LABELS[top.attribute]} has grown most through Chapter ${topEvent.chapterNumber}: ${topEvent.chapterName}.`;
}

/**
 * Scopes growth events to a single chapter — used by the Chapter Completion
 * ceremony (Phase 5, Book I Ch.10 / Book III Ch.7) so the ceremony can show
 * real, chapter-specific numbers instead of the whole campaign's running
 * total. Same honesty rule as everywhere else here: only real completed
 * missions/Boss Battles count, nothing inflated for the moment.
 */
export function computeChapterAttributeTotals(
  campaign: Campaign,
  chapterId: string
): AttributeTotal[] {
  const chapter = campaign.chapters.find((c) => c.id === chapterId);
  if (!chapter) return ATTRIBUTE_ORDER.map((attribute) => ({ attribute, xp: 0, events: [] }));

  const events = computeGrowthEvents({ ...campaign, chapters: [chapter] });
  return ATTRIBUTE_ORDER.map((attribute) => {
    const attrEvents = events.filter((e) => e.attribute === attribute);
    return {
      attribute,
      xp: attrEvents.reduce((sum, e) => sum + e.xp, 0),
      events: attrEvents,
    };
  });
}
