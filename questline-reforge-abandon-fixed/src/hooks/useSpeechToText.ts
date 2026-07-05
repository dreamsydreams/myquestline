import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechToTextOptions {
  /** Called once with the finished transcript when the player stops
   * talking (or taps stop, or the max duration is hit). This hook never
   * submits anything on its own — it only hands text back to whatever
   * textarea it's wired to, same as if the player had typed it, so they
   * can still read and edit it before continuing. */
  onResult: (transcript: string) => void;
  /** Hard cap on a single recording, in seconds. Default 60 — see the
   * bug note below for why this exists as an explicit, predictable limit
   * rather than whatever the browser happens to do on its own. */
  maxDurationSeconds?: number;
}

interface UseSpeechToTextResult {
  /** False in browsers without SpeechRecognition support (Firefox, mainly)
   * — callers should render nothing rather than a broken control. */
  isSupported: boolean;
  isListening: boolean;
  /** Seconds elapsed in the current recording, for an optional visible
   * countdown/progress indicator. 0 when not listening. */
  elapsedSeconds: number;
  maxDurationSeconds: number;
  start: () => void;
  stop: () => void;
}

/**
 * Thin wrapper around the browser's built-in Web Speech API. Deliberately
 * not a paid transcription service (e.g. Whisper via API) — this runs
 * entirely through the browser's own speech recognition, zero cost, no
 * server call, no API key, consistent with the project's zero-paid-
 * services constraint. Chrome's implementation does send audio to Google's
 * servers to do the actual transcription (it isn't fully on-device), but
 * there's no cost or account involved on either side.
 *
 * BUG FIX (reported by a real player: "recording cuts me off mid-sentence,
 * like I can only say a paragraph"): the previous version set
 * `continuous = false`, which tells the browser to stop listening the
 * moment it detects the player has paused speaking at all — mid-sentence
 * pauses (breathing, thinking of the next word) got treated as "done."
 * That's the exact cutoff being reported, not a fixed time limit.
 *
 * Fix: `continuous = true` so pauses don't end the session, plus
 * `interimResults = true` so partial speech is captured continuously
 * rather than only at the very end. Chrome's `continuous` mode can still
 * fire `onend` on its own after a while (a known browser quirk, not
 * something this code controls) — so `onend` now auto-restarts
 * recognition transparently instead of silently going quiet, unless the
 * player explicitly stopped it or the max duration was reached. The
 * explicit `maxDurationSeconds` (default 60s) is a predictable, visible
 * limit the player can see coming, rather than an invisible browser
 * timeout that looks like a bug.
 */
export function useSpeechToText({
  onResult,
  maxDurationSeconds = 60,
}: UseSpeechToTextOptions): UseSpeechToTextResult {
  const [isListening, setIsListening] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const stoppedIntentionallyRef = useRef(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const Ctor =
    typeof window !== 'undefined' ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;
  const isSupported = Boolean(Ctor);

  const clearTick = useCallback(() => {
    if (tickIntervalRef.current !== null) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTick();
    setIsListening(false);
    setElapsedSeconds(0);
    const transcript = finalTranscriptRef.current.trim();
    finalTranscriptRef.current = '';
    if (transcript) onResult(transcript);
  }, [clearTick, onResult]);

  const stop = useCallback(() => {
    stoppedIntentionallyRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Ctor || isListening) return;

    finalTranscriptRef.current = '';
    stoppedIntentionallyRef.current = false;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      // Only the finalized results get appended permanently — interim
      // results are provisional and get re-sent (revised) by the browser
      // until finalized, so accumulating those too would duplicate text.
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${result[0].transcript}`.trim();
        }
      }
    };

    recognition.onerror = () => {
      stoppedIntentionallyRef.current = true;
      finish();
    };

    recognition.onend = () => {
      // Browsers (Chrome especially) can end a "continuous" session on
      // their own well before the player is done. If the player didn't
      // ask to stop and we haven't hit the max duration, transparently
      // start a fresh session and keep the transcript accumulated so far
      // — from the player's perspective, recording just keeps going.
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      if (!stoppedIntentionallyRef.current && elapsed < maxDurationSeconds) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to finishing if an immediate restart fails.
        }
      }
      finish();
    };

    recognitionRef.current = recognition;
    startedAtRef.current = Date.now();
    recognition.start();
    setIsListening(true);
    setElapsedSeconds(0);

    tickIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= maxDurationSeconds) {
        stop();
      }
    }, 500);
  }, [Ctor, isListening, finish, maxDurationSeconds, stop]);

  useEffect(() => clearTick, [clearTick]);

  return { isSupported, isListening, elapsedSeconds, maxDurationSeconds, start, stop };
}
