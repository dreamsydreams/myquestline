import { useState } from 'react';
import { Sparkles, Backpack as BackpackIcon, SlidersHorizontal } from 'lucide-react';
import { AvatarSVG } from '../components/AvatarSVG';
import type { AvatarConfig, HairStyle, Accessory } from '../types/avatar';
import {
  SKIN_TONE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  OUTFIT_COLOR_OPTIONS,
} from '../types/avatar';
import type { Campaign } from '../types/campaign';
import { computeRelics } from '../engine/relics';

interface BackpackProps {
  avatar: AvatarConfig;
  onChangeAvatar: (config: AvatarConfig) => void;
  currentCampaign: Campaign | null;
  campaignHistory: Campaign[];
  onResetAll: () => void;
  /** Book II Ch.8 — Re-Forging. Only relevant, and only shown, while a
   * Campaign is actually active. */
  onOpenReForge: () => void;
  /** Book I Ch.9's "Abandon Quest." Same visibility rule as above. */
  onOpenAbandon: () => void;
}

type Tab = 'gear' | 'relics' | 'settings';

export function Backpack({
  avatar,
  onChangeAvatar,
  currentCampaign,
  campaignHistory,
  onResetAll,
  onOpenReForge,
  onOpenAbandon,
}: BackpackProps) {
  const [tab, setTab] = useState<Tab>('gear');

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-camp-ember">Backpack</p>
        <h1 className="font-display text-3xl text-camp-parchment">What you carry</h1>
      </div>

      <div className="flex gap-2 border-b border-camp-night-soft pb-2">
        <TabButton icon={SlidersHorizontal} label="Gear" active={tab === 'gear'} onClick={() => setTab('gear')} />
        <TabButton icon={Sparkles} label="Relics" active={tab === 'relics'} onClick={() => setTab('relics')} />
        <TabButton
          icon={BackpackIcon}
          label="Settings"
          active={tab === 'settings'}
          onClick={() => setTab('settings')}
        />
      </div>

      {tab === 'gear' && <GearTab avatar={avatar} onChange={onChangeAvatar} />}
      {tab === 'relics' && <RelicsTab currentCampaign={currentCampaign} campaignHistory={campaignHistory} />}
      {tab === 'settings' && (
        <SettingsTab
          onResetAll={onResetAll}
          currentCampaignTitle={currentCampaign?.title ?? null}
          onOpenReForge={onOpenReForge}
          onOpenAbandon={onOpenAbandon}
        />
      )}
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95 ${
        active ? 'bg-camp-ember/20 text-camp-ember-bright' : 'text-camp-parchment-dim hover:text-camp-parchment'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function GearTab({
  avatar,
  onChange,
}: {
  avatar: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}) {
  const hairStyles: HairStyle[] = ['short', 'long', 'ponytail', 'bald'];
  const accessories: Accessory[] = ['none', 'glasses', 'scarf', 'hat'];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-2xl border border-camp-night-soft bg-camp-night-soft/60 p-6">
        <AvatarSVG config={avatar} size={120} />
      </div>

      <ChoiceRow label="Skin tone">
        {SKIN_TONE_OPTIONS.map((color) => (
          <SwatchButton
            key={color}
            color={color}
            selected={avatar.skinTone === color}
            onClick={() => onChange({ ...avatar, skinTone: color })}
          />
        ))}
      </ChoiceRow>

      <ChoiceRow label="Hair style">
        {hairStyles.map((style) => (
          <button
            key={style}
            onClick={() => onChange({ ...avatar, hairStyle: style })}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-all duration-150 active:scale-95 ${
              avatar.hairStyle === style
                ? 'border-camp-ember bg-camp-ember/10 text-camp-ember-bright'
                : 'border-camp-night-soft text-camp-parchment-dim hover:text-camp-parchment'
            }`}
          >
            {style}
          </button>
        ))}
      </ChoiceRow>

      <ChoiceRow label="Hair color">
        {HAIR_COLOR_OPTIONS.map((color) => (
          <SwatchButton
            key={color}
            color={color}
            selected={avatar.hairColor === color}
            onClick={() => onChange({ ...avatar, hairColor: color })}
          />
        ))}
      </ChoiceRow>

      <ChoiceRow label="Outfit color">
        {OUTFIT_COLOR_OPTIONS.map((color) => (
          <SwatchButton
            key={color}
            color={color}
            selected={avatar.outfitColor === color}
            onClick={() => onChange({ ...avatar, outfitColor: color })}
          />
        ))}
      </ChoiceRow>

      <ChoiceRow label="Accessory">
        {accessories.map((acc) => (
          <button
            key={acc}
            onClick={() => onChange({ ...avatar, accessory: acc })}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-all duration-150 active:scale-95 ${
              avatar.accessory === acc
                ? 'border-camp-ember bg-camp-ember/10 text-camp-ember-bright'
                : 'border-camp-night-soft text-camp-parchment-dim hover:text-camp-parchment'
            }`}
          >
            {acc}
          </button>
        ))}
      </ChoiceRow>
    </div>
  );
}

function ChoiceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-camp-parchment-dim">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SwatchButton({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Choose color ${color}`}
      className={`h-7 w-7 rounded-full border-2 transition-all duration-150 active:scale-90 ${
        selected ? 'border-camp-parchment' : 'border-transparent'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function RelicsTab({
  currentCampaign,
  campaignHistory,
}: {
  currentCampaign: Campaign | null;
  campaignHistory: Campaign[];
}) {
  const relics = computeRelics(currentCampaign, campaignHistory);

  if (relics.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-camp-parchment-dim">
        Nothing here yet. Relics show up as you actually earn them — defeating Boss Battles,
        finishing Chapters, completing full Campaigns.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {relics.map((relic) => (
        <div
          key={relic.id}
          className={`rounded-xl border p-4 ${
            relic.tier === 'legendary'
              ? 'border-camp-ember/50 bg-camp-ember/10'
              : 'border-camp-night-soft bg-camp-night-soft/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {relic.tier === 'legendary' && <Sparkles size={14} className="text-camp-ember" />}
            <p className="font-display text-base text-camp-parchment">{relic.name}</p>
          </div>
          <p className="mt-1 text-sm text-camp-parchment-dim">{relic.description}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({
  onResetAll,
  currentCampaignTitle,
  onOpenReForge,
  onOpenAbandon,
}: {
  onResetAll: () => void;
  currentCampaignTitle: string | null;
  onOpenReForge: () => void;
  onOpenAbandon: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {currentCampaignTitle && (
        <div>
          <p className="text-xs uppercase tracking-wide text-camp-parchment-dim">This Campaign</p>
          <p className="mt-1 text-sm text-camp-parchment-dim">
            <span className="text-camp-parchment">{currentCampaignTitle}</span> — if your circumstances or your
            actual goal have changed, you don't have to start over.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onOpenReForge}
              className="rounded-full border border-camp-parchment-dim/40 px-5 py-2 text-sm text-camp-parchment transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Re-Forge this Campaign
            </button>
            <button
              onClick={onOpenAbandon}
              className="rounded-full border border-camp-parchment-dim/40 px-5 py-2 text-sm text-camp-parchment-dim transition-all duration-150 hover:border-camp-parchment-dim active:scale-95"
            >
              Abandon Quest
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-camp-parchment-dim">About this save</p>
        <p className="mt-1 text-sm text-camp-parchment-dim">
          Your journey is saved on this device and browser only — it won't follow you to a
          different phone or browser yet. Clearing this browser's site data will also clear it.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-camp-parchment-dim">Reset progress</p>
        <p className="mt-1 text-xs text-camp-parchment-dim">
          This is different from Abandon Quest above — it wipes your entire save, including finished Campaigns and
          Relics, not just your current one.
        </p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-2 rounded-full border border-camp-danger/50 px-5 py-2 text-sm text-camp-danger transition-all duration-150 hover:bg-camp-danger/10 active:scale-95"
          >
            Reset all progress
          </button>
        ) : (
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-camp-danger/40 bg-camp-night-soft/60 p-4">
            <p className="text-sm text-camp-parchment">
              This clears everything on this device — your Campaign, Chapters, Relics, and
              Character growth. It can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetAll();
                  setConfirming(false);
                }}
                className="rounded-full bg-camp-danger px-5 py-2 text-sm font-medium text-camp-night transition-all duration-150 active:scale-95"
              >
                Yes, reset everything
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-full border border-camp-night-soft px-5 py-2 text-sm text-camp-parchment-dim transition-all duration-150 active:scale-95"
              >
                Never mind
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
