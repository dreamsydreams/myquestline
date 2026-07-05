/**
 * Source: Book VIII, Chapter 7 — "Escalation, Logging & Human Review"
 *
 * Ch.7's principles, and how this module honestly meets (or doesn't meet)
 * each one at this project's current stage:
 *
 * 1. "Genuine crisis disclosures and harmful-objective attempts should be
 *    logged... so patterns can be reviewed and the system improved over
 *    time — not to surveil individual players, but to catch systemic
 *    gaps." This module logs every flag from crisisDetection.ts and
 *    harmfulObjectiveDetection.ts.
 *
 * 2. "At small-team or solo-builder scale, there should be a clear, if
 *    manual, process for a human to review flagged edge cases." At this
 *    project's actual current scale (solo builder, static site, no
 *    backend), the honest manual process IS: open the app, use the dev
 *    panel's "view safety log" button, read the entries. That's not a
 *    placeholder for a real process — for exactly one person building
 *    this alone, it genuinely is the process. It stops being adequate the
 *    moment there's more than one person or any real user base, which is
 *    exactly what principle 3 below is naming.
 *
 * 3. "As the team grows, this must evolve into a real, resourced
 *    trust-and-safety function." Explicitly NOT attempted here. A real
 *    version needs server-side storage, access controls, and retention
 *    policy — none of which a client-only localStorage log can honestly
 *    provide. Do not mistake this for that system once real users exist.
 *
 * PRIVACY DESIGN DECISION (Ch.7 ties this to Book VII Ch.6's data ethics):
 * this log intentionally does NOT store the player's raw disclosed text.
 * Reviewing categories and frequencies is enough to catch systemic
 * detection gaps (e.g. "abuse-or-acute-crisis is never firing, something's
 * probably wrong with those patterns") without retaining the actual
 * sensitive content a player typed. This is a real trade-off — a future
 * proper review process might reasonably want redacted context to tune
 * detection quality — but defaulting to NOT storing sensitive raw text is
 * the safer failure mode for a client-side, unencrypted, single-device
 * log with no access control at all.
 *
 * Storage: localStorage, same zero-cost tier as lib/persistence.ts, but
 * a deliberately SEPARATE key from player campaign data — this is safety
 * telemetry, not player state, and the two should never be conflated or
 * exported together.
 */

export type SafetyEventType = 'crisis-disclosure' | 'harmful-objective';

export interface SafetyLogEntry {
  id: string;
  timestamp: string;
  type: SafetyEventType;
  /** e.g. 'self-harm-or-suicide', 'harm-to-other' — see crisisDetection.ts
   * and harmfulObjectiveDetection.ts for the full category lists. */
  category: string;
  /** Which Intake step surfaced it — useful for spotting whether certain
   * questions draw disclosures more than others. */
  intakeStep: string;
}

const LOG_KEY = 'questline:safety-log';
const MAX_ENTRIES = 200;

function readLog(): SafetyLogEntry[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries: SafetyLogEntry[]): void {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    // Storage full/unavailable — logging is best-effort and should never
    // block or crash the actual safety response the player sees.
  }
}

export function logSafetyEvent(type: SafetyEventType, category: string, intakeStep: string): void {
  const entry: SafetyLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type,
    category,
    intakeStep,
  };
  const entries = [entry, ...readLog()].slice(0, MAX_ENTRIES);
  writeLog(entries);
}

export function getSafetyLog(): SafetyLogEntry[] {
  return readLog();
}

export function clearSafetyLog(): void {
  try {
    window.localStorage.removeItem(LOG_KEY);
  } catch {
    // no-op
  }
}
