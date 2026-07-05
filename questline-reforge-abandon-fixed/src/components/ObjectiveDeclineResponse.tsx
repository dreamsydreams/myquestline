import type { HarmfulObjectiveCategory } from '../safety/harmfulObjectiveDetection';
import { OBJECTIVE_DECLINE_COPY } from '../safety/harmfulObjectiveDetection';

/**
 * Source: Book VIII, Chapter 4 — "Objectives Questline Will Not Build a
 * Campaign For"
 *
 * Deliberately DIFFERENT in tone from CrisisResponse.tsx, per Ch.4's own
 * text: "Not with a cold refusal alone — with an honest redirection, in
 * the Game Master's caring voice from Book III wherever appropriate."
 * A harmful objective isn't a crisis — the game framing doesn't need to
 * drop entirely the way it does for Ch.3. It stays warm, stays in the
 * Camp's visual language, but is unambiguous that this specific request
 * isn't one Questline will build a Campaign around.
 *
 * Never re-frames or "launders" the objective into something acceptable
 * just to keep the interaction going (Ch.4's explicit rule) — the decline
 * is stated plainly, then the player is offered a real way back into
 * Intake to try a different Objective, not a way to keep pushing the
 * original one through.
 */
export function ObjectiveDeclineResponse({
  category,
  onTryDifferentObjective,
  onExitToCamp,
}: {
  category: HarmfulObjectiveCategory;
  onTryDifferentObjective: () => void;
  onExitToCamp: () => void;
}) {
  const copy = OBJECTIVE_DECLINE_COPY[category];

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-5 px-6 py-16">
      <p className="font-display text-xl leading-snug text-camp-parchment">
        {copy.acknowledgment}
      </p>
      <p className="text-base leading-relaxed text-camp-parchment">
        {copy.decline}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onTryDifferentObjective}
          className="rounded-full bg-camp-ember px-6 py-2.5 font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95"
        >
          Try a different Objective
        </button>
        <button
          onClick={onExitToCamp}
          className="rounded-full border border-camp-night-soft px-6 py-2.5 text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
        >
          Back to Camp
        </button>
      </div>
    </div>
  );
}
