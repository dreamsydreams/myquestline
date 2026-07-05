import { useState } from 'react';
import type { Campaign } from '../types/campaign';
import type { IntakeAnswers } from '../types/intake';
import { detectCrisisSignal } from '../safety/crisisDetection';
import { detectHarmfulObjective } from '../safety/harmfulObjectiveDetection';
import type { HarmfulObjectiveCategory } from '../safety/harmfulObjectiveDetection';
import { logSafetyEvent } from '../safety/safetyLog';
import { CrisisResponse } from '../components/CrisisResponse';
import { ObjectiveDeclineResponse } from '../components/ObjectiveDeclineResponse';

interface ReForgeProps {
  campaign: Campaign;
  currentChapterIndex: number;
  /** Actually applies the Re-Forge — App.tsx owns the (async, engine-level)
   * work, same division of responsibility as Intake's onComplete. */
  onReForge: (answers: IntakeAnswers) => void;
  onCancel: () => void;
  /** A player reconsidering mid-form may realize they actually want to
   * retire this Campaign instead — offered directly rather than making
   * them backtrack through Camp to find it. */
  onSwitchToAbandon: () => void;
}

const FIELD_CLASSES =
  'w-full rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-camp-parchment placeholder:text-camp-parchment-dim/60 focus:border-camp-ember/50 focus:outline-none';

type Stage = 'form' | 'confirm';

/**
 * Source: Book II, Chapter 8 — "Re-Forging: When Life Changes"
 *
 * "Re-Forging means adapting the existing campaign structure to new
 * circumstances while preserving everything the player has already
 * earned... The path bends; it does not break." This screen is the one
 * concrete UI for that: update what changed, see plainly what stays
 * untouched versus what reshapes, then confirm.
 *
 * Never framed as a failure or a restart (Ch.8's "Things We Will Never
 * Do") — same reason this form is pre-filled with the player's own past
 * answers (`campaign.sourceIntake`) rather than a blank Intake redo.
 */
export function ReForge({ campaign, currentChapterIndex, onReForge, onCancel, onSwitchToAbandon }: ReForgeProps) {
  const [stage, setStage] = useState<Stage>('form');
  const [objective, setObjective] = useState(campaign.sourceIntake.objective);
  const [timeAvailability, setTimeAvailability] = useState(campaign.sourceIntake.timeAvailability);
  const [experience, setExperience] = useState(campaign.sourceIntake.experience);
  const [constraint, setConstraint] = useState(campaign.sourceIntake.constraint);
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [declinedCategory, setDeclinedCategory] = useState<HarmfulObjectiveCategory | null>(null);

  if (crisisTriggered) {
    return <CrisisResponse onReturnToCamp={onCancel} />;
  }

  if (declinedCategory) {
    return (
      <ObjectiveDeclineResponse
        category={declinedCategory}
        onTryDifferentObjective={() => setDeclinedCategory(null)}
        onExitToCamp={onCancel}
      />
    );
  }

  const totalChapters = campaign.chapters.length;
  const keptCount = Math.min(currentChapterIndex + 1, totalChapters);
  const reshapedCount = totalChapters - keptCount;

  /** Same safety discipline as Intake — every free-text surface in this
   * app gets the same Book VIII gate, and this form is a new one. */
  function proceedToConfirm() {
    const combinedText = `${objective}\n${experience}\n${constraint}`;
    const crisis = detectCrisisSignal(combinedText);
    if (crisis.flagged) {
      logSafetyEvent('crisis-disclosure', crisis.category ?? 'unknown', 'reforge');
      setCrisisTriggered(true);
      return;
    }
    const harmful = detectHarmfulObjective(objective);
    if (harmful.flagged && harmful.category) {
      logSafetyEvent('harmful-objective', harmful.category, 'reforge');
      setDeclinedCategory(harmful.category);
      return;
    }
    setStage('confirm');
  }

  function confirmReForge() {
    onReForge({ objective: objective.trim(), timeAvailability, experience: experience.trim(), constraint: constraint.trim() });
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <button
        onClick={onCancel}
        className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
      >
        ← Camp
      </button>

      {stage === 'form' && (
        <>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">Re-Forge</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-camp-parchment">
              Life doesn't hold still for a plan — this one doesn't have to break because of it.
            </h1>
            <p className="mt-2 text-sm text-camp-parchment-dim">
              Update whatever's actually changed below. Nothing you've already earned in{' '}
              <span className="text-camp-parchment">{campaign.title}</span> is affected by this.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-camp-parchment-dim">
              Your Objective, as it stands now
            </span>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className={FIELD_CLASSES}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-camp-parchment-dim">
              Time available right now
            </span>
            <div className="flex flex-col gap-2">
              {(
                [
                  ['alongside', 'Alongside other work / life'],
                  ['main-thing', 'This is the main thing right now'],
                  ['not-sure', 'Not sure yet'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeAvailability(value)}
                  className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-150 active:scale-[0.99] ${
                    timeAvailability === value
                      ? 'border-camp-ember/60 bg-camp-ember/10 text-camp-parchment'
                      : 'border-camp-night-soft bg-camp-night-soft/60 text-camp-parchment-dim hover:text-camp-parchment'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-camp-parchment-dim">
              Experience or skill you're bringing now
            </span>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={2}
              placeholder="Starting from scratch is a fine answer too."
              className={FIELD_CLASSES}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-camp-parchment-dim">
              Anything you want to avoid or work around
            </span>
            <textarea
              value={constraint}
              onChange={(e) => setConstraint(e.target.value)}
              rows={2}
              placeholder="Nothing specific is a fine answer too."
              className={FIELD_CLASSES}
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={proceedToConfirm}
              className="rounded-full bg-camp-ember px-6 py-2.5 font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95"
            >
              See what this changes
            </button>
            <button
              onClick={onCancel}
              className="rounded-full border border-camp-night-soft px-6 py-2.5 text-sm text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Never mind
            </button>
          </div>

          <button
            onClick={onSwitchToAbandon}
            className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
          >
            Actually, I'd rather let this Campaign go entirely
          </button>
        </>
      )}

      {stage === 'confirm' && (
        <>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">Confirm the Re-Forge</p>
            <h1 className="mt-1 font-display text-2xl leading-snug text-camp-parchment">
              Here's exactly what bends, and what doesn't.
            </h1>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4 text-sm">
            <p className="text-camp-parchment">
              <span className="font-semibold text-camp-ember">Stays exactly as it is:</span>{' '}
              {keptCount === totalChapters
                ? `All ${totalChapters} Chapters, including everything you've completed — no XP, Attributes, or Relics change.`
                : `Chapters 1–${keptCount} (everything finished so far, plus the Chapter you're on right now) — no XP, Attributes, or Relics change.`}
            </p>
            <p className="text-camp-parchment">
              <span className="font-semibold text-camp-ember">Reshapes around what you just told me:</span>{' '}
              {reshapedCount > 0
                ? `Chapter${reshapedCount > 1 ? 's' : ''} ${keptCount + 1}${
                    reshapedCount > 1 ? `–${totalChapters}` : ''
                  }, which you haven't started yet.`
                : "Nothing structurally — you're already in the final Chapter. Your Objective is still updated for the record."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={confirmReForge}
              className="rounded-full bg-camp-ember px-6 py-2.5 font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95"
            >
              Re-Forge it
            </button>
            <button
              onClick={() => setStage('form')}
              className="rounded-full border border-camp-night-soft px-6 py-2.5 text-sm text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Go back and adjust
            </button>
          </div>
        </>
      )}
    </div>
  );
}
