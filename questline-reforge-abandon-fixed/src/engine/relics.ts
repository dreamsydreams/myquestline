import type { Campaign } from '../types/campaign';

/**
 * Source: Book II, Chapter 6 — "Loot, Relics & Rewards"
 *
 * Rules followed directly:
 * - Never create relics for trivial/automatic actions (Ch.6's explicit
 *   example: no "opened the app 5 days in a row" badges).
 * - Every relic ties to something that actually happened — a real Boss
 *   Battle defeated, a real Chapter finished, a real Campaign completed.
 * - Ch.6's Future Questions ask about a "legendary" tier for full Campaign
 *   completions — implemented here as `tier: 'legendary'`, visually
 *   distinct in the Backpack's Relics tab.
 */

export type RelicTier = 'standard' | 'legendary';

export interface Relic {
  id: string;
  name: string;
  description: string;
  tier: RelicTier;
}

export function computeRelics(currentCampaign: Campaign | null, campaignHistory: Campaign[]): Relic[] {
  const relics: Relic[] = [];
  const allCampaigns = currentCampaign ? [currentCampaign, ...campaignHistory] : campaignHistory;

  for (const campaign of allCampaigns) {
    for (const chapter of campaign.chapters) {
      if (chapter.bossBattle?.isDefeated) {
        relics.push({
          id: `boss-${chapter.bossBattle.id}`,
          name: chapter.bossBattle.name,
          description: `Defeated during Chapter ${chapter.chapterNumber}: ${chapter.name}, in "${campaign.title}."`,
          tier: 'standard',
        });
      }
      const chapterDone =
        chapter.quests.length > 0 &&
        chapter.quests.every((q) => q.missions.length > 0 && q.missions.every((m) => m.isComplete)) &&
        (!chapter.bossBattle || chapter.bossBattle.isDefeated);
      if (chapterDone) {
        relics.push({
          id: `chapter-${chapter.id}`,
          name: `${chapter.name} — Chapter Complete`,
          description: chapter.essence,
          tier: 'standard',
        });
      }
    }
    if (campaign.completedAt) {
      relics.push({
        id: `campaign-${campaign.id}`,
        name: `${campaign.title} — Campaign Complete`,
        description: `The full journey toward "${campaign.objective}," finished.`,
        tier: 'legendary',
      });
    }
  }

  return relics;
}
