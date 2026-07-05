/**
 * Source: Book VIII, Chapter 4 — "Objectives Questline Will Not Build a
 * Campaign For"
 *
 * This is a DIFFERENT check from crisisDetection.ts. A crisis disclosure is
 * something wrong happening to the player right now. A harmful objective is
 * a stated goal that Questline should simply decline to build campaign
 * infrastructure around — the player isn't necessarily in danger, but the
 * request itself isn't eligible for a Campaign, Chapters, Quests, or the
 * Evidence Engine's real, structured help (Book II Ch.9).
 *
 * Ch.4 names three categories explicitly. This module checks for all three:
 *   1. harm-to-other   — goals whose explicit purpose is harming,
 *      manipulating, controlling, or deceiving a specific other person.
 *   2. illegal-or-violent — goals framed around fraud, violence, or
 *      acquiring weapons for harmful purposes.
 *   3. self-destructive — goals that would require Questline to coach
 *      specific self-harm, disordered eating, or extreme/"no matter what"
 *      physical regimens.
 *
 * HONEST LIMITATION, stated the way Ch.4's own Future Questions ask for:
 * this is a heuristic starting policy, not the "maintained, concrete
 * policy" Ch.4 says this ultimately needs. Real edge cases — "become the
 * best in my industry even if it means outcompeting people I know" is
 * Ch.4's own example of something that SHOULDN'T trip this — will need a
 * human-reviewed, continuously maintained policy, not a static regex list.
 * Treat any flag from this module as "route to the honest redirection
 * response," not as a claim that the underlying classification is precise.
 */

export type HarmfulObjectiveCategory =
  | 'harm-to-other'
  | 'illegal-or-violent'
  | 'self-destructive';

export interface HarmfulObjectiveResult {
  flagged: boolean;
  category: HarmfulObjectiveCategory | null;
}

const PATTERNS: Array<{ category: HarmfulObjectiveCategory; pattern: RegExp }> = [
  // Harm to a specific other person
  { category: 'harm-to-other', pattern: /\bmanipulate\s+(?:my|his|her|their)\b/i },
  { category: 'harm-to-other', pattern: /\bget\s+revenge\s+on\b/i },
  { category: 'harm-to-other', pattern: /\bmake\s+(?:him|her|them)\s+(?:pay|suffer|regret)\b/i },
  { category: 'harm-to-other', pattern: /\bruin\s+(?:his|her|their|my\s+ex'?s?)\s+(?:life|reputation|career)\b/i },
  { category: 'harm-to-other', pattern: /\bcontrol\s+(?:my|his|her)\s+(?:partner|girlfriend|boyfriend|wife|husband|ex)\b/i },
  { category: 'harm-to-other', pattern: /\bstalk(?:ing)?\s+(?:my|him|her|them)\b/i },
  { category: 'harm-to-other', pattern: /\btrick\s+(?:him|her|them)\s+into\b/i },

  // Illegal or violent framing
  { category: 'illegal-or-violent', pattern: /\bcommit(?:ting)?\s+fraud\b/i },
  { category: 'illegal-or-violent', pattern: /\bhurt\s+(?:him|her|them|someone|people)\b/i },
  { category: 'illegal-or-violent', pattern: /\bget\s+a\s+weapon\s+to\b/i },
  { category: 'illegal-or-violent', pattern: /\blaunder\s+money\b/i },
  { category: 'illegal-or-violent', pattern: /\bbreak\s+into\b/i },

  // Self-destructive, framed as a goal ("no matter what," extreme dieting)
  { category: 'self-destructive', pattern: /\blose\s+weight\s+(?:as\s+fast\s+as\s+possible|no\s+matter\s+what)\b/i },
  { category: 'self-destructive', pattern: /\bstop\s+eating\s+(?:entirely|completely|altogether)\b/i },
  { category: 'self-destructive', pattern: /\bat\s+any\s+cost\b.{0,30}\b(?:weight|body|diet)\b|\b(?:weight|body|diet)\b.{0,30}\bat\s+any\s+cost\b/i },
  { category: 'self-destructive', pattern: /\bno\s+matter\s+what\s+it\s+takes\b.{0,30}\b(?:weight|thin|skinny)\b/i },
];

export function detectHarmfulObjective(text: string): HarmfulObjectiveResult {
  if (!text || !text.trim()) return { flagged: false, category: null };
  for (const { category, pattern } of PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, category };
    }
  }
  return { flagged: false, category: null };
}

/**
 * Ch.4's own prescribed tone: "Not with a cold refusal alone — with an
 * honest redirection, in the Game Master's caring voice from Book III
 * wherever appropriate, toward what might actually be underneath the
 * stated objective." Unlike the crisis protocol (Ch.3), which deliberately
 * drops ALL game framing, a declined objective is allowed to keep some of
 * that warmth — this isn't an emergency, it's a boundary.
 */
export const OBJECTIVE_DECLINE_COPY: Record<HarmfulObjectiveCategory, { acknowledgment: string; decline: string }> = {
  'harm-to-other': {
    acknowledgment:
      "It sounds like something with this person has really hurt you, and that's real.",
    decline:
      "I can't build a Campaign aimed at controlling, manipulating, or getting back at someone else, though — that's not a path I'm able to map out. What I can help with is a Campaign about you: what you want for yourself now, separate from them.",
  },
  'illegal-or-violent': {
    acknowledgment: "I hear that this matters a lot to you.",
    decline:
      "I'm not able to build a Campaign around something illegal or aimed at hurting someone, though. If there's a legitimate version of what you're actually after, I'd genuinely like to help with that instead.",
  },
  'self-destructive': {
    acknowledgment: "Wanting a real change is a completely fair thing to want.",
    decline:
      "I'm not able to map a Campaign around an extreme or 'at any cost' approach to your body, though — that's the kind of thing that needs a real doctor in the loop, not a Quest list. I'd be glad to help you build toward the same goal in a way that's actually sustainable.",
  },
};
