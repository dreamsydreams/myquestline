import { useEffect, useRef, useState } from 'react';
import type { PlayerCampState, Mission, Campaign } from '../types/campaign';
import { TERMS } from '../constants/language';

interface CampProps {
  state: PlayerCampState;
  /** Toggles a mission's completion. Persisted to localStorage as of Phase 5. */
  onToggleMission: (missionId: string) => void;
  /** Fired when a new player (or a returning veteran, Book IX Ch.3) chooses to begin. */
  onBeginAdventure: () => void;
  /** Marks the current chapter's Boss Battle as defeated (Book II Ch.4/Ch.5 — feeds Confidence). */
  onDefeatBoss: () => void;
  /** Book IX Ch.3's second Empty Camp button. Routes to the Archive (Ch.2),
   * which is intentionally not built yet — see PHASE_ROADMAP.md. */
  onOpenArchive: () => void;
}

export function Camp({ state, onToggleMission, onBeginAdventure, onDefeatBoss, onOpenArchive }: CampProps) {
  if (state.status === 'new-player') {
    return <NewPlayerCamp onBeginAdventure={onBeginAdventure} />;
  }

  if (state.status === 'between-campaigns') {
    return (
      <BetweenCampaignsCamp
        mostRecentCampaign={state.mostRecentCampaign}
        onBeginAdventure={onBeginAdventure}
        onOpenArchive={onOpenArchive}
      />
    );
  }

  return (
    <ActiveCamp
      chapter={state.chapter}
      onToggleMission={onToggleMission}
      onDefeatBoss={onDefeatBoss}
    />
  );
}

/**
 * Book IX, Ch.3 — the Empty Camp State. Copy, buttons, and rules below are
 * lifted exactly from that chapter's Implementation Spec, per the roadmap's
 * explicit instruction not to improvise on it. Trigger condition lives in
 * App.tsx (no active campaign AND real campaign history exists) — this
 * component only renders once that's already true.
 *
 * Deliberately calm: no danger color, no urgency styling, no countdown, and
 * the two buttons are the only paths offered — both require the player's
 * own initiative, per the spec's explicit rule against auto-generating a
 * new goal on their behalf.
 */
function BetweenCampaignsCamp({
  mostRecentCampaign,
  onBeginAdventure,
  onOpenArchive,
}: {
  mostRecentCampaign: Campaign;
  onBeginAdventure: () => void;
  onOpenArchive: () => void;
}) {
  // UX addition: Book IX Ch.3's spec was written assuming a finished
  // Campaign ("You've reached a real summit"). Abandon Quest introduces a
  // second, equally legitimate way to land here — Book I's no-guilt
  // promise and Book IX Ch.2's "completed and abandoned honestly and
  // without shame" both mean this can't just reuse "summit" language for
  // something the player deliberately set down instead of finishing.
  const wasAbandoned = Boolean(mostRecentCampaign.abandonedAt) && !mostRecentCampaign.completedAt;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <h1 className="font-display text-3xl leading-snug text-camp-parchment">
        {wasAbandoned ? 'You set that one down — and that\'s alright.' : 'You\'ve reached a real summit.'}
      </h1>
      <p className="max-w-md text-camp-parchment-dim">
        {wasAbandoned ? (
          <>
            <span className="text-camp-parchment">{mostRecentCampaign.title}</span> is in your history now, honestly
            marked as let go, not hidden and not failed.
          </>
        ) : (
          <>
            <span className="text-camp-parchment">{mostRecentCampaign.title}</span> is done. That's not
            nothing — that's the thing most people never finish.
          </>
        )}
      </p>
      <p className="max-w-md text-camp-parchment-dim">Take a moment before you decide anything.</p>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={onBeginAdventure}
          className="rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
        >
          Begin a New Adventure
        </button>
        <button
          onClick={onOpenArchive}
          className="rounded-full border border-camp-parchment-dim/40 px-8 py-3 font-semibold text-camp-parchment transition-transform duration-150 hover:border-camp-parchment-dim active:scale-95"
        >
          Open Your Archive
        </button>
      </div>
    </div>
  );
}

/**
 * Book VI, Ch.6 (First Five Minutes): a brand-new player's very first Camp
 * view should feel like an honest invitation, not an empty dashboard state.
 * This is deliberately NOT the Book IX, Ch.3 Empty Camp State — that screen
 * is for players with campaign history who currently have none active.
 * This one is for someone who has never begun at all.
 */
function NewPlayerCamp({ onBeginAdventure }: { onBeginAdventure: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-parchment-dim">
        {TERMS.dashboard}
      </p>
      <h1 className="font-display text-3xl leading-snug text-camp-parchment">
        The mountain is out there.
        <br />
        Nobody's mapped your route yet.
      </h1>
      <p className="max-w-md text-camp-parchment-dim">
        Tell us what you're actually trying to become. We'll take it from there.
      </p>
      <button
        onClick={onBeginAdventure}
        className="mt-2 rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
      >
        {TERMS.createGoal}
      </button>
    </div>
  );
}

function ActiveCamp({
  chapter,
  onToggleMission,
  onDefeatBoss,
}: {
  chapter: Extract<PlayerCampState, { status: 'active-journey' }>['chapter'];
  onToggleMission: (missionId: string) => void;
  onDefeatBoss: () => void;
}) {
  // BUG FIX: "Today" used to be recomputed live, every render, as "the
  // first Quest that isn't fully complete yet." That meant the instant a
  // player checked off the LAST remaining Mission in that Quest, the whole
  // Today list would immediately swap to the next Quest (or vanish) —
  // mid-click, with no confirmation. It looked like the task the player
  // just checked had simply disappeared.
  //
  // Fix: pin which Quest "Today" is showing once, when the player arrives
  // at Camp (component mount), and keep showing that same Quest's Missions
  // — checked or not — for the rest of this visit. The player can freely
  // check/uncheck without anything vanishing. Only an explicit "Continue"
  // click (below) advances to the next Quest, so progressing forward is
  // always a deliberate action, never a surprise side-effect of a checkbox.
  const [pinnedQuestId, setPinnedQuestId] = useState<string | null>(
    () => chapter.quests.find((q) => !q.missions.every((m) => m.isComplete))?.id ?? null
  );

  const pinnedQuest = chapter.quests.find((q) => q.id === pinnedQuestId);
  const todaysMissions = pinnedQuest?.missions ?? [];
  const pinnedQuestComplete = todaysMissions.length > 0 && todaysMissions.every((m) => m.isComplete);
  const nextIncompleteQuest = chapter.quests.find(
    (q) => q.id !== pinnedQuestId && !q.missions.every((m) => m.isComplete)
  );

  const allMissionsComplete = chapter.quests.every((q) => q.missions.every((m) => m.isComplete));

  // Boss Battle redesign: "quick" bosses are genuinely finished the moment
  // today's steps are — for those, Defeat can reasonably wait on the
  // checklist. "sustained" bosses (the default, and most of them) can't be
  // forced into a day, so Defeat is always available as an honest
  // self-report, completely independent of the checklist below.
  const pacing = chapter.bossBattle?.pacing ?? 'sustained';

  // Boss Battle redesign: Today's Steps stay hidden behind "Face It" until
  // the player deliberately engages with the Challenge — revealing the
  // checklist is a separate, lower-stakes action from the "Defeat" self
  // report below. Per-visit state, same pattern as pinnedQuestId above:
  // resets each time the player arrives at Camp, so returning always leads
  // with the Challenge itself rather than a wall of checkboxes.
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const stepsVisible = !chapter.bossBattle || challengeRevealed;

  // The concrete, nameable real-world outcome this Chapter's Boss Battle
  // stands for. Every template in campaignGenerationEngine.ts pairs exactly
  // one Quest with one Boss Battle per Chapter, and the Quest title is
  // always phrased as a plain real-world action (e.g. "Get your first real
  // customer") — unlike the Boss's own name/description, which is
  // deliberately an abstract feeling ("The Plateau"). Surfacing the Quest
  // title next to the Boss card is what actually answers "face what?"
  const realWorldGoal = chapter.quests[0]?.title;

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-8 px-6 py-10">
      {/* Ambient world detail — small, not distracting (Book VI Ch.2, item 3) */}
      <AmbientHeader />

      {/* 1. Current Chapter context — first priority, never buried in a menu */}
      <section>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">
          Chapter {chapter.chapterNumber}
        </p>
        <h1 className="font-display text-3xl text-camp-parchment">{chapter.name}</h1>
        <p className="mt-2 text-camp-parchment-dim">{chapter.essence}</p>
      </section>

      {/* RESTRUCTURE: Boss Battle now leads, framed as this Chapter's one
          headline challenge — with Today's Missions underneath as the
          concrete steps toward it, rather than the reverse. This matches
          how the mechanics already work (finishing Missions is what
          unlocks the fight) — the old layout buried the actual point of
          the Chapter below a checklist, which is backwards.
          Book II Ch.4 — the chapter's defining obstacle. */}
      {chapter.bossBattle && (
        <section>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-danger">
            This Chapter's Challenge
          </p>
          <div
            className={`mt-2 rounded-xl border p-4 ${
              chapter.bossBattle.isDefeated
                ? 'border-attr-confidence/40 bg-camp-night-soft/40'
                : 'border-camp-danger/40 bg-camp-night-soft/60'
            }`}
          >
            {/* CLARITY FIX, direct answer to "face what???" — the title
                itself now names the concrete real-world thing to do, not
                just an abstract feeling. The Boss's in-world name and
                description drop down to flavor text underneath, so the
                fantasy voice (Book I Ch.9) is kept, but never leads.
                Boss Battle redesign: no more "Face It:" prefix here — that
                duplicated the button below. Plain goal until it's actually
                beaten; "Defeated:" only appears once it's true. */}
            <h2 className="font-display text-2xl text-camp-parchment">
              {chapter.bossBattle.isDefeated && 'Defeated: '}
              {realWorldGoal ?? chapter.bossBattle.name}
            </h2>
            <p className="mt-1 text-sm italic text-camp-parchment-dim">
              {chapter.bossBattle.name} — {chapter.bossBattle.description}
            </p>
            {chapter.bossBattle.whyItMatters && (
              <p className="mt-2 text-xs italic text-camp-parchment-dim">
                Why this matters: {chapter.bossBattle.whyItMatters}
              </p>
            )}
            {chapter.bossBattle.isDefeated ? (
              <p className="mt-3 text-sm font-medium text-camp-ember">Defeated</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {/* Boss Battle redesign: "Face It" now means exactly one
                    thing — reveal today's steps. It never marks anything
                    defeated, so it can't be confused with the self-report
                    button next to it. Hidden once steps are already
                    showing, since it's done its one job. */}
                {!stepsVisible && (
                  <button
                    onClick={() => setChallengeRevealed(true)}
                    className="rounded-full border border-camp-parchment-dim/50 px-5 py-2 text-sm font-semibold text-camp-parchment transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
                  >
                    Face It
                  </button>
                )}
                {/* Boss Battle redesign: "Defeat" is the one place an honest
                    self-report happens. For "sustained" bosses (the
                    default) it's always clickable — the real-world outcome
                    isn't inferred from checkboxes, ever. For "quick" bosses,
                    today's steps essentially ARE the win, so it stays
                    gated on them being done, same as the old behavior. */}
                <button
                  onClick={onDefeatBoss}
                  disabled={pacing === 'quick' && !allMissionsComplete}
                  title={
                    pacing === 'quick' && !allMissionsComplete
                      ? "Finish today's steps first"
                      : undefined
                  }
                  className="rounded-full bg-camp-ember px-5 py-2 text-sm font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-camp-ember"
                >
                  Defeat
                </button>
                <p className="w-full text-xs text-camp-parchment-dim">
                  {pacing === 'quick'
                    ? allMissionsComplete
                      ? "Today's steps are done — if the real thing above has actually happened, mark it here."
                      : "Finish today's steps to unlock this — for this Challenge, doing the reps essentially is the win."
                    : "This isn't tied to today's steps below. Click it only once the real thing above has actually happened — whether that's today or weeks from now."}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Today's steps toward that challenge — clear, few, never a wall
          of tasks. Framed explicitly as sub-steps of the Challenge above,
          not a separate independent list. Boss Battle redesign: hidden
          entirely until the player clicks "Face It" above (when there is a
          Boss Battle) — the Challenge leads, the checklist is revealed on
          demand rather than dumped up front. */}
      {stepsVisible && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg text-camp-parchment">
              {chapter.bossBattle ? "Today's Steps" : 'Today'}
            </h2>
            {/* CLARITY FIX: the Quest title (the concrete real-world thing
                these Missions serve) was never actually shown anywhere on
                Camp — players saw checkboxes with nothing tying them to a
                real goal. This line is that missing connective tissue. */}
            {pinnedQuest?.title && (
              <p className="text-sm text-camp-parchment-dim">Quest: {pinnedQuest.title}</p>
            )}
          </div>
          {todaysMissions.length > 0 ? (
            <>
              {todaysMissions.map((mission) => (
                <MissionRow key={mission.id} mission={mission} onToggle={onToggleMission} />
              ))}
              {/* Missions within the same Quest currently share one relevance
                  line (see campaignGenerationEngine.ts) — shown once here
                  rather than repeated under every row, so it reads as context
                  instead of the same sentence three times in a row. */}
              {todaysMissions[0]?.whyItMatters && (
                <p className="text-xs italic text-camp-parchment-dim">
                  Why this matters: {todaysMissions[0].whyItMatters}
                </p>
              )}
              {/* All of this pinned Quest's Missions are checked. Rather than
                  silently swapping to the next Quest (the old bug), show it
                  plainly and let the player decide when to move on. */}
              {pinnedQuestComplete && (
                <div className="mt-1 rounded-xl border border-attr-confidence/40 bg-camp-night-soft/40 px-4 py-3">
                  <p className="text-sm font-medium text-camp-ember">Quest complete.</p>
                  {nextIncompleteQuest ? (
                    <>
                      <p className="mt-1 text-sm text-camp-parchment-dim">
                        Ready to move on to "{nextIncompleteQuest.title}"?
                      </p>
                      <button
                        onClick={() => setPinnedQuestId(nextIncompleteQuest.id)}
                        className="mt-3 rounded-full bg-camp-ember px-5 py-2 text-sm font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95"
                      >
                        Continue
                      </button>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-camp-parchment-dim">
                      {chapter.bossBattle && !chapter.bossBattle.isDefeated
                        ? pacing === 'sustained'
                          ? // Boss Battle redesign: this is the "no dead end"
                            // case the handoff calls out — steps are done but
                            // the real outcome hasn't happened yet, and for a
                            // sustained boss that's completely normal, not a
                            // stuck state. Calm, no manufactured urgency.
                            `Nice work today. Still working toward "${realWorldGoal ?? chapter.bossBattle.name}"? Come back for more.`
                          : 'The Challenge above is what\'s left this Chapter.'
                        : 'Nothing left to check off today.'}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="rounded-xl border border-camp-night-soft bg-camp-night-soft/40 px-4 py-3 text-sm text-camp-parchment-dim">
              {chapter.bossBattle && !chapter.bossBattle.isDefeated
                ? "Nothing left to check off — the Challenge above is what's left."
                : "Nothing left to check off today."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function MissionRow({
  mission,
  onToggle,
}: {
  mission: Mission;
  onToggle: (id: string) => void;
}) {
  // Small, satisfying "pop" the instant a mission goes from incomplete to
  // complete (Book VI Ch.4). Deliberately brief and modest in scale — this
  // is a routine action, not a Chapter Completion (that ceremony is Phase 5,
  // Book I Ch.10 / Book III Ch.7, and must feel meaningfully bigger than this).
  const [justCompleted, setJustCompleted] = useState(false);
  const wasComplete = useRef(mission.isComplete);

  useEffect(() => {
    if (!wasComplete.current && mission.isComplete) {
      setJustCompleted(true);
      const timeout = setTimeout(() => setJustCompleted(false), 280);
      wasComplete.current = mission.isComplete;
      return () => clearTimeout(timeout);
    }
    wasComplete.current = mission.isComplete;
  }, [mission.isComplete]);

  // Per-task hint (Boss Battle redesign): a "?" affordance that reveals
  // concrete, actionable guidance without touching completion state. Kept
  // as a fully separate button/click target from the toggle below — a
  // player checking the hint should never accidentally mark the task done.
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-camp-night-soft bg-camp-night-soft/60 transition-all duration-150 hover:border-camp-ember/50">
      <div className="flex items-center gap-2 px-2 py-1">
        <button
          onClick={() => onToggle(mission.id)}
          className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left active:scale-[0.98]"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
              mission.isComplete
                ? 'border-camp-ember bg-camp-ember text-camp-night'
                : 'border-camp-parchment-dim'
            } ${justCompleted ? 'animate-mission-pop' : ''}`}
          >
            {mission.isComplete ? '✓' : ''}
          </span>
          <span
            className={
              mission.isComplete
                ? 'text-camp-parchment-dim line-through transition-colors duration-150'
                : 'text-camp-parchment transition-colors duration-150'
            }
          >
            {mission.title}
          </span>
        </button>
        {mission.howTo && (
          <button
            onClick={() => setShowHint((v) => !v)}
            aria-label={showHint ? 'Hide how-to' : 'How do I do this?'}
            aria-expanded={showHint}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-camp-parchment-dim/40 text-xs text-camp-parchment-dim transition-colors duration-150 hover:border-camp-parchment-dim hover:text-camp-parchment"
          >
            ?
          </button>
        )}
      </div>
      {showHint && mission.howTo && (
        <p className="border-t border-camp-night-soft/80 bg-camp-night-soft/40 px-4 py-3 text-xs text-camp-parchment-dim">
          {mission.howTo}
        </p>
      )}
    </div>
  );
}

/**
 * Small, quiet, ambient — per Book VI Ch.2's third priority. Deliberately
 * minimal for Phase 1: a placeholder for time-of-day / seasonal theming,
 * not a real ambient system yet.
 */
function AmbientHeader() {
  return (
    <div className="text-xs uppercase tracking-widest text-camp-parchment-dim/60">
      Dusk at Camp
    </div>
  );
}
