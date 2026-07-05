/**
 * Full five-layer campaign data model.
 * Source: Book II, Chapter 1 — "The Anatomy of a Campaign"
 *
 * Objective -> Campaign -> Chapter -> Quest -> Mission, plus Boss Battles
 * and Enemies (Ch.4). This replaces the Phase 1 placeholder model.
 */

import type { IntakeAnswers } from './intake';

export type AttributeKey =
  | 'discipline'
  | 'craft'
  | 'confidence'
  | 'network'
  | 'resilience';

/** Book II, Ch.7 — the three-phase emotional shape of a campaign. Internal
 * pacing metadata, distinct from the player-facing Chapter name, which must
 * always describe an identity shift (Book II Ch.1), never a phase label. */
export type PacingPhase = 'spark' | 'plateau' | 'final-ascent';

export interface Mission {
  id: string;
  title: string;
  isComplete: boolean;
  /** Which attribute this contributes to, and how much (Book II Ch.5).
   * XP must stay proportional to real effort/importance — never inflated. */
  attribute?: AttributeKey;
  xp?: number;
  /** UX-fix pass: a short, honest sentence tying this Mission back to the
   * player's actual Objective — added because reflection showed players
   * had no way to see why a given checkbox mattered beyond "do this task."
   * See engine/campaignGenerationEngine.ts's relevance helpers. */
  whyItMatters?: string;
  /** UX-fix pass (Boss Battle redesign): concrete, actionable "how do I
   * actually do this" guidance — a sample message, where to find leads,
   * what "verifiable" looks like, etc. Shown on demand via a separate
   * affordance in MissionRow, never by toggling completion. */
  howTo?: string;
}

export interface Quest {
  id: string;
  title: string;
  missions: Mission[];
  isComplete: boolean;
}

/** Book II, Ch.4 — the single defining obstacle of a chapter. Only valid if
 * overcoming it represents a genuine shift in capability or identity. */
export interface BossBattle {
  id: string;
  name: string;
  description: string;
  isDefeated: boolean;
  /** Same UX-fix rationale as Mission.whyItMatters above. */
  whyItMatters?: string;
  /** Boss Battle redesign: internal behavior flag, never shown to the
   * player as a label. 'quick' = genuinely doable in one sitting — today's
   * Missions essentially ARE the fight, so Defeat can reasonably wait on
   * them being done. 'sustained' = a real-world outcome that isn't fully
   * in the player's control and may take days/weeks — Defeat is always an
   * honest self-report, independent of any checkbox. Missing/undefined is
   * treated as 'sustained', the more conservative/honest default. */
  pacing?: 'quick' | 'sustained';
}

/** Book II, Ch.4 — ongoing, lower-intensity recurring obstacles, acknowledged
 * rather than "defeated" once and for all. */
export interface Enemy {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  name: string;
  essence: string;
  pacingPhase: PacingPhase;
  quests: Quest[];
  bossBattle?: BossBattle;
  enemies?: Enemy[];
  isComplete: boolean;
}

/** Book II, Ch.3 — a distinct, evidence-backed route to the same Objective.
 * `personalFit` is deliberately null until a path is actually chosen
 * (Book II Ch.9, step 5) — never shown before then, never used to rank
 * paths against each other before the player picks. */
export interface EvidencePath {
  id: string;
  name: string;
  evidenceStrength: 'strong' | 'moderate' | 'emerging' | 'not-yet-available';
  personalFit: number | null;
  description: string;
}

export interface Campaign {
  id: string;
  title: string;
  objective: string;
  chosenPath: EvidencePath;
  chapters: Chapter[];
  /** The Intake answers that produced this Campaign. Kept so Re-Forging
   * (Book II Ch.8) has real prior answers to show and adjust from, instead
   * of asking a player to redo Intake from a blank slate every time their
   * circumstances change. */
  sourceIntake: IntakeAnswers;
  /** Set the moment every Chapter is complete (Book IX Ch.3's trigger
   * condition cares about this, not about the campaign being deleted).
   * Undefined/absent means still in progress. */
  completedAt?: string;
  /** Book II, Ch.8 — Re-Forging. Set to the timestamp of the most recent
   * Re-Forge applied to this Campaign. A Campaign can be Re-Forged more
   * than once over its life before eventually being completed or
   * abandoned — this is just "last touched," not a full history log. */
  reforgedAt?: string;
  /** Set the moment a player deliberately retires this Campaign without
   * finishing it (the in-world term is "Abandon Quest," Book I Ch.9).
   * Deliberately a SEPARATE field from `completedAt`, never conflated with
   * it — Book IX Ch.2 wants a future Archive able to tell "finished" and
   * "let go" apart honestly, and Book I's no-guilt promise means an
   * abandoned Campaign is never quietly relabeled as complete. */
  abandonedAt?: string;
}

/**
 * The player's overall relationship to Questline right now, as far as the
 * Camp needs to know.
 *
 * `between-campaigns` is Book IX, Ch.3's Empty Camp State — distinct from
 * `new-player` on purpose: it fires only when real campaign history exists
 * but nothing is currently active, per that chapter's exact trigger
 * condition (`activeCampaigns.length === 0` AND history.length > 0).
 */
export type PlayerCampState =
  | { status: 'new-player' }
  | {
      status: 'active-journey';
      chapter: Chapter;
      /** Boss Battle redesign: only present when `chapter` is already
       * fully complete but the player chose "Go Home" instead of
       * "Continue" from the ceremony — Camp uses this to offer a
       * "Begin Chapter N" prompt instead of pretending there's still
       * work left on a chapter that's actually done. */
      nextChapter?: Chapter;
    }
  | { status: 'between-campaigns'; mostRecentCampaign: Campaign };
