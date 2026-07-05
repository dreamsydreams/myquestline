import type { Campaign } from '../types/campaign';
import type { AvatarConfig } from '../types/avatar';
import { DEFAULT_AVATAR } from '../types/avatar';

/**
 * PHASE 5 FIX for the Phase 4 honesty note in engine/attributeTracking.ts:
 * that file said growth "only reflects this session — it resets on page
 * refresh" because nothing wrote state anywhere durable. There's still no
 * backend (Supabase/Firebase, per the project's zero-paid-services
 * constraint, isn't wired in) — so this uses the browser's own localStorage
 * as the zero-cost persistence layer. It's real persistence, not a fake:
 * a player's Camp, active Chapter, and full campaign history now survive a
 * refresh or a closed tab on the same device/browser.
 *
 * Honest limitation this DOESN'T fix, stated plainly: this is single-device,
 * single-browser storage. It won't follow a player to a new phone or a
 * different browser — that requires a real account + backend, which is a
 * future phase, not solved here. Clearing site data/localStorage will also
 * wipe it, same as it would for any local-only app.
 *
 * UX-PATCH: bumped to version 2 to add `playerProfile` (the avatar).
 * Old version-1 saves are discarded rather than partially migrated — this
 * is a small, low-stakes local save (not a real account), so a clean
 * "start fresh on avatar only" is simpler and safer than guessing at a
 * migration for one new optional field. Campaign progress itself is not
 * at stake here since this only affects saves from before Avatar existed.
 */

const STORAGE_KEY = 'questline:player-state';
const STORAGE_VERSION = 2 as const;

export interface PersistedPlayerState {
  version: typeof STORAGE_VERSION;
  currentCampaign: Campaign | null;
  currentChapterIndex: number;
  /** Completed campaigns, most recent first (Book IX Ch.3 needs the most
   * recent one by name; Ch.2's future Archive will want the full list). */
  campaignHistory: Campaign[];
  /** The player's own customizable character — persists independently of
   * any single Campaign. */
  playerProfile: AvatarConfig;
}

export function loadPersistedState(): PersistedPlayerState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return null;
    return parsed as PersistedPlayerState;
  } catch {
    // localStorage can throw (private/incognito mode in some browsers,
    // storage disabled by policy, corrupted JSON). Fail open to a fresh
    // session rather than crash the app over a lost save.
    return null;
  }
}

export const DEFAULT_PERSISTED_PROFILE = DEFAULT_AVATAR;

export function savePersistedState(state: PersistedPlayerState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — the current session still works
    // entirely in memory, it just won't survive a refresh. Not fatal,
    // and not worth interrupting the player over.
  }
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op — nothing to clean up if storage was never reachable
  }
}
