import { useEffect, useRef, useState } from 'react';
import type { PlayerCampState, Mission, Campaign } from '../types/campaign';
import { TERMS } from '../constants/language';
import { getTodaysMissions } from '../engine/missionsToday';

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
  // UX-FIX: this used to read a stored `chapter.missionsToday` that only
  // ever got populated for Chapter 1 at generation time — every later
  // Chapter silently showed an empty Today section forever. Computed live
  // now, from the real quest data, so it can't go stale again.
  const todaysMissions = getTodaysMissions(chapter);
  const allMissionsComplete = chapter.quests.every((q) => q.missions.every((m) => m.isComplete));

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

      {/* 2. Today's Missions — clear, few, never a wall of tasks */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-camp-parchment">Today</h2>
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
          </>
        ) : (
          <p className="rounded-xl border border-camp-night-soft bg-camp-night-soft/40 px-4 py-3 text-sm text-camp-parchment-dim">
            {chapter.bossBattle && !chapter.bossBattle.isDefeated
              ? "Nothing left to check off — the Boss Battle below is what's left."
              : "Nothing left to check off today."}
          </p>
        )}
      </section>

      {/* Boss Battle (Book II Ch.4) — the chapter's defining obstacle */}
      {chapter.bossBattle && (
        <section>
          <h2 className="font-display text-lg text-camp-parchment">Boss Battle</h2>
          <div
            className={`mt-2 rounded-xl border p-4 ${
              chapter.bossBattle.isDefeated
                ? 'border-attr-confidence/40 bg-camp-night-soft/40'
                : 'border-camp-danger/40 bg-camp-night-soft/60'
            }`}
          >
            <p className="font-display text-lg text-camp-parchment">
              {chapter.bossBattle.name}
            </p>
            <p className="mt-1 text-sm text-camp-parchment-dim">
              {chapter.bossBattle.description}
            </p>
            {chapter.bossBattle.whyItMatters && (
              <p className="mt-2 text-xs italic text-camp-parchment-dim">
                Why this matters: {chapter.bossBattle.whyItMatters}
              </p>
            )}
            {chapter.bossBattle.isDefeated ? (
              <p className="mt-3 text-sm font-medium text-camp-ember">Defeated</p>
            ) : (
              <>
                {/* UX-FIX: this button used to be clickable at any time, even
                    with today's Missions untouched — a real player could
                    "defeat" a Boss Battle without having done any of the
                    work it's supposed to represent. Now gated on today's
                    Missions actually being complete first. */}
                <button
                  onClick={onDefeatBoss}
                  disabled={!allMissionsComplete}
                  title={
                    allMissionsComplete
                      ? undefined
                      : "Finish today's Missions first"
                  }
                  className="mt-3 rounded-full bg-camp-ember px-5 py-2 text-sm font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-camp-ember"
                >
                  Face It
                </button>
                {!allMissionsComplete && (
                  <p className="mt-2 text-xs text-camp-parchment-dim">
                    Finish today's Missions first.
                  </p>
                )}
              </>
            )}
          </div>
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

  return (
    <button
      onClick={() => onToggle(mission.id)}
      className="flex items-center gap-3 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-left transition-all duration-150 hover:border-camp-ember/50 active:scale-[0.98]"
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
