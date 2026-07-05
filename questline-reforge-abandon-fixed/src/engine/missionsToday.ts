import type { Chapter, Mission } from '../types/campaign';

/**
 * UX-FIX, FLAGGED CLEARLY: `Chapter.missionsToday` used to be a value
 * generated once, at campaign-creation time, with the generation engine
 * only ever filling it in for Chapter 1 (`index === 0 ? ... : []`).
 * Nothing ever recomputed it as the player advanced into later Chapters,
 * so Chapter 2 (and every Chapter after it) silently rendered an empty
 * "Today" section forever — a real bug, not a design choice, reported by
 * an actual player.
 *
 * The fix: stop storing "today's missions" as data at all. Compute it
 * live, every render, from the one real source of truth (`Chapter.quests`,
 * Book II Ch.1's hierarchy) — so there is no second copy that can ever go
 * stale again. This is the only place that decides what counts as
 * "Today": the missions belonging to the first Quest that isn't fully
 * complete yet. Once every Quest in a Chapter is done, this correctly
 * returns an empty list — Camp.tsx is responsible for showing that as "all
 * done, the Boss Battle is what's left" rather than a confusing blank
 * section.
 */
export function getTodaysMissions(chapter: Pick<Chapter, 'quests'>): Mission[] {
  const activeQuest = chapter.quests.find((q) => !q.missions.every((m) => m.isComplete));
  return activeQuest ? activeQuest.missions : [];
}
