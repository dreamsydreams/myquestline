/**
 * Document upload for Intake — a third way to answer, alongside typing and
 * voice (VoiceInputButton). This does NOT understand a freeform document
 * the way an AI reasoning about it would; splitting an arbitrary document
 * into "which part is the goal vs. experience vs. constraint" is a real
 * language-understanding task, same wall as the campaign generation gap
 * documented in PHASE_ROADMAP.md.
 *
 * The trick that makes this work at zero cost: Intake.tsx's suggested
 * ChatGPT prompt tells people to hand back their answer in three specific
 * labeled sections. Because we control that format, plain string matching
 * on the labels is enough — no reasoning required on our end. A document
 * that doesn't follow that structure won't parse into fields; see the
 * `matchedAny: false` fallback path, which hands the raw text back to the
 * player to place themselves rather than guessing wrong and mis-filing
 * something personal into the wrong field.
 */

export type IntakeSectionKey = 'objective' | 'experience' | 'constraint';

export interface ParsedIntakeSections {
  objective: string;
  experience: string;
  constraint: string;
  /** False if no section headers were recognized at all — the document
   * likely wasn't written in the suggested three-section format. Callers
   * should fall back to treating the raw text as an ordinary draft rather
   * than guessing which field each part belongs to. */
  matchedAny: boolean;
}

interface HeaderPattern {
  key: IntakeSectionKey;
  /** Matches a whole line that looks like this section's header. Group 1
   * captures anything written on the same line after the label, if any
   * (e.g. "Your goal: become a filmmaker" all on one line). */
  pattern: RegExp;
}

// Deliberately matches only near the start of a line (after optional bullet
// markers / bold asterisks), not anywhere the word appears — reduces (but
// doesn't eliminate) false positives from a sentence that happens to start
// with "Experience has taught me...", for example.
const HEADER_PATTERNS: HeaderPattern[] = [
  {
    key: 'objective',
    pattern: /^\s*(?:[-*#\d.)]+\s*)?\**\s*(?:your goal|goal|objective)\s*\**\s*[:\-]?\s*(.*)$/i,
  },
  {
    key: 'experience',
    pattern:
      /^\s*(?:[-*#\d.)]+\s*)?\**\s*(?:where you'?re at|your experience|experience|background)\s*\**\s*[:\-]?\s*(.*)$/i,
  },
  {
    key: 'constraint',
    pattern:
      /^\s*(?:[-*#\d.)]+\s*)?\**\s*(?:what you want to avoid|what to avoid|avoid|constraints?|don'?t want)\s*\**\s*[:\-]?\s*(.*)$/i,
  },
];

export function parseIntakeSections(rawText: string): ParsedIntakeSections {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const collected: Record<IntakeSectionKey, string[]> = {
    objective: [],
    experience: [],
    constraint: [],
  };
  let currentKey: IntakeSectionKey | null = null;
  let matchedAny = false;

  for (const line of lines) {
    const header = HEADER_PATTERNS.find(({ pattern }) => pattern.test(line));
    if (header) {
      matchedAny = true;
      currentKey = header.key;
      const inline = line.match(header.pattern)?.[1]?.trim();
      if (inline) collected[currentKey].push(inline);
      continue;
    }
    if (currentKey && line.trim().length > 0) {
      collected[currentKey].push(line.trim());
    }
  }

  return {
    objective: collected.objective.join(' ').trim(),
    experience: collected.experience.join(' ').trim(),
    constraint: collected.constraint.join(' ').trim(),
    matchedAny,
  };
}

const TEXT_EXTENSIONS = ['.txt', '.md'];

/**
 * Reads an uploaded file into plain text. .txt/.md are read directly
 * (zero dependencies). .docx is parsed client-side via `mammoth` — a real
 * new dependency, but it runs entirely in the browser, so still zero
 * per-use cost. Legacy binary .doc files are explicitly rejected with a
 * clear message rather than silently mishandled: no free library parses
 * that old format client-side, and pretending otherwise would just produce
 * garbled or empty text with no explanation.
 */
export async function readIntakeDocumentText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.doc') && !name.endsWith('.docx')) {
    throw new Error(
      "Older .doc files aren't supported — please save this as a .docx or plain text (.txt) file and upload it again."
    );
  }

  if (name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return file.text();
  }

  throw new Error('That file type is not supported yet — please upload a .txt, .md, or .docx file.');
}
