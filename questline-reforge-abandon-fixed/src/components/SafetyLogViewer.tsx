import { useState } from 'react';
import { getSafetyLog, clearSafetyLog } from '../safety/safetyLog';

/**
 * Source: Book VIII, Chapter 7 — "Escalation, Logging & Human Review"
 *
 * NOT PLAYER-FACING, same discipline as DevTestPanel.tsx. This IS, quite
 * literally, the "human review" process Ch.7 requires at solo-builder
 * scale: there is no dashboard, no ops team, no alerting pipeline — there
 * is a person opening this panel and reading what got flagged. That's an
 * honest minimum, not a placeholder for a realer thing that secretly
 * exists elsewhere.
 *
 * Shows category + timestamp + which Intake step, never the player's raw
 * text — see safety/safetyLog.ts for why that's a deliberate privacy
 * choice, not an oversight.
 */
export function SafetyLogViewer({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState(() => getSafetyLog());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 font-mono text-xs">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 overflow-hidden rounded border border-gray-600 bg-gray-900 p-3 text-gray-300">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">
            SAFETY LOG (dev-only, local to this browser — Book VIII Ch.7)
          </span>
          <button onClick={onClose} className="rounded bg-gray-800 px-2 py-1 hover:bg-gray-700">
            close
          </button>
        </div>
        <p className="text-gray-500">
          {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}. No raw
          player text is stored, only category + step, by design.
        </p>
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-gray-600">Nothing logged yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500">
                  <th className="pr-2">when</th>
                  <th className="pr-2">type</th>
                  <th className="pr-2">category</th>
                  <th>step</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-gray-800">
                    <td className="pr-2 py-1">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="pr-2 py-1">{e.type}</td>
                    <td className="pr-2 py-1">{e.category}</td>
                    <td className="py-1">{e.intakeStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <button
          onClick={() => {
            clearSafetyLog();
            setEntries([]);
          }}
          className="rounded bg-gray-800 px-2 py-1 text-left hover:bg-gray-700"
        >
          clear log
        </button>
      </div>
    </div>
  );
}
