import { CheckCircle2, Sparkles } from 'lucide-react';
import type { Campaign } from '../types/campaign';

interface ReForgeRevealProps {
  campaign: Campaign;
  /** Index of the last Chapter left untouched by this Re-Forge — everything
   * at or before this index is "kept," everything after is "reshaped."
   * Passed through from App.tsx at the moment the Re-Forge was submitted,
   * since `currentChapterIndex` itself doesn't move during a Re-Forge. */
  keptThroughIndex: number;
  onContinue: () => void;
}

/**
 * NEW SCREEN. Gap flagged during review: when a Re-Forge actually changes
 * future Chapters, the player used to just land back in Camp and notice
 * (or not notice) that the trail looked different — no moment marking it,
 * in an app that otherwise treats moments like this as ceremony
 * (ChapterCompletion, JourneyReveal). This is that moment for Re-Forging.
 *
 * Reuses the same `animate-ceremony-*` vocabulary as ChapterCompletion.tsx
 * rather than inventing a new visual language for "something changed."
 */
export function ReForgeReveal({ campaign, keptThroughIndex, onContinue }: ReForgeRevealProps) {
  const reshapedChapters = campaign.chapters.filter((_, index) => index > keptThroughIndex);
  const hasReshapedChapters = reshapedChapters.length > 0;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="animate-ceremony-glow flex flex-col items-center gap-3 rounded-2xl px-8 py-10">
        <p className="animate-ceremony-rise font-display text-sm uppercase tracking-[0.3em] text-camp-ember">
          Re-Forge Complete
        </p>
        <h1
          className="animate-ceremony-rise font-display text-3xl leading-tight text-camp-parchment"
          style={{ animationDelay: '0.1s' }}
        >
          {hasReshapedChapters ? 'The road ahead just bent.' : 'The road ahead holds.'}
        </h1>
        <p
          className="animate-ceremony-rise max-w-sm text-camp-parchment-dim"
          style={{ animationDelay: '0.2s' }}
        >
          {hasReshapedChapters
            ? `Everything through Chapter ${keptThroughIndex + 1} stayed exactly as it was. Here's what changed ahead.`
            : "You're already in the final Chapter, so there was nothing structural left to reshape — your Objective is what's updated."}
        </p>
      </div>

      {hasReshapedChapters && (
        <div
          className="animate-ceremony-rise flex w-full flex-col items-center gap-2"
          style={{ animationDelay: '0.3s' }}
        >
          {campaign.chapters.map((chapter, index) => {
            const isReshaped = index > keptThroughIndex;
            return (
              <div key={chapter.id} className="flex w-full max-w-sm flex-col items-center">
                {index > 0 && <div className="h-6 w-px border-l-2 border-dotted border-camp-night-soft" />}
                <div
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    isReshaped
                      ? 'border-camp-ember/60 bg-camp-ember/10'
                      : 'border-camp-night-soft bg-camp-night-soft/40'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      isReshaped
                        ? 'border-camp-ember bg-camp-ember text-camp-night'
                        : 'border-camp-parchment-dim/40 text-camp-parchment-dim'
                    }`}
                  >
                    {isReshaped ? <Sparkles className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs uppercase tracking-wide text-camp-parchment-dim">
                      Chapter {chapter.chapterNumber} · {isReshaped ? 'Reshaped' : 'Untouched'}
                    </span>
                    <span className="block font-display text-base text-camp-parchment">{chapter.name}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p
        className="animate-ceremony-rise max-w-md text-sm text-camp-parchment-dim"
        style={{ animationDelay: '0.4s' }}
      >
        No XP, Attributes, or Relics moved because of this — only the road ahead did.
      </p>

      <button
        onClick={onContinue}
        className="animate-ceremony-rise mt-2 rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
        style={{ animationDelay: '0.5s' }}
      >
        Back to Camp
      </button>
    </div>
  );
}
