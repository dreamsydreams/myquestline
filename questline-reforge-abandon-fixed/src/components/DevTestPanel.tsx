/**
 * NOT PLAYER-FACING. This panel exists purely so you (and future engineers)
 * can test app states locally without a real backend. It is styled
 * deliberately differently from the rest of the app (plain gray, monospace,
 * "DEV" label) specifically so it never gets mistaken for real product UI —
 * Book I, Ch.9's discipline says real software language should never leak
 * into the world, and the inverse holds too: this tool should never look
 * like it belongs to the world.
 */
interface DevTestPanelProps {
  onSetNewPlayer: () => void;
  onQuickGenerate: () => void;
  onLoadMockCampaign: () => void;
  /** Phase 5: instantly finishes the current Chapter to test the ceremony. */
  onCompleteChapterNow: () => void;
  /** Phase 5: retires the mock campaign into history to test the Book IX
   * Ch.3 Empty Camp State without manually finishing two whole Chapters. */
  onSimulateCampaignComplete: () => void;
  /** Phase 6: preview the Ch.3 crisis protocol screen without needing to
   * type a real disclosure into Intake. */
  onTestCrisisResponse: () => void;
  /** Phase 6: preview the Ch.4 harmful-objective decline screen the same
   * way. */
  onTestObjectiveDecline: () => void;
  /** Phase 6: open the local safety log — see SafetyLogViewer.tsx. */
  onViewSafetyLog: () => void;
  /** Post-Phase-6 patch: jump straight to Re-Forge with a Campaign already
   * on its last Chapter, to test the "nothing left to reshape" branch. */
  onPreviewReForgeLastChapter: () => void;
  /** Post-Phase-6 patch: jump straight to Abandon Quest's reflect screen
   * with a zero-progress Campaign, to test the zero-stat copy branch. */
  onPreviewAbandonZeroStats: () => void;
}

export function DevTestPanel({
  onSetNewPlayer,
  onQuickGenerate,
  onLoadMockCampaign,
  onCompleteChapterNow,
  onSimulateCampaignComplete,
  onTestCrisisResponse,
  onTestObjectiveDecline,
  onViewSafetyLog,
  onPreviewReForgeLastChapter,
  onPreviewAbandonZeroStats,
}: DevTestPanelProps) {
  return (
    <div className="fixed bottom-16 right-2 z-50 flex flex-col gap-1 rounded border border-gray-600 bg-gray-900 p-2 font-mono text-[10px] text-gray-300 shadow-lg">
      <span className="text-gray-500">DEV TEST PANEL (not player-facing)</span>
      <button
        onClick={onSetNewPlayer}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        reset all (clears saved state → new-player)
      </button>
      <button
        onClick={onQuickGenerate}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        quick-generate (skip Intake typing)
      </button>
      <button
        onClick={onLoadMockCampaign}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        load mock (Ch.1 done — test Character Sheet)
      </button>
      <button
        onClick={onCompleteChapterNow}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        finish current chapter now (test ceremony)
      </button>
      <button
        onClick={onSimulateCampaignComplete}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        simulate whole campaign done (test Empty Camp)
      </button>
      <span className="mt-1 text-gray-500">— safety (Book VIII) —</span>
      <button
        onClick={onTestCrisisResponse}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        preview crisis response (Ch.3)
      </button>
      <button
        onClick={onTestObjectiveDecline}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        preview objective decline (Ch.4)
      </button>
      <button
        onClick={onViewSafetyLog}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        view safety log (Ch.7)
      </button>
      <span className="mt-1 text-gray-500">— re-forge / abandon —</span>
      <button
        onClick={onPreviewReForgeLastChapter}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        re-forge on final chapter (test "nothing to reshape")
      </button>
      <button
        onClick={onPreviewAbandonZeroStats}
        className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
      >
        abandon w/ zero stats (test zero-stat copy)
      </button>
    </div>
  );
}
