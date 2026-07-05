import { useState } from 'react';
import { MapPin, Lock, CheckCircle2 } from 'lucide-react';
import type { Campaign, Chapter } from '../types/campaign';

interface MapProps {
  currentCampaign: Campaign | null;
  currentChapterIndex: number;
  campaignHistory: Campaign[];
}

/**
 * Book VI Ch.2 ("Map" = Search, Book I Ch.9) — the persistent version of
 * the trail JourneyReveal shows once at the start of a Campaign. This is
 * the same idea, reachable any time from the nav, always reflecting real
 * live progress rather than a one-time snapshot.
 *
 * HONEST LIMITATION, stated plainly rather than faked visually: the
 * current data model (Book II Ch.3) has a player choose ONE Path once, at
 * generation time — there's no mid-Campaign branching to actually
 * visualize. This renders the real linear trail the player is actually
 * walking, not an invented branching tree. If branching paths are ever
 * added to the underlying model, this is the file that would grow a
 * genuine branch visualization — not before.
 */
export function Map({ currentCampaign, currentChapterIndex, campaignHistory }: MapProps) {
  if (currentCampaign) {
    return <ActiveMap campaign={currentCampaign} currentChapterIndex={currentChapterIndex} />;
  }

  if (campaignHistory.length > 0) {
    return <CompletedMap campaign={campaignHistory[0]} />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-2xl text-camp-parchment">Map</h1>
      <p className="text-camp-parchment-dim">
        Your map will take shape once your journey begins.
      </p>
    </div>
  );
}

function ActiveMap({ campaign, currentChapterIndex }: { campaign: Campaign; currentChapterIndex: number }) {
  return (
    <TrailView
      title={campaign.title}
      subtitle="Tap a stop to see what it's about. You're only ever working on one at a time."
      chapters={campaign.chapters}
      currentChapterIndex={currentChapterIndex}
    />
  );
}

function CompletedMap({ campaign }: { campaign: Campaign }) {
  return (
    <TrailView
      title={campaign.title}
      subtitle="This journey is complete — every stop below was actually finished."
      chapters={campaign.chapters}
      currentChapterIndex={campaign.chapters.length}
    />
  );
}

type ChapterStatus = 'done' | 'current' | 'locked';

function getStatus(index: number, currentChapterIndex: number): ChapterStatus {
  if (index < currentChapterIndex) return 'done';
  if (index === currentChapterIndex) return 'current';
  return 'locked';
}

function TrailView({
  title,
  subtitle,
  chapters,
  currentChapterIndex,
}: {
  title: string;
  subtitle: string;
  chapters: Chapter[];
  currentChapterIndex: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-10">
      <div className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">Map</p>
        <h1 className="font-display text-2xl text-camp-parchment">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-camp-parchment-dim">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center">
        {chapters.map((chapter, index) => {
          const status = getStatus(index, currentChapterIndex);
          const isExpanded = expandedId === chapter.id;
          return (
            <div key={chapter.id} className="flex w-full max-w-sm flex-col items-center">
              {index > 0 && (
                <div
                  className={`h-8 w-px border-l-2 ${
                    status === 'locked' ? 'border-dotted border-camp-night-soft' : 'border-camp-ember/50'
                  }`}
                />
              )}
              <button
                onClick={() => setExpandedId((cur) => (cur === chapter.id ? null : chapter.id))}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.98] ${
                  status === 'current'
                    ? 'border-camp-ember/60 bg-camp-ember/10'
                    : status === 'done'
                      ? 'border-attr-resilience/40 bg-camp-night-soft/40'
                      : 'border-camp-night-soft bg-camp-night-soft/40'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    status === 'current'
                      ? 'border-camp-ember bg-camp-ember text-camp-night'
                      : status === 'done'
                        ? 'border-attr-resilience text-attr-resilience'
                        : 'border-camp-parchment-dim/40 text-camp-parchment-dim'
                  }`}
                >
                  {status === 'locked' ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-xs uppercase tracking-wide text-camp-parchment-dim">
                    Chapter {chapter.chapterNumber}
                    {status === 'done' && ' — Complete'}
                    {status === 'current' && ' — Current'}
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
                      Its Boss Battle: <span className="text-camp-parchment">{chapter.bossBattle.name}</span>
                      {chapter.bossBattle.isDefeated ? ' — defeated.' : '.'}
                    </>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
