import { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import { Camp } from './screens/Camp';
import { Intake } from './screens/Intake';
import { PathSelection } from './screens/PathSelection';
import { JourneyReveal } from './screens/JourneyReveal';
import { CharacterSheet } from './screens/CharacterSheet';
import { ChapterCompletion } from './screens/ChapterCompletion';
import { Backpack } from './screens/Backpack';
import { Map } from './screens/Map';
import { ReForge } from './screens/ReForge';
import { ReForgeReveal } from './screens/ReForgeReveal';
import { AbandonQuest } from './screens/AbandonQuest';
import { ComingSoon } from './screens/ComingSoon';
import { Navigation } from './components/Navigation';
import type { Screen } from './components/Navigation';
import { DevTestPanel } from './components/DevTestPanel';
import { ThinkingScreen } from './components/ThinkingScreen';
import { CrisisResponse } from './components/CrisisResponse';
import { ObjectiveDeclineResponse } from './components/ObjectiveDeclineResponse';
import { SafetyLogViewer } from './components/SafetyLogViewer';
import { TERMS } from './constants/language';
import { MOCK_CAMPAIGN, FRESH_CAMPAIGN } from './data/mockPlayerState';
import type { PlayerCampState, EvidencePath, Campaign, Chapter, Mission } from './types/campaign';
import type { IntakeAnswers } from './types/intake';
import type { AvatarConfig } from './types/avatar';
import { DEFAULT_AVATAR } from './types/avatar';
import { campaignGenerationEngine } from './engine/campaignGenerationEngine';
import { loadPersistedState, savePersistedState } from './lib/persistence';

type View =
  | Screen
  | 'intake'
  | 'path-selection'
  | 'journey-reveal'
  | 'generating'
  | 'chapter-complete'
  | 'archive'
  | 'reforge'
  | 'reforge-reveal'
  | 'abandon'
  | 'dev-preview-crisis'
  | 'dev-preview-objective-decline';

/**
 * FIX FLAGGED BEFORE FIRST REAL DEPLOY: DevTestPanel.tsx's own doc comment
 * says "NOT PLAYER-FACING," but nothing before this actually enforced
 * that — it rendered unconditionally in every build, including a real
 * production `npm run build`. That was fine while this only ever ran
 * locally via `npm run dev`, but the moment it's on a public Netlify URL,
 * anyone with the link could hit "reset all" or read another visitor's
 * local safety log entries meant for solo-builder review, not player use.
 *
 * `import.meta.env.DEV` is true for `npm run dev` and false for any real
 * build (including Netlify's), so the panel disappears by default the
 * moment this is actually deployed. If you still want it visible on a
 * given Netlify deploy while this is in active testing (not yet in front
 * of real players), set an environment variable in Netlify's build
 * settings: VITE_SHOW_DEV_PANEL=true. Unset it (or set to anything else)
 * once real players might see the URL.
 */
const SHOW_DEV_PANEL = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_PANEL === 'true';

/** A Chapter is "done" when every Mission in it is complete and its Boss
 * Battle (if it has one) is defeated. Book II Ch.4/Ch.5 — this is the same
 * definition the Character Sheet's growth math already assumes implicitly. */
function isChapterFullyComplete(chapter: Chapter): boolean {
  const allMissionsDone = chapter.quests.every((q) => q.missions.every((m) => m.isComplete));
  const bossHandled = !chapter.bossBattle || chapter.bossBattle.isDefeated;
  return allMissionsDone && bossHandled;
}

/** Keeps Quest.isComplete honest and in sync with its Missions — this was
 * tracked in the data model since Phase 3 but nothing ever actually set it. */
function withRecomputedQuestCompletion(chapter: Chapter): Chapter {
  return {
    ...chapter,
    quests: chapter.quests.map((q) => ({
      ...q,
      isComplete: q.missions.length > 0 && q.missions.every((m) => m.isComplete),
    })),
  };
}

/** Boss Battle redesign: for a 'quick' Boss Battle, today's Missions ARE
 * the fight — there's no separate manual self-report. Defeat is derived
 * live from mission completion every time a Mission is toggled, in either
 * direction: check the last box and it becomes Defeated on its own;
 * uncheck one afterward and it honestly un-defeats, since the thing it
 * stood for (finishing today's steps) is no longer true. 'sustained'
 * bosses are untouched here — their isDefeated only ever changes via the
 * explicit self-report in handleDefeatBoss, never inferred from checkboxes. */
function withRecomputedQuickBossDefeat(chapter: Chapter): Chapter {
  if (!chapter.bossBattle || chapter.bossBattle.pacing !== 'quick') return chapter;
  const allMissionsDone = chapter.quests.every((q) => q.missions.every((m) => m.isComplete));
  if (chapter.bossBattle.isDefeated === allMissionsDone) return chapter;
  return { ...chapter, bossBattle: { ...chapter.bossBattle, isDefeated: allMissionsDone } };
}

function App() {
  // Lazy-init from localStorage (src/lib/persistence.ts) so a refresh no
  // longer loses progress — the Phase 4 roadmap's stated limitation.
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(
    () => loadPersistedState()?.currentCampaign ?? null
  );
  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    () => loadPersistedState()?.currentChapterIndex ?? 0
  );
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>(
    () => loadPersistedState()?.campaignHistory ?? []
  );
  const [avatar, setAvatar] = useState<AvatarConfig>(
    () => loadPersistedState()?.playerProfile ?? DEFAULT_AVATAR
  );

  const [view, setView] = useState<View>('camp');
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeAnswers | null>(null);
  const [availablePaths, setAvailablePaths] = useState<EvidencePath[]>([]);
  // Which chapter the ceremony screen is currently celebrating, and whether
  // that chapter was the campaign's last one.
  const [ceremonyChapterIndex, setCeremonyChapterIndex] = useState<number | null>(null);
  const [ceremonyIsCampaignComplete, setCeremonyIsCampaignComplete] = useState(false);
  // Phase 6 dev-only: safety log overlay visibility (Book VIII Ch.7).
  const [showSafetyLog, setShowSafetyLog] = useState(false);

  // Persist on every change relevant to a returning session. Small data,
  // no debounce needed — see src/lib/persistence.ts for the honest
  // limitations of this approach (single device/browser, no account sync).
  useEffect(() => {
    savePersistedState({
      version: 2,
      currentCampaign,
      currentChapterIndex,
      campaignHistory,
      playerProfile: avatar,
    });
  }, [currentCampaign, currentChapterIndex, campaignHistory, avatar]);

  const playerState: PlayerCampState = currentCampaign
    ? {
        status: 'active-journey',
        chapter: currentCampaign.chapters[currentChapterIndex],
        nextChapter: currentCampaign.chapters[currentChapterIndex + 1],
      }
    : campaignHistory.length > 0
      ? { status: 'between-campaigns', mostRecentCampaign: campaignHistory[0] }
      : { status: 'new-player' };

  /** Applies a chapter-level mutation, then checks whether that chapter just
   * transitioned from incomplete to complete — if so, routes to the
   * ceremony instead of silently updating the Camp underneath the player. */
  function applyChapterUpdate(mutate: (chapter: Chapter) => Chapter) {
    if (!currentCampaign) return;
    const chapterBefore = currentCampaign.chapters[currentChapterIndex];
    const wasComplete = isChapterFullyComplete(chapterBefore);

    const mutatedChapter = withRecomputedQuickBossDefeat(withRecomputedQuestCompletion(mutate(chapterBefore)));
    const nowComplete = isChapterFullyComplete(mutatedChapter);
    const justCompleted = !wasComplete && nowComplete;

    const chapters = currentCampaign.chapters.map((c, idx) =>
      idx === currentChapterIndex ? { ...mutatedChapter, isComplete: nowComplete } : c
    );
    const updatedCampaign = { ...currentCampaign, chapters };
    setCurrentCampaign(updatedCampaign);

    if (justCompleted) {
      const isLastChapter = currentChapterIndex === updatedCampaign.chapters.length - 1;
      setCeremonyChapterIndex(currentChapterIndex);
      setCeremonyIsCampaignComplete(isLastChapter);
      setView('chapter-complete');
    }
  }

  function handleToggleMission(missionId: string) {
    applyChapterUpdate((chapter) => {
      const toggle = (m: Mission) => (m.id === missionId ? { ...m, isComplete: !m.isComplete } : m);
      return {
        ...chapter,
        quests: chapter.quests.map((q) => ({ ...q, missions: q.missions.map(toggle) })),
      };
    });
  }

  /** Boss Battle redesign: the honest self-report, only ever wired up in
   * Camp.tsx for 'sustained' Boss Battles now — 'quick' ones are handled
   * automatically by withRecomputedQuickBossDefeat above. */
  function handleDefeatBoss() {
    applyChapterUpdate((chapter) =>
      chapter.bossBattle ? { ...chapter, bossBattle: { ...chapter.bossBattle, isDefeated: true } } : chapter
    );
  }

  /** Continuing out of the ceremony: either move into the next Chapter, or
   * if that was the campaign's last Chapter, retire it into history and let
   * the Camp fall through to the Book IX Ch.3 Empty Camp State. */
  function handleContinueFromCeremony() {
    if (currentCampaign && ceremonyIsCampaignComplete) {
      const finishedCampaign: Campaign = { ...currentCampaign, completedAt: new Date().toISOString() };
      setCampaignHistory((prev) => [finishedCampaign, ...prev]);
      setCurrentCampaign(null);
      setCurrentChapterIndex(0);
    } else if (ceremonyChapterIndex !== null) {
      setCurrentChapterIndex(ceremonyChapterIndex + 1);
    }
    setCeremonyChapterIndex(null);
    setView('camp');
  }

  /** "Go Home" from the ceremony: deliberately does NOT advance into the
   * next Chapter. The just-finished Chapter stays as the active one
   * (already flagged isComplete by applyChapterUpdate) and the player
   * lands on the Character overview instead — a real look at progress so
   * far, not just today's screen. They start the next Chapter later, on
   * their own initiative, via the "Begin Chapter N" prompt Camp shows for
   * a chapter that's done but not yet advanced past (see handleAdvanceChapter
   * below, used from that prompt). Only ever offered for a non-final
   * Chapter — ChapterCompletion.tsx hides this button when the campaign
   * itself just finished, so there's always a next Chapter waiting here. */
  function handleGoHomeFromCeremony() {
    setCeremonyChapterIndex(null);
    setView('character');
  }

  /** Shared by both exits above: the actual advance into the next Chapter.
   * Continue calls this immediately; Camp's "Begin Chapter N" prompt calls
   * it later, whenever the player comes back ready after "Go Home." */
  function handleAdvanceChapter() {
    setCurrentChapterIndex((idx) => idx + 1);
  }

  function handleBeginAdventure() {
    setView('intake');
  }

  function handleOpenArchive() {
    setView('archive');
  }

  function handleOpenReForge() {
    setView('reforge');
  }

  function handleOpenAbandon() {
    setView('abandon');
  }

  /** Book II Ch.8 — applies the Re-Forge via the engine, then hands off to
   * ReForgeReveal rather than dropping straight back into Camp. Gap flagged
   * during review: a Re-Forge that actually changes future Chapters used to
   * happen silently — the player just noticed (or didn't) that the trail
   * looked different. See campaignGenerationEngine.reforgeCampaign's own
   * doc comment for the exact, concrete rule on what gets kept vs.
   * regenerated. */
  async function handleReForgeSubmit(answers: IntakeAnswers) {
    if (!currentCampaign) return;
    setView('generating');
    const reforged = await campaignGenerationEngine.reforgeCampaign(currentCampaign, answers, currentChapterIndex);
    setCurrentCampaign(reforged);
    setIntakeAnswers(answers);
    setView('reforge-reveal');
  }

  /** Book I Ch.9 / Book IX Ch.2 — retires the current Campaign into
   * history, honestly marked as abandoned rather than completed. Nothing
   * about XP, Attributes, or Relics changes — those are all computed live
   * from the Campaign's own data (src/engine/attributeTracking.ts,
   * src/engine/relics.ts), which travels into history untouched. */
  function handleAbandonConfirm() {
    if (!currentCampaign) return;
    const abandoned: Campaign = { ...currentCampaign, abandonedAt: new Date().toISOString() };
    setCampaignHistory((prev) => [abandoned, ...prev]);
    setCurrentCampaign(null);
    setCurrentChapterIndex(0);
    setView('camp');
  }

  async function handleIntakeComplete(answers: IntakeAnswers) {
    setIntakeAnswers(answers);
    setView('generating');
    const paths = await campaignGenerationEngine.generatePaths(answers);
    setAvailablePaths(paths);
    setView('path-selection');
  }

  async function handlePathChosen(path: EvidencePath) {
    if (!intakeAnswers) return;
    setView('generating');
    const campaign = await campaignGenerationEngine.buildCampaign(intakeAnswers, path);
    setCurrentCampaign(campaign);
    setCurrentChapterIndex(0);
    // UX-FIX: previously dropped straight into the live Camp UI right after
    // generation, with no moment to actually take in the character or the
    // path ahead. JourneyReveal now sits between the two; Camp itself is
    // unchanged once the player actually begins.
    setView('journey-reveal');
  }

  async function handleDevQuickGenerate() {
    const testAnswers: IntakeAnswers = {
      objective: 'I want to become a filmmaker',
      timeAvailability: 'alongside',
      experience: 'Some short films made on my phone',
      constraint: '',
    };
    setIntakeAnswers(testAnswers);
    setView('generating');
    const paths = await campaignGenerationEngine.generatePaths(testAnswers);
    const campaign = await campaignGenerationEngine.buildCampaign(testAnswers, paths[0]);
    setCurrentCampaign(campaign);
    setCurrentChapterIndex(0);
    setView('camp');
  }

  function handleLoadMockCampaign() {
    // Loads a campaign with Chapter 1 already completed, so the Character
    // Sheet has real cross-chapter data to demonstrate immediately.
    setCurrentCampaign(MOCK_CAMPAIGN);
    setCurrentChapterIndex(1);
    setView('camp');
  }

  /** Dev-only shortcut: MOCK_CAMPAIGN's Chapter 2 (index 1) is already its
   * last Chapter, so this jumps straight to Re-Forge's form with that
   * loaded — one click from there ("See what this changes") reaches the
   * "nothing left to reshape" confirm-screen branch that's otherwise
   * awkward to reach on purpose. */
  function handleDevPreviewReForgeLastChapter() {
    setCurrentCampaign(MOCK_CAMPAIGN);
    setCurrentChapterIndex(1);
    setView('reforge');
  }

  /** Dev-only shortcut: jumps straight to the Abandon Quest reflect screen
   * with a Campaign that has zero completed Chapters, zero XP, and zero
   * Relics — the "abandoned five minutes in" edge case for that screen's
   * copy, otherwise awkward to reach without immediately abandoning a
   * freshly generated campaign. */
  function handleDevPreviewAbandonZeroStats() {
    setCurrentCampaign(FRESH_CAMPAIGN);
    setCurrentChapterIndex(0);
    setView('abandon');
  }

  /** Dev-only shortcut: instantly finishes every Mission and Boss Battle in
   * the current Chapter, to test the ceremony without manually clicking
   * through each one. Not a real gameplay path. */
  function handleDevCompleteChapter() {
    applyChapterUpdate((chapter) => ({
      ...chapter,
      quests: chapter.quests.map((q) => ({
        ...q,
        missions: q.missions.map((m) => ({ ...m, isComplete: true })),
      })),
      bossBattle: chapter.bossBattle ? { ...chapter.bossBattle, isDefeated: true } : undefined,
    }));
  }

  /** Dev-only shortcut: retires the mock campaign into history immediately,
   * so the Book IX Ch.3 Empty Camp State can be tested without manually
   * finishing two whole Chapters first. */
  function handleDevSimulateCampaignComplete() {
    const finished: Campaign = {
      ...MOCK_CAMPAIGN,
      chapters: MOCK_CAMPAIGN.chapters.map((c) => ({
        ...c,
        isComplete: true,
        bossBattle: c.bossBattle ? { ...c.bossBattle, isDefeated: true } : undefined,
        quests: c.quests.map((q) => ({
          ...q,
          isComplete: true,
          missions: q.missions.map((m) => ({ ...m, isComplete: true })),
        })),
      })),
      completedAt: new Date().toISOString(),
    };
    setCampaignHistory((prev) => [finished, ...prev]);
    setCurrentCampaign(null);
    setCurrentChapterIndex(0);
    setView('camp');
  }

  function handleDevResetAll() {
    setCurrentCampaign(null);
    setCurrentChapterIndex(0);
    setCampaignHistory([]);
    setView('camp');
  }

  function handleExitToCamp() {
    setView('camp');
  }

  /** Phase 6 dev-only: previews the two safety screens directly, so they
   * can be visually checked without typing a real trigger phrase into
   * Intake each time. Not a real gameplay path — same spirit as the other
   * Dev Test Panel shortcuts. */
  function handleDevTestCrisisResponse() {
    setView('dev-preview-crisis');
  }

  function handleDevTestObjectiveDecline() {
    setView('dev-preview-objective-decline');
  }

  function handleViewSafetyLog() {
    setShowSafetyLog(true);
  }

  // FIX: players had no obvious, universal way back to an overview of
  // their account/progress. This small header renders on every screen
  // except the Chapter Completion ceremony (deliberately uninterruptible
  // — Book I/III's ceremony shouldn't be skippable mid-celebration) and the
  // brief loading screen (nothing to navigate away from). A single,
  // unmistakable house icon always means the same thing: take me to the
  // Character overview — all chapters, real attribute totals, progress so
  // far — not just "today's screen" (that's Camp, still one tap away via
  // the bottom Navigation bar's own "Camp" tab).
  const showHomeHeader = view !== 'chapter-complete' && view !== 'generating';

  return (
    <div className="flex h-full flex-col">
      {showHomeHeader && (
        <header className="flex items-center border-b border-camp-night-soft bg-camp-night/95 px-4 py-2 backdrop-blur">
          <button
            onClick={() => setView('character')}
            aria-label={`Home (${TERMS.profile})`}
            title={`Home (${TERMS.profile})`}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-camp-parchment-dim transition-all duration-150 hover:text-camp-parchment active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
        </header>
      )}
      <main className="flex-1 overflow-y-auto">
        {view === 'intake' && (
          <Intake onComplete={handleIntakeComplete} onExitToCamp={handleExitToCamp} />
        )}
        {view === 'generating' && <ThinkingScreen />}
        {view === 'path-selection' && intakeAnswers && (
          <PathSelection
            objective={intakeAnswers.objective}
            paths={availablePaths}
            onChoosePath={handlePathChosen}
            onBackToCamp={() => setView('camp')}
          />
        )}
        {view === 'journey-reveal' && currentCampaign && (
          <JourneyReveal
            campaign={currentCampaign}
            avatar={avatar}
            onBeginJourney={() => setView('camp')}
            onBackToCamp={() => setView('camp')}
          />
        )}
        {view === 'chapter-complete' && currentCampaign && ceremonyChapterIndex !== null && (
          <ChapterCompletion
            campaign={currentCampaign}
            chapterIndex={ceremonyChapterIndex}
            isCampaignComplete={ceremonyIsCampaignComplete}
            onContinue={handleContinueFromCeremony}
            onGoHome={handleGoHomeFromCeremony}
          />
        )}
        {view === 'dev-preview-crisis' && (
          <CrisisResponse onReturnToCamp={() => setView('camp')} />
        )}
        {view === 'dev-preview-objective-decline' && (
          <ObjectiveDeclineResponse
            category="harm-to-other"
            onTryDifferentObjective={() => setView('camp')}
            onExitToCamp={() => setView('camp')}
          />
        )}
        {view === 'reforge' && currentCampaign && (
          <ReForge
            campaign={currentCampaign}
            currentChapterIndex={currentChapterIndex}
            onReForge={handleReForgeSubmit}
            onCancel={() => setView('backpack')}
            onSwitchToAbandon={() => setView('abandon')}
          />
        )}
        {view === 'reforge-reveal' && currentCampaign && (
          <ReForgeReveal
            campaign={currentCampaign}
            keptThroughIndex={currentChapterIndex}
            onContinue={() => setView('camp')}
          />
        )}
        {view === 'abandon' && currentCampaign && (
          <AbandonQuest
            campaign={currentCampaign}
            onConfirmAbandon={handleAbandonConfirm}
            onCancel={() => setView('backpack')}
            onSwitchToReForge={() => setView('reforge')}
          />
        )}
        {view === 'archive' && (
          // Book IX Ch.2's real Archive is deliberately deferred — see
          // PHASE_ROADMAP.md. This is an honest placeholder, not a fake
          // feature, reachable from the Empty Camp State's second button.
          // No bottom Navigation renders on this route (it isn't a real nav
          // destination yet), so it needs its own way back to Camp.
          <div className="flex min-h-full flex-col items-center justify-center gap-6">
            <ComingSoon label={TERMS.archive} />
            <button
              onClick={() => setView('camp')}
              className="rounded-full border border-camp-parchment-dim/40 px-6 py-2 text-sm font-medium text-camp-parchment transition-transform duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Back to {TERMS.dashboard}
            </button>
          </div>
        )}
        {view === 'camp' && (
          <Camp
            state={playerState}
            onToggleMission={handleToggleMission}
            onBeginAdventure={handleBeginAdventure}
            onDefeatBoss={handleDefeatBoss}
            onOpenArchive={handleOpenArchive}
            onAdvanceChapter={handleAdvanceChapter}
          />
        )}
        {view === 'character' && <CharacterSheet campaign={currentCampaign} avatar={avatar} />}
        {view === 'backpack' && (
          <Backpack
            avatar={avatar}
            onChangeAvatar={setAvatar}
            currentCampaign={currentCampaign}
            campaignHistory={campaignHistory}
            onResetAll={handleDevResetAll}
            onOpenReForge={handleOpenReForge}
            onOpenAbandon={handleOpenAbandon}
          />
        )}
        {view === 'map' && (
          <Map
            currentCampaign={currentCampaign}
            currentChapterIndex={currentChapterIndex}
            campaignHistory={campaignHistory}
          />
        )}
      </main>

      {(view === 'camp' || view === 'character' || view === 'backpack' || view === 'map') && (
        <Navigation current={view as Screen} onNavigate={setView} />
      )}

      {SHOW_DEV_PANEL && (
        <DevTestPanel
          onSetNewPlayer={handleDevResetAll}
          onQuickGenerate={handleDevQuickGenerate}
          onLoadMockCampaign={handleLoadMockCampaign}
          onCompleteChapterNow={handleDevCompleteChapter}
          onSimulateCampaignComplete={handleDevSimulateCampaignComplete}
          onTestCrisisResponse={handleDevTestCrisisResponse}
          onTestObjectiveDecline={handleDevTestObjectiveDecline}
          onViewSafetyLog={handleViewSafetyLog}
          onPreviewReForgeLastChapter={handleDevPreviewReForgeLastChapter}
          onPreviewAbandonZeroStats={handleDevPreviewAbandonZeroStats}
        />
      )}
      {SHOW_DEV_PANEL && showSafetyLog && (
        <SafetyLogViewer onClose={() => setShowSafetyLog(false)} />
      )}
    </div>
  );
}

export default App;
