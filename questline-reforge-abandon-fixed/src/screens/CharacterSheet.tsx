import { Target, Hammer, Flame, Users, Shield } from 'lucide-react';
import type { AttributeKey, Campaign } from '../types/campaign';
import type { AvatarConfig } from '../types/avatar';
import { AvatarSVG } from '../components/AvatarSVG';
import {
  ATTRIBUTE_ORDER,
  ATTRIBUTE_LABELS,
  computeAttributeTotals,
  computeTopCallback,
  type AttributeTotal,
} from '../engine/attributeTracking';

interface CharacterSheetProps {
  campaign: Campaign | null;
  avatar: AvatarConfig;
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
 * Soft visual reference for bar scaling — NOT a real level threshold or
 * cap. Book VI Ch.3 explicitly warns against implying more precision than
 * the underlying system has, so this is only ever described as relative
 * growth, never as "X% to next level" or similar false-precision framing.
 */
const VISUAL_REFERENCE_MAX = 120;

export function CharacterSheet({ campaign, avatar }: CharacterSheetProps) {
  if (!campaign) {
    return (
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <AvatarSVG config={avatar} size={80} />
        <h1 className="font-display text-2xl text-camp-parchment">Character</h1>
        <p className="text-camp-parchment-dim">
          Once your journey begins, this is where you'll see who you're becoming.
        </p>
      </div>
    );
  }

  const totals = computeAttributeTotals(campaign);
  const callback = computeTopCallback(totals);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-camp-night-soft bg-camp-night-soft/60">
          <AvatarSVG config={avatar} size={48} />
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">
            Character
          </p>
          <h1 className="font-display text-3xl text-camp-parchment">Who you're becoming</h1>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {ATTRIBUTE_ORDER.map((attr) => (
          <AttributeRow key={attr} total={totals.find((t) => t.attribute === attr)!} />
        ))}
      </div>

      {callback && (
        <div className="rounded-xl border border-camp-ember/30 bg-camp-night-soft/60 p-4">
          <p className="text-sm text-camp-parchment">{callback}</p>
        </div>
      )}

      {!callback && (
        <p className="text-sm text-camp-parchment-dim">
          Complete missions and face your Boss Battles — this is where you'll start
          seeing real growth take shape.
        </p>
      )}
    </div>
  );
}

function AttributeRow({ total }: { total: AttributeTotal }) {
  const Icon = ATTRIBUTE_ICONS[total.attribute];
  const color = ATTRIBUTE_COLOR_VARS[total.attribute];
  const widthPct = Math.min(100, (total.xp / VISUAL_REFERENCE_MAX) * 100);

  return (
    <div className="rounded-xl border border-camp-night-soft bg-camp-night-soft/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-sm font-medium" style={{ color }}>
            {ATTRIBUTE_LABELS[total.attribute]}
          </span>
        </div>
        {/* Numeric label alongside color — never rely on color alone
            (Book VI Ch.7 accessibility). */}
        <span className="text-xs text-camp-parchment-dim">{total.xp} XP</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-camp-night">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
      <GrowthTrend total={total} color={color} />
    </div>
  );
}

/**
 * Small sparkline of cumulative growth for this attribute, in the order
 * events actually happened. Deliberately minimal — this is a shape of
 * momentum, not a precise chart (Book VI Ch.3's false-precision warning).
 * Session-only, per this file's top-level honesty note in
 * engine/attributeTracking.ts.
 */
function GrowthTrend({ total, color }: { total: AttributeTotal; color: string }) {
  if (total.events.length < 2) {
    return (
      <p className="mt-2 text-xs text-camp-parchment-dim/70">
        {total.events.length === 0
          ? 'No growth yet.'
          : 'One step so far — more will start showing a real trend.'}
      </p>
    );
  }

  const cumulative: number[] = [];
  let running = 0;
  for (const e of total.events) {
    running += e.xp;
    cumulative.push(running);
  }

  const max = cumulative[cumulative.length - 1];
  const width = 200;
  const height = 28;
  const points = cumulative
    .map((val, i) => {
      const x = (i / (cumulative.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className="mt-2"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} opacity={0.8} />
    </svg>
  );
}
