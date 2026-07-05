import { useState } from 'react';
import type { EvidencePath } from '../types/campaign';

interface PathSelectionProps {
  objective: string;
  paths: EvidencePath[];
  onChoosePath: (path: EvidencePath) => void;
  /** Lets the player leave this screen without picking a path, at any
   * point — UX fix: previously there was no way back to Camp from here
   * short of closing the tab. */
  onBackToCamp: () => void;
}

// UX-FIX: objectives can be a sentence or several paragraphs (a real player
// pasted ~150 words). The old version rendered the whole thing as a single
// giant Cinzel h1 — Cinzel's letterforms read as all-caps at any length, and
// a multi-paragraph objective in that treatment was genuinely hard to read,
// exactly the "cognitive overload" a display font sized for a short title
// should never cause. Long objectives now sit in a normal-weight, sentence-
// case card and truncate with an explicit "Show full objective" toggle.
const OBJECTIVE_PREVIEW_LENGTH = 220;

/**
 * Source: Book II, Ch.3 (branching paths) + Ch.9 step 4 (Player Selection).
 *
 * Rules this screen follows directly:
 * - Never fewer than 2 genuinely distinct paths shown (Ch.3).
 * - Never a single ranking number implying one path is objectively "best" —
 *   only Evidence Strength shown here; Personal Fit stays "unknown yet"
 *   until a path is actually chosen (Ch.9 step 5 happens after this screen).
 * - Evidence Strength is a qualitative label, never a fabricated statistic
 *   (Book IV Ch.3 — this is the exact thing to never do at MVP stage).
 */
export function PathSelection({ objective, paths, onChoosePath, onBackToCamp }: PathSelectionProps) {
  const [showFullObjective, setShowFullObjective] = useState(objective.length <= OBJECTIVE_PREVIEW_LENGTH);
  const displayedObjective = showFullObjective
    ? objective
    : `${objective.slice(0, OBJECTIVE_PREVIEW_LENGTH).trim()}…`;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-12">
      <button
        onClick={onBackToCamp}
        className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
      >
        ← Camp
      </button>

      <div>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">
          Objective
        </p>
        <div className="mt-2 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-camp-parchment">
            {displayedObjective}
          </p>
          {objective.length > OBJECTIVE_PREVIEW_LENGTH && (
            <button
              onClick={() => setShowFullObjective((s) => !s)}
              className="mt-2 text-xs text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
            >
              {showFullObjective ? 'Show less' : 'Show full objective'}
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-camp-parchment-dim">
          There's more than one real way to get there. Pick the one that actually
          sounds like you — you can adjust course later if things change.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {paths.map((path) => (
          <PathCard key={path.id} path={path} onChoose={() => onChoosePath(path)} />
        ))}
      </div>

      <p className="text-xs text-camp-parchment-dim/70">
        Evidence Strength reflects how well-documented this kind of route is right
        now, not a ranking of which path is "best" for you specifically — that part
        gets figured out once you pick.
      </p>
    </div>
  );
}

function PathCard({ path, onChoose }: { path: EvidencePath; onChoose: () => void }) {
  const evidenceLabel: Record<EvidencePath['evidenceStrength'], string> = {
    strong: 'Evidence: strong',
    moderate: 'Evidence: moderate',
    emerging: 'Evidence: emerging',
    'not-yet-available': 'Evidence: not yet available',
  };

  return (
    <button
      onClick={onChoose}
      className="flex flex-col gap-2 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4 text-left transition-all duration-150 hover:border-camp-ember/50 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-camp-parchment">{path.name}</h2>
        <span className="text-xs text-camp-parchment-dim">
          {evidenceLabel[path.evidenceStrength]} · Fit: unknown yet
        </span>
      </div>
      <p className="text-sm text-camp-parchment-dim">{path.description}</p>
    </button>
  );
}
