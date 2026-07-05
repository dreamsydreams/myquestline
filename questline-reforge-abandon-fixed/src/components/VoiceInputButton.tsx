import { Mic, Square } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface VoiceInputButtonProps {
  /** Appended by the caller to whatever the player has already typed, not
   * a replacement — switching between typing and talking mid-answer never
   * loses text already there. */
  onTranscript: (transcript: string) => void;
}

/**
 * A player's own voice filling the same textarea, not a separate voice
 * mode — Intake (Book II, Ch.2) stays a single conversational text flow
 * either way, since the transcript lands in the same editable field a
 * typed answer would. Renders nothing in browsers without support
 * (Firefox, mainly) rather than showing a control that doesn't work.
 *
 * Shows the remaining time once recording starts (see useSpeechToText's
 * maxDurationSeconds) so the 60-second cap is a visible, predictable part
 * of the UI rather than something that silently cuts a player off.
 */
export function VoiceInputButton({ onTranscript }: VoiceInputButtonProps) {
  const { isSupported, isListening, elapsedSeconds, maxDurationSeconds, start, stop } = useSpeechToText({
    onResult: onTranscript,
  });

  if (!isSupported) return null;

  const remaining = Math.max(0, maxDurationSeconds - elapsedSeconds);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={isListening ? stop : start}
        aria-label={isListening ? 'Stop recording' : 'Answer by voice instead'}
        title={isListening ? 'Stop recording' : 'Answer by voice instead'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-95 ${
          isListening
            ? 'animate-pulse border-camp-ember bg-camp-ember/20 text-camp-ember'
            : 'border-camp-night-soft bg-camp-night-soft/60 text-camp-parchment-dim hover:border-camp-ember/50'
        }`}
      >
        {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      {isListening && (
        <span className="text-[10px] tabular-nums text-camp-parchment-dim">0:{String(remaining).padStart(2, '0')}</span>
      )}
    </div>
  );
}
