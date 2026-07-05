/**
 * Source: Book VIII, Chapter 2 — "Recognizing a Disclosure Versus a Goal"
 * and Chapter 3 — "The Crisis Response Protocol"
 *
 * PHASE 6 REPLACES THE PHASE 2 STUB. What changed and why:
 *
 * Book VIII Ch.2's own Future Questions ask whether detection should be
 * "keyword-based, model-based, or a hybrid." The honest answer at this
 * project's current stage is: still pattern-based, not model-based — a real
 * model classifier means sending player text to an LLM API, which is a real
 * per-call cost. That's a genuine paid-service decision (see
 * PHASE_ROADMAP.md's "zero paid services used anywhere" constraint) and
 * shouldn't be snuck in silently just because it's technically possible.
 * If/when that constraint changes, this is designed to be replaceable:
 * `detectCrisisSignal` is the one function every caller uses, and a
 * Netlify Function-backed model classifier could implement the same
 * return shape without touching any call site.
 *
 * What DID meaningfully improve over the Phase 2 stub:
 * - Word-boundary regex instead of naive substring matching, so this
 *   no longer risks flagging things like "grieving" the way a looser
 *   substring approach could have one accidental match away from that
 *   exact class of false positive.
 * - Categorized detection matching Ch.2's own language ("hopelessness,
 *   self-harm, suicidal ideation, abuse, or acute crisis") instead of one
 *   flat suicide-only list — Ch.2 is explicit that disclosure is broader
 *   than suicidality alone.
 * - Scans the full submitted text rather than requiring an exact phrase
 *   match, so a disclosure embedded inside an otherwise goal-shaped
 *   sentence ("I want to get better but honestly I don't want to be here
 *   anymore") is still caught — this was Ch.2's specific concern.
 *
 * What did NOT change, stated honestly: this is still pattern matching.
 * It will still produce false negatives (real disclosures phrased in ways
 * no pattern anticipated) and false positives (normal emotional language
 * that happens to match). Per Ch.2's explicit rule, ambiguity defaults to
 * treating it as a real disclosure — a false positive costs a player one
 * unnecessary but harmless supportive screen; a false negative could cost
 * a great deal more. Do not tune this list toward fewer false positives
 * without weighing that asymmetry.
 */

export type CrisisCategory = 'self-harm-or-suicide' | 'hopelessness' | 'abuse-or-acute-crisis';

export interface CrisisDetectionResult {
  flagged: boolean;
  /** First category that matched, for logging (Ch.7) — not shown to the
   * player; the response is the same regardless of category (Ch.3's
   * protocol doesn't branch by category, on purpose). */
  category: CrisisCategory | null;
}

const PATTERNS: Array<{ category: CrisisCategory; pattern: RegExp }> = [
  // Self-harm / suicidal ideation
  { category: 'self-harm-or-suicide', pattern: /\bkill(?:ing)?\s+myself\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bend\s+it\s+all\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bend(?:ing)?\s+my\s+(?:own\s+)?life\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bsuicid(?:e|al)\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bwant(?:ed|s)?\s+to\s+die\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bbetter\s+off\s+dead\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bhurt(?:ing)?\s+myself\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bself[- ]harm(?:ing)?\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bdon'?t\s+want\s+to\s+(?:be\s+here|wake\s+up)\s+anymore\b/i },
  { category: 'self-harm-or-suicide', pattern: /\bcan'?t\s+go\s+on\b/i },

  // Hopelessness (Ch.2 names this as its own signal, distinct from acute
  // self-harm intent — still real disclosure, still gets the same protocol)
  { category: 'hopelessness', pattern: /\bno\s+reason\s+to\s+live\b/i },
  { category: 'hopelessness', pattern: /\bno\s+point\s+in\s+(?:anything|living|trying)\b/i },
  { category: 'hopelessness', pattern: /\bnothing\s+(?:will\s+ever\s+)?matters?\s+anymore\b/i },
  { category: 'hopelessness', pattern: /\beveryone\s+would\s+be\s+better\s+off\s+without\s+me\b/i },

  // Abuse / acute crisis
  { category: 'abuse-or-acute-crisis', pattern: /\b(?:he|she|they)'?s?\s+(?:hitting|hurting)\s+me\b/i },
  { category: 'abuse-or-acute-crisis', pattern: /\bbeing\s+abused\b|\babusing\s+me\b/i },
  { category: 'abuse-or-acute-crisis', pattern: /\bafraid\s+(?:he|she|they)'?ll\s+hurt\s+me\b/i },
  { category: 'abuse-or-acute-crisis', pattern: /\bnot\s+safe\s+(?:at\s+home|here|right\s+now)\b/i },
];

export function detectCrisisSignal(text: string): CrisisDetectionResult {
  if (!text || !text.trim()) return { flagged: false, category: null };
  for (const { category, pattern } of PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, category };
    }
  }
  return { flagged: false, category: null };
}
