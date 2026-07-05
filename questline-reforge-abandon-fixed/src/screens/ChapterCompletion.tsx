import { Target, Hammer, Flame, Users, Shield } from 'lucide-react';
import type { AttributeKey, Campaign } from '../types/campaign';
import {
  ATTRIBUTE_LABELS,
  computeChapterAttributeTotals,
} from '../engine/attributeTracking';

/**
 * The "big" celebration Phase 1's roadmap deliberately reserved for later,
 * distinct from the small routine mission-pop (Book VI Ch.4). This is a
 * full-screen moment, not a toast or a modal that can be missed.
 *
 * Book III Ch.5's banned-phrase table rules this file directly: no bare
 * "Congratulations!", no generic praise. Every line here is built from real
 * data about what actually happened in this chapter — the chapter's own
 * essence, the specific Boss Battle (if any), and real attribute totals —
 * never a templated cheer that would say the same thing regardless of what
 * the player did.
 */
interface ChapterCompletionProps {
  campaign: Campaign;
  chapterIndex: number;
  isCampaignComplete: boolean;
  onContinue: () => void;
}

const ATTRIBUTE_ICONS: Record<AttributeKey, typeof Target> = {
  discipline: Target,
  craft: Hammer,
  confidence: Flame,
  network: Users,
  resilience: Shield,
};

const ATTRIBUTE_COLOR_VARS: Record<AttributeKey, string> = {
  discipline: 'var(--color-attr-discipline)',
  craft: 'var(--color-attr-craft)',
  confidence: 'var(--color-attr-confidence)',
  network: 'var(--color-attr-network)',
  resilience: 'var(--color-attr-resilience)',
};

export function ChapterCompletion({
  campaign,
  chapterIndex,
  isCampaignComplete,
  onContinue,
}: ChapterCompletionProps) {
  const chapter = campaign.chapters[chapterIndex];
  const nextChapter = campaign.chapters[chapterIndex + 1];
  const totals = computeChapterAttributeTotals(campaign, chapter.id).filter((t) => t.xp > 0);

  const totalMissions = chapter.quests.reduce((sum, q) => sum + q.missions.length, 0);
  const completedMissions = chapter.quests.reduce(
    (sum, q) => sum + q.missions.filter((m) => m.isComplete).length,
    0
  );

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="animate-ceremony-glow flex flex-col items-center gap-3 rounded-2xl px-8 py-10">
        <p className="animate-ceremony-rise font-display text-sm uppercase tracking-[0.3em] text-camp-ember">
          Chapter {chapter.chapterNumber} Complete
        </p>
        <h1
          className="animate-ceremony-rise font-display text-4xl leading-tight text-camp-parchment"
          style={{ animationDelay: '0.1s' }}
        >
          {chapter.name}
        </h1>
        <p
          className="animate-ceremony-rise max-w-sm text-camp-parchment-dim"
          style={{ animationDelay: '0.2s' }}
        >
          {chapter.essence}
        </p>
      </div>

      {chapter.bossBattle?.isDefeated && (
        <p className="animate-ceremony-rise max-w-md text-camp-parchment" style={{ animationDelay: '0.3s' }}>
          You faced <span className="font-semibold text-camp-ember">{chapter.bossBattle.name}</span> and
          it didn't hold. That's a real shift, not a checkbox.
        </p>
      )}

      <div
        className="animate-ceremony-rise flex w-full flex-col gap-3 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-5"
        style={{ animationDelay: '0.35s' }}
      >
        <p className="text-sm text-camp-parchment-dim">
          {completedMissions} of {totalMissions} Missions carried this chapter.
        </p>
        {totals.length > 0 && (
          <div className="flex flex-col gap-2">
            {totals.map((t) => {
              const Icon = ATTRIBUTE_ICONS[t.attribute];
              const color = ATTRIBUTE_COLOR_VARS[t.attribute];
              return (
                <div key={t.attribute} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color }}>
                    <Icon size={14} />
                    {ATTRIBUTE_LABELS[t.attribute]}
                  </span>
                  <span className="text-camp-parchment-dim">+{t.xp} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isCampaignComplete && (
        <p
          className="animate-ceremony-rise max-w-md font-display text-lg text-camp-parchment"
          style={{ animationDelay: '0.45s' }}
        >
          That was the last Chapter. {campaign.title} — done.
        </p>
      )}

      <button
        onClick={onContinue}
        className="animate-ceremony-rise mt-2 rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
        style={{ animationDelay: '0.55s' }}
      >
        {isCampaignComplete
          ? 'Return to Camp'
          : nextChapter
            ? `Begin Chapter ${nextChapter.chapterNumber}: ${nextChapter.name}`
            : 'Return to Camp'}
      </button>
    </div>
  );
}
