import { useRef, useState, type ChangeEvent } from 'react';
import { Check, Copy, Paperclip } from 'lucide-react';
import type { IntakeAnswers, IntakeStep } from '../types/intake';
import { EMPTY_INTAKE_ANSWERS } from '../types/intake';
import { detectCrisisSignal } from '../safety/crisisDetection';
import { detectHarmfulObjective } from '../safety/harmfulObjectiveDetection';
import type { HarmfulObjectiveCategory } from '../safety/harmfulObjectiveDetection';
import { logSafetyEvent } from '../safety/safetyLog';
import { CrisisResponse } from '../components/CrisisResponse';
import { ObjectiveDeclineResponse } from '../components/ObjectiveDeclineResponse';
import { ThinkingScreen } from '../components/ThinkingScreen';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { parseIntakeSections, readIntakeDocumentText } from '../lib/documentIntake';

/** Suggested prompt for players who don't know what to write. The exact
 * three labels here ("Your goal" / "Where you're at" / "What you want to
 * avoid") must stay in sync with the header patterns in
 * lib/documentIntake.ts — that's the whole trick that lets a plain string
 * match do the work an AI reasoning about the document otherwise would. */
const CHATGPT_PROMPT = `I'm using an app called Questline that turns a personal goal into a step-by-step plan. Ask me whatever questions you need to understand where I'm really at with this goal, then give me your final answer back as plain text in exactly this three-section format:

Your goal: [what I'm actually trying to achieve]
Where you're at: [my relevant experience or starting point, or "starting from scratch"]
What you want to avoid: [anything about the process I already know I don't enjoy, or "nothing specific"]`;

interface IntakeProps {
  /** Fired once the player confirms their reflected-back answers. Phase 3
   * will turn this into a real Campaign via the generation pipeline —
   * for now the caller just needs to know Intake finished successfully. */
  onComplete: (answers: IntakeAnswers) => void;
  /** Escape hatch back to Camp, used only by the crisis-response path. */
  onExitToCamp: () => void;
}

export function Intake({ onComplete, onExitToCamp }: IntakeProps) {
  const [step, setStep] = useState<IntakeStep>('objective');
  const [answers, setAnswers] = useState<IntakeAnswers>(EMPTY_INTAKE_ANSWERS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [declinedObjectiveCategory, setDeclinedObjectiveCategory] =
    useState<HarmfulObjectiveCategory | null>(null);
  const [draft, setDraft] = useState('');
  const [answersFromDocument, setAnswersFromDocument] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (crisisTriggered) {
    return <CrisisResponse onReturnToCamp={onExitToCamp} />;
  }

  if (declinedObjectiveCategory) {
    return (
      <ObjectiveDeclineResponse
        category={declinedObjectiveCategory}
        onTryDifferentObjective={() => {
          setDeclinedObjectiveCategory(null);
          setAnswers(EMPTY_INTAKE_ANSWERS);
          setDraft('');
          setAnswersFromDocument(false);
          setDocumentError(null);
          setStep('objective');
        }}
        onExitToCamp={onExitToCamp}
      />
    );
  }

  function advanceTo(nextStep: IntakeStep) {
    // Brief, purposeful pause between conversational turns (Book VI Ch.6:
    // the wait itself should feel like real thought, not a bare spinner).
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 650);
  }

  /** Book VIII Ch.2/3: checks free text for a genuine disclosure before
   * treating it as ordinary Intake data. Logs every flag (Ch.7) — the
   * player never sees that a log exists, this is purely for later
   * pattern review. */
  function checkCrisisAndProceed(text: string, intakeStep: IntakeStep, next: () => void) {
    const result = detectCrisisSignal(text);
    if (result.flagged) {
      logSafetyEvent('crisis-disclosure', result.category ?? 'unknown', intakeStep);
      setCrisisTriggered(true);
      return;
    }
    next();
  }

  /** Book VIII Ch.4: separate from the crisis check above — this is about
   * whether the stated Objective is eligible for a real Campaign at all,
   * not about the player's immediate wellbeing. Only applied to the
   * Objective itself, since Ch.4 is specifically about what Questline will
   * and won't build a Campaign around. */
  function checkObjectiveAndProceed(text: string, next: () => void) {
    const harmful = detectHarmfulObjective(text);
    if (harmful.flagged && harmful.category) {
      logSafetyEvent('harmful-objective', harmful.category, 'objective');
      setDeclinedObjectiveCategory(harmful.category);
      return;
    }
    next();
  }

  /** Voice answers land in the same draft a typed answer would — appended,
   * not overwritten, so switching between typing and talking mid-answer
   * never loses what's already there. */
  function appendVoiceTranscript(transcript: string) {
    if (!transcript) return;
    setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
  }

  /** Book VIII Ch.2/3 applies to a document exactly like typed text — the
   * raw document (not just the parsed objective slice) gets the crisis
   * check, since a genuine disclosure could land in any section. */
  async function handleDocumentSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setDocumentError(null);
    setIsProcessingDocument(true);
    try {
      const rawText = await readIntakeDocumentText(file);
      const parsed = parseIntakeSections(rawText);
      setIsProcessingDocument(false);

      if (!parsed.matchedAny) {
        // Honest fallback: couldn't tell which part is which, so hand the
        // raw text back as an ordinary draft rather than guess wrong and
        // mis-file something personal into the wrong field.
        setDraft(rawText.trim());
        return;
      }

      const objectiveText = parsed.objective || rawText.trim();
      checkCrisisAndProceed(rawText, 'objective', () => {
        checkObjectiveAndProceed(objectiveText, () => {
          setAnswers((a) => ({
            ...a,
            objective: objectiveText,
            experience: parsed.experience,
            constraint: parsed.constraint,
          }));
          setAnswersFromDocument(true);
          setDraft('');
          advanceTo('time');
        });
      });
    } catch (err) {
      setIsProcessingDocument(false);
      setDocumentError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  async function copyPromptToClipboard() {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-secure context) — the
      // prompt text is already visible for the player to select manually,
      // so this just quietly doesn't confirm rather than showing an error
      // for something non-essential.
    }
  }

  function submitObjective() {
    const value = draft.trim();
    if (!value) return;
    checkCrisisAndProceed(value, 'objective', () => {
      checkObjectiveAndProceed(value, () => {
        setAnswers((a) => ({ ...a, objective: value }));
        setDraft('');
        advanceTo('time');
      });
    });
  }

  function submitTime(choice: IntakeAnswers['timeAvailability']) {
    setAnswers((a) => ({ ...a, timeAvailability: choice }));
    // A document already supplied experience/constraint (checked as a
    // whole at upload time) — no need to ask again with empty text fields.
    advanceTo(answersFromDocument ? 'confirm' : 'experience');
  }

  function submitExperience(skip: boolean) {
    const value = skip ? '' : draft.trim();
    checkCrisisAndProceed(value, 'experience', () => {
      setAnswers((a) => ({ ...a, experience: value }));
      setDraft('');
      advanceTo('constraint');
    });
  }

  function submitConstraint(skip: boolean) {
    const value = skip ? '' : draft.trim();
    checkCrisisAndProceed(value, 'constraint', () => {
      setAnswers((a) => ({ ...a, constraint: value }));
      setDraft('');
      advanceTo('confirm');
    });
  }

  /** Book II Ch.2's confirm step is already a hard gate before anything is
   * generated. Book VIII Ch.8 treats safety as a standing constraint every
   * feature must keep satisfying — so this re-runs the Ch.4 objective
   * check one more time right before a real Campaign gets built, as cheap
   * defense in depth rather than trusting a single earlier pass forever. */
  function confirmAndProceed() {
    checkObjectiveAndProceed(answers.objective, () => onComplete(answers));
  }

  if (isTransitioning) {
    return <ThinkingScreen />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
      {/* UX-FIX: there was previously no way to leave Intake mid-flow except
          the crisis/decline branches above — a player who changed their
          mind partway through had no exit. */}
      <button
        onClick={onExitToCamp}
        className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
      >
        ← Camp
      </button>

      {step === 'objective' && (
        <StepShell prompt="What are you actually trying to become, or achieve?">
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="I want to..."
              rows={3}
              className="flex-1 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-camp-parchment placeholder:text-camp-parchment-dim/60 focus:border-camp-ember/50 focus:outline-none"
            />
            <VoiceInputButton onTranscript={appendVoiceTranscript} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Or upload a document instead
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.docx,.doc"
                onChange={handleDocumentSelected}
                className="hidden"
              />
            </div>

            {isProcessingDocument && (
              <p className="text-xs text-camp-parchment-dim">Reading your document…</p>
            )}
            {documentError && <p className="text-xs text-camp-ember">{documentError}</p>}

            <details className="text-xs text-camp-parchment-dim">
              <summary className="cursor-pointer select-none">
                Not sure what to write? Try asking ChatGPT first.
              </summary>
              <div className="mt-2 flex flex-col gap-2 rounded-lg border border-camp-night-soft bg-camp-night-soft/40 p-3">
                <p>
                  Tell ChatGPT (or any AI chat) everything about where you're at with this goal, then
                  ask it to hand the reply back in three short labeled sections. Save that reply as a
                  text file and upload it above.
                </p>
                <button
                  type="button"
                  onClick={copyPromptToClipboard}
                  className="flex w-fit items-center gap-1.5 rounded-full border border-camp-night-soft px-3 py-1.5 text-camp-parchment-dim transition-all duration-150 hover:border-camp-ember/50 active:scale-95"
                >
                  {promptCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {promptCopied ? 'Copied' : 'Copy a ready-made prompt'}
                </button>
              </div>
            </details>
          </div>

          <PrimaryButton onClick={submitObjective} disabled={!draft.trim()}>
            Continue
          </PrimaryButton>
        </StepShell>
      )}

      {step === 'time' && (
        <StepShell
          prompt={`"${answers.objective}" — I love that. Before I map anything out: are you doing this alongside other work, or is this the main thing right now?`}
        >
          <div className="flex flex-col gap-2">
            <ChoiceButton onClick={() => submitTime('alongside')}>
              Alongside other work / life
            </ChoiceButton>
            <ChoiceButton onClick={() => submitTime('main-thing')}>
              This is the main thing right now
            </ChoiceButton>
            <ChoiceButton onClick={() => submitTime('not-sure')}>
              Not sure yet
            </ChoiceButton>
          </div>
        </StepShell>
      )}

      {step === 'experience' && (
        <StepShell prompt="Have you already got real experience or skill in this, or would you say you're starting from scratch?">
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Optional — tell me what you've already got, if anything."
              rows={3}
              className="flex-1 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-camp-parchment placeholder:text-camp-parchment-dim/60 focus:border-camp-ember/50 focus:outline-none"
            />
            <VoiceInputButton onTranscript={appendVoiceTranscript} />
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={() => submitExperience(false)} disabled={!draft.trim()}>
              Continue
            </PrimaryButton>
            <SecondaryButton onClick={() => submitExperience(true)}>
              Starting from scratch
            </SecondaryButton>
          </div>
        </StepShell>
      )}

      {step === 'constraint' && (
        <StepShell prompt="Is there anything about the process you already know you don't enjoy, or want to avoid? Totally fine to skip.">
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Optional"
              rows={3}
              className="flex-1 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-camp-parchment placeholder:text-camp-parchment-dim/60 focus:border-camp-ember/50 focus:outline-none"
            />
            <VoiceInputButton onTranscript={appendVoiceTranscript} />
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={() => submitConstraint(false)} disabled={!draft.trim()}>
              Continue
            </PrimaryButton>
            <SecondaryButton onClick={() => submitConstraint(true)}>Skip</SecondaryButton>
          </div>
        </StepShell>
      )}

      {step === 'confirm' && (
        <ConfirmStep
          answers={answers}
          onConfirm={confirmAndProceed}
          onRestart={() => {
            setAnswers(EMPTY_INTAKE_ANSWERS);
            setAnswersFromDocument(false);
            setDocumentError(null);
            setStep('objective');
          }}
        />
      )}
    </div>
  );
}

function ConfirmStep({
  answers,
  onConfirm,
  onRestart,
}: {
  answers: IntakeAnswers;
  onConfirm: () => void;
  onRestart: () => void;
}) {
  const timeLabel =
    answers.timeAvailability === 'alongside'
      ? "Alongside other work, for now"
      : answers.timeAvailability === 'main-thing'
      ? 'The main thing right now'
      : "Not sure yet — that's alright";

  return (
    <StepShell prompt="Here's what I heard. Take a second to make sure I've got it right.">
      <div className="flex flex-col gap-3 rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4 text-camp-parchment">
        <Field label="You want to">{answers.objective}</Field>
        <Field label="Right now">{timeLabel}</Field>
        <Field label="Experience">{answers.experience || 'Starting fresh'}</Field>
        <Field label="Worth knowing">{answers.constraint || 'Nothing specific yet'}</Field>
      </div>
      <div className="flex gap-2">
        <PrimaryButton onClick={onConfirm}>Yes, that's exactly it</PrimaryButton>
        <SecondaryButton onClick={onRestart}>Let me start over</SecondaryButton>
      </div>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-camp-parchment-dim">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function StepShell({ prompt, children }: { prompt: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-xl leading-snug text-camp-parchment">{prompt}</p>
      {children}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-camp-ember px-6 py-2.5 font-semibold text-camp-night transition-all duration-150 hover:bg-camp-ember-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-camp-night-soft px-6 py-2.5 text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
    >
      {children}
    </button>
  );
}

function ChoiceButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-camp-night-soft bg-camp-night-soft/60 px-4 py-3 text-left text-camp-parchment transition-all duration-150 hover:border-camp-ember/50 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
