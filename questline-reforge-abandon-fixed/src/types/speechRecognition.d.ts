/**
 * Minimal ambient types for the Web Speech API's `SpeechRecognition`
 * interface. Not included in TypeScript's built-in DOM lib because it was
 * never finalized as a web standard — Chrome, Edge, and Safari ship a
 * vendor implementation; Firefox doesn't implement it at all. Feature
 * detection at runtime (`useSpeechToText`) is what actually decides
 * whether this is usable, this file only satisfies the compiler.
 */

interface SpeechRecognitionResult {
  readonly [index: number]: { transcript: string };
  readonly length: number;
  /** True once the browser has finalized this result and won't revise it
   * further — needed to accumulate a continuous-mode transcript without
   * duplicating still-being-refined interim text. */
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  /** Index into `results` where this event's new/changed results start —
   * lets a continuous session process only what's new each time. */
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
