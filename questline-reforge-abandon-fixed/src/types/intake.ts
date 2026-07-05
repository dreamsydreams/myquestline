/**
 * Source: Book II, Chapter 2 — "From Words to Worlds (The Intake)"
 *
 * What Intake must extract by the end (per Ch.2): the core objective, time
 * realistically available, existing skills/experience, and personality-
 * relevant constraints. Financial resources are deliberately NOT a fixed
 * question here — Ch.2 explicitly forbids asking for information a path
 * doesn't need yet, and no path exists until Phase 3's branching (Book II
 * Ch.3) is built. Emotional context is never actively extracted (Ch.2) —
 * there is no dedicated field for it; it's only ever what a player
 * volunteers unprompted in a free-text answer.
 */

export type IntakeStep = 'objective' | 'time' | 'experience' | 'constraint' | 'confirm';

export interface IntakeAnswers {
  objective: string;
  timeAvailability: 'alongside' | 'main-thing' | 'not-sure' | null;
  experience: string;
  constraint: string;
}

export const EMPTY_INTAKE_ANSWERS: IntakeAnswers = {
  objective: '',
  timeAvailability: null,
  experience: '',
  constraint: '',
};
