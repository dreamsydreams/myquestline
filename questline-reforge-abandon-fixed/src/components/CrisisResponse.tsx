import { getRegionHint } from '../safety/regionHint';

/**
 * Source: Book VIII, Chapter 3 — "The Protocol"
 *
 * Rules this component follows, directly from Ch.3:
 * 1. Drop all game framing immediately — no Cinzel, no ember/gold "earned"
 *    styling, no Game Master voice. This screen must read as a human
 *    stepping out from behind the mask, not a character in a story.
 * 2. Acknowledge plainly and warmly. Never clinical, never alarmed.
 * 3. Surface real crisis resources directly — never gate them behind
 *    another click.
 * 4. Never claim confidentiality or involvement of authorities we can't
 *    actually promise (Anthropic-level guidance, applies here too).
 * 5. Never auto-resume campaign content. The player must explicitly choose
 *    to return — this component only offers a path back to the Camp,
 *    never back into the same Intake flow that triggered this.
 *
 * PHASE 6 UPDATE: the Phase 2 version hardcoded US-only resources (988,
 * Crisis Text Line) with only a generic pointer elsewhere for everyone
 * else — flagged explicitly in PHASE_ROADMAP.md as needing real
 * geo-appropriate logic. This now uses src/safety/regionHint.ts, a
 * best-effort, zero-cost, browser-timezone-based guess (see that file for
 * the full honesty note on its real limits — it is NOT real geolocation).
 * Per that file's own rule: the guess only ever ADDS a possibly-more-
 * relevant line. The US default and the international directory are
 * always shown no matter what the guess says, so a wrong guess never
 * hides the right resource — it just means one line was less targeted
 * than it could have been.
 */
export function CrisisResponse({ onReturnToCamp }: { onReturnToCamp: () => void }) {
  const region = getRegionHint();

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-5 px-6 py-16 font-body">
      <p className="text-base leading-relaxed text-camp-parchment">
        Thank you for telling me that. I want to pause everything else for a
        moment, because this matters more than any of it.
      </p>
      <p className="text-base leading-relaxed text-camp-parchment">
        I'm not able to help with something this serious myself, but real
        support exists and it's available right now:
      </p>

      <div className="flex flex-col gap-2 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4">
        {region.country && region.localHelpline && (
          <p className="text-camp-parchment">
            <span className="font-semibold">If you're in {region.country}:</span>{' '}
            {region.localHelpline}
          </p>
        )}
        <p className="text-camp-parchment">
          <span className="font-semibold">In the US: call or text 988</span> —
          Suicide & Crisis Lifeline, available 24/7
        </p>
        <p className="text-camp-parchment">
          <span className="font-semibold">In the US: text HOME to 741741</span>{' '}
          — Crisis Text Line, available 24/7
        </p>
        <p className="text-camp-parchment-dim">
          Anywhere else:{' '}
          <span className="text-camp-parchment">findahelpline.com</span> has a
          directory for your country.
        </p>
        {!region.isLikelyUS && !region.localHelpline && (
          <p className="text-xs text-camp-parchment-dim/80">
            (This is guessed from your device's timezone, not confirmed — if
            it's wrong for where you actually are, findahelpline.com above
            will have the right one.)
          </p>
        )}
      </div>

      <p className="text-base leading-relaxed text-camp-parchment-dim">
        There's no rush here, and nothing else about this app matters more
        right now than you actually being okay. Whenever you're ready — not
        before — you can come back.
      </p>

      <button
        onClick={onReturnToCamp}
        className="mt-2 self-start rounded-full border border-camp-night-soft px-6 py-2.5 text-sm text-camp-parchment transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
      >
        Return to Camp when you're ready
      </button>
    </div>
  );
}
