import { useState } from 'react';
import { Target, Hammer, Flame, Users, Shield, MapPin, Lock } from 'lucide-react';
import type { AttributeKey, Campaign } from '../types/campaign';
import type { AvatarConfig } from '../types/avatar';
import { AvatarSVG } from '../components/AvatarSVG';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABELS } from '../engine/attributeTracking';

interface JourneyRevealProps {
  campaign: Campaign;
  avatar: AvatarConfig;
  onBeginJourney: () => void;
  onBackToCamp: () => void;
}

const ATTRIBUTE_ICONS: Record<AttributeKey, typeof Target> = {
  discipline: Target,
  craft: Hammer,
  confidence: Flame,
  network: Users,
  resilience: Shield,
};

const ATTRIBUTE_COLOR_VARS: Record<AttributeKey, string> = {
  discipline: 'var(--color-attr-discipline)',
  craft: 'var(--color-attr-craft)',
  confidence: 'var(--color-attr-confidence)',
  network: 'var(--color-attr-network)',
  resilience: 'var(--color-attr-resilience)',
};

/**
 * NEW SCREEN, inserted between choosing a Path and actually landing in
 * Camp. A real player's feedback: after picking a path, they were dropped
 * straight into the working Camp UI with no moment to actually take in who
 * they were starting as or what the whole road ahead looked like — the
 * request was for something closer to a game's character-reveal + world-map
 * beat before the first real "level" begins.
 *
 * Two short phases in one screen, advanced with an explicit tap (the
 * "click next" feel that was asked for), not a multi-page wizard:
 * 1. "This is you" — the character the player is starting as, on this Path.
 * 2. "This is your path laid out" — every Chapter shown as a node on a
 *    trail, tapped individually to preview (Book VI Ch.3's warning against
 *    a flat stats dump applies here too — nothing calculates or fabricates
 *    anything, it just visually lays out data the Campaign already has).
 *
 * Chapters beyond the first are shown but visually locked — Book II Ch.1's
 * hierarchy already exists in full at generation time, so this isn't
 * spoiling anything hidden; it's the same "map the whole mountain, climb it
 * one Chapter at a time" idea the rest of the app already uses.
 */
export function JourneyReveal({ campaign, avatar, onBeginJourney, onBackToCamp }: JourneyRevealProps) {
  const [phase, setPhase] = useState<'character' | 'map'>('character');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-12">
      <button
        onClick={onBackToCamp}
        className="self-start text-sm text-camp-parchment-dim underline decoration-dotted underline-offset-4 hover:text-camp-parchment"
      >
        ← Camp
      </button>

      {phase === 'character' ? (
        <CharacterReveal campaign={campaign} avatar={avatar} onNext={() => setPhase('map')} />
      ) : (
        <PathMap
          campaign={campaign}
          expandedChapterId={expandedChapterId}
          onToggleChapter={(id) => setExpandedChapterId((current) => (current === id ? null : id))}
          onBeginJourney={onBeginJourney}
        />
      )}
    </div>
  );
}

function CharacterReveal({
  campaign,
  avatar,
  onNext,
}: {
  campaign: Campaign;
  avatar: AvatarConfig;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">This is you</p>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-camp-ember bg-camp-night-soft">
        <AvatarSVG config={avatar} size={72} />
      </div>
      <div>
        <h1 className="font-display text-2xl text-camp-parchment">{campaign.chosenPath.name}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-camp-parchment-dim">
          Every Attribute below starts at zero — not because you're starting from nothing, but
          because everything from here counts as real, tracked progress toward{' '}
          {lowerFirstWord(truncateForInline(campaign.objective))}.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-camp-parchment-dim/70">
          You can customize how you look any time from the Backpack.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {ATTRIBUTE_ORDER.map((attribute) => {
          const Icon = ATTRIBUTE_ICONS[attribute];
          const color = ATTRIBUTE_COLOR_VARS[attribute];
          return (
            <div
              key={attribute}
              className="flex items-center gap-2 rounded-lg border border-camp-night-soft bg-camp-night-soft/60 px-3 py-2 text-left"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="text-sm text-camp-parchment">{ATTRIBUTE_LABELS[attribute]}</span>
              <span className="ml-auto text-xs text-camp-parchment-dim">0 XP</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="mt-2 rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
      >
        See Your Path →
      </button>
    </div>
  );
}

function PathMap({
  campaign,
  expandedChapterId,
  onToggleChapter,
  onBeginJourney,
}: {
  campaign: Campaign;
  expandedChapterId: string | null;
  onToggleChapter: (id: string) => void;
  onBeginJourney: () => void;
}) {
  const firstChapter = campaign.chapters[0];

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">
          This is your path
        </p>
        <h1 className="font-display text-2xl text-camp-parchment">{campaign.title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-camp-parchment-dim">
          Tap a stop on the trail to preview it. You'll only ever work on one at a time —
          the rest are here so you can see the whole road ahead.
        </p>
      </div>

      <div className="flex flex-col items-center">
        {campaign.chapters.map((chapter, index) => {
          const isFirst = index === 0;
          const isExpanded = expandedChapterId === chapter.id;
          return (
            <div key={chapter.id} className="flex w-full max-w-sm flex-col items-center">
              {index > 0 && <div className="h-8 w-px border-l-2 border-dotted border-camp-night-soft" />}
              <button
                onClick={() => onToggleChapter(chapter.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.98] ${
                  isFirst
                    ? 'border-camp-ember/60 bg-camp-ember/10'
                    : 'border-camp-night-soft bg-camp-night-soft/40'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    isFirst
                      ? 'border-camp-ember bg-camp-ember text-camp-night'
                      : 'border-camp-parchment-dim/40 text-camp-parchment-dim'
                  }`}
                >
                  {isFirst ? <MapPin className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-xs uppercase tracking-wide text-camp-parchment-dim">
                    Chapter {chapter.chapterNumber}
                  </span>
                  <span className="block font-display text-base text-camp-parchment">{chapter.name}</span>
                </span>
              </button>
              {isExpanded && (
                <p className="mt-1 w-full rounded-lg bg-camp-night-soft/40 p-3 text-sm text-camp-parchment-dim">
                  {chapter.essence}
                  {chapter.bossBattle && (
                    <>
                      {' '}
                      Its Boss Battle: <span className="text-camp-parchment">{chapter.bossBattle.name}</span>.
                    </>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onBeginJourney}
        className="mt-2 self-center rounded-full bg-camp-ember px-8 py-3 font-semibold text-camp-night transition-transform duration-150 hover:bg-camp-ember-bright active:scale-95"
      >
        Begin Chapter 1: {firstChapter.name}
      </button>
    </div>
  );
}

function lowerFirstWord(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Same cognitive-overload concern as PathSelection.tsx's objective card —
 * this screen embeds the objective mid-sentence, so a multi-paragraph
 * objective needs a hard cap here too rather than ballooning the sentence. */
function truncateForInline(text: string, max = 120): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
}
