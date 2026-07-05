import { useState } from 'react';
import type { Campaign } from '../types/campaign';
import { computeRelics } from '../engine/relics';
import { computeAttributeTotals } from '../engine/attributeTracking';

interface AbandonQuestProps {
  campaign: Campaign;
  onConfirmAbandon: () => void;
  onCancel: () => void;
  onSwitchToReForge: () => void;
}

type Stage = 'reflect' | 'confirm';

/**
 * Source: Book I, Ch.9 (the in-world term is "Abandon Quest") + Book III,
 * Ch.5's explicit ban on "Are you sure you want to quit?" as a guilt-trap
 * dark pattern + Book IX, Ch.2's framing: campaigns get "completed and
 * abandoned honestly and without shame."
 *
 * This is deliberately NOT a single scary confirm dialog. It's two real
 * screens: first, an honest look at what's actually been built (so the
 * choice is informed, not blind), with a genuine option to just sit with
 * it longer or Re-Forge instead — then, if the player is still sure, a
 * second screen stating plainly what happens next. Nothing here uses
 * urgency styling, red-alert coloring, or a countdown — a Campaign ending
 * this way is a legitimate outcome, not a failure state.
 */
export function AbandonQuest({ campaign, onConfirmAbandon, onCancel, onSwitchToReForge }: AbandonQuestProps) {
  const [stage, setStage] = useState<Stage>('reflect');

  const relics = computeRelics(campaign, []);
  const totalXp = computeAttributeTotals(campaign).reduce((sum, t) => sum + t.xp, 0);
  const chaptersCompleted = campaign.chapters.filter((c) => c.isComplete).length;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <button
        onClick={onCancel}
        className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
      >
        ← Camp
      </button>

      {stage === 'reflect' && (
        <>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">Before you let this go</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-camp-parchment">
              {campaign.title}
            </h1>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4 text-sm text-camp-parchment">
            {chaptersCompleted === 0 && totalXp === 0 && relics.length === 0 ? (
              <p>
                Nothing's been logged here yet — no Chapters finished, no XP, no Relics. That's not a strike against
                you; it just means whatever made this feel wrong to start, you noticed it early.
              </p>
            ) : (
              <p>
                {chaptersCompleted} of {campaign.chapters.length} Chapter{campaign.chapters.length === 1 ? '' : 's'}{' '}
                finished, {totalXp} XP earned across your Attributes, and {relics.length} Relic
                {relics.length === 1 ? '' : 's'} collected here. All of it is genuinely yours regardless of what you
                decide next.
              </p>
            )}
          </div>

          <p className="text-base leading-relaxed text-camp-parchment-dim">
            {chaptersCompleted === 0 && totalXp === 0 && relics.length === 0
              ? "This Campaign was never a promise you signed in blood — it's yours to set down whenever it stops being the right one, five minutes in or five months in. That's not the same thing as failing it."
              : "This Campaign was never a promise you signed in blood — it's yours to set down too, whenever it stops being the right one. That's not the same thing as failing it."}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onCancel}
              className="rounded-full border border-camp-parchment-dim/40 px-6 py-2.5 text-sm text-camp-parchment transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              I want to sit with this a bit longer
            </button>
            <button
              onClick={onSwitchToReForge}
              className="rounded-full border border-camp-parchment-dim/40 px-6 py-2.5 text-sm text-camp-parchment transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Actually — let's Re-Forge it instead
            </button>
            <button
              onClick={() => setStage('confirm')}
              className="rounded-full border border-camp-night-soft px-6 py-2.5 text-sm text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              I'm sure — let this one go
            </button>
          </div>
        </>
      )}

      {stage === 'confirm' && (
        <>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">One real, honest step</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-camp-parchment">
              Here's exactly what happens.
            </h1>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4 text-sm text-camp-parchment">
            <p>Nothing is deleted. Your XP, Attributes, and Relics stay exactly as they are, forever.</p>
            <p>
              <span className="text-camp-parchment">{campaign.title}</span> moves into your history, honestly marked
              as set down — not hidden, and never quietly relabeled as finished.
            </p>
            <p>You're free to begin something new right away, whenever you're ready.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onConfirmAbandon}
              className="rounded-full bg-camp-ember px-6 py-2.5 font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95"
            >
              Yes, retire this Quest
            </button>
            <button
              onClick={() => setStage('reflect')}
              className="rounded-full border border-camp-night-soft px-6 py-2.5 text-sm text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Wait, go back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
