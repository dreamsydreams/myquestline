/**
 * Source: Book VIII, Chapter 3's own flagged Future Question — "What crisis
 * resources are appropriate to surface for an international player base?"
 * — and the PHASE_ROADMAP.md item calling out CrisisResponse.tsx's
 * previously US-only hardcoded resource list.
 *
 * HONEST SCOPE OF WHAT THIS ACTUALLY DOES: this is a best-effort guess
 * based on the browser's own reported timezone (`Intl.DateTimeFormat`),
 * available with zero network calls and zero paid geolocation service.
 * It is NOT real geolocation — a player using a VPN, a shared/library
 * device, or simply a non-default system timezone will get a wrong guess.
 * It exists to make the crisis response feel less US-flattened for the
 * common case, never to gate or restrict which resources are shown — the
 * US default and the international directory are ALWAYS shown regardless
 * of what this returns. A wrong guess should only ever mean "one extra
 * line was less relevant than it could have been," never "the right
 * resource was hidden."
 *
 * A real fix needs either a consented, real geolocation prompt or a
 * maintained country-specific crisis-line database — both bigger product
 * decisions than this function should quietly make on its own.
 */

const TIMEZONE_HINTS: Record<string, { country: string; helpline: string }> = {
  'Europe/London': { country: 'the UK', helpline: 'Samaritans: call 116 123, free, 24/7' },
  'Europe/Dublin': { country: 'Ireland', helpline: 'Samaritans: call 116 123, free, 24/7' },
  'Africa/Lagos': { country: 'Nigeria', helpline: "Nigeria's Suicide Prevention lines are listed on findahelpline.com" },
  'Africa/Johannesburg': { country: 'South Africa', helpline: 'SADAG: 0800 567 567, free, 24/7' },
  'Asia/Kolkata': { country: 'India', helpline: 'iCall: 9152987821' },
  'Asia/Karachi': { country: 'Pakistan', helpline: "Pakistan's helplines are listed on findahelpline.com" },
  'Australia/Sydney': { country: 'Australia', helpline: 'Lifeline: 13 11 14, 24/7' },
  'Australia/Melbourne': { country: 'Australia', helpline: 'Lifeline: 13 11 14, 24/7' },
  'Europe/Berlin': { country: 'Germany', helpline: 'Telefonseelsorge: 0800 111 0 111, free, 24/7' },
  'Europe/Paris': { country: 'France', helpline: '3114, free, 24/7' },
  'America/Toronto': { country: 'Canada', helpline: 'Talk Suicide Canada: 1-833-456-4566, 24/7' },
  'America/Vancouver': { country: 'Canada', helpline: 'Talk Suicide Canada: 1-833-456-4566, 24/7' },
};

const US_TIMEZONE_PREFIXES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'];

export interface RegionHint {
  isLikelyUS: boolean;
  country: string | null;
  localHelpline: string | null;
}

export function getRegionHint(): RegionHint {
  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return { isLikelyUS: true, country: null, localHelpline: null };
  }

  if (US_TIMEZONE_PREFIXES.includes(timezone)) {
    return { isLikelyUS: true, country: null, localHelpline: null };
  }

  const hint = TIMEZONE_HINTS[timezone];
  if (hint) {
    return { isLikelyUS: false, country: hint.country, localHelpline: hint.helpline };
  }

  return { isLikelyUS: false, country: null, localHelpline: null };
}
