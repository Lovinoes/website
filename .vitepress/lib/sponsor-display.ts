import { formatMonth, formatUsd } from './format.ts';

export type SponsorStatus = 'monthly' | 'former' | 'one_time';

export interface SponsorProfile {
  login: string;
  name: string | null;
  url: string;
  avatarUrl: string;
}

export interface Sponsor {
  status: SponsorStatus;
  profile: SponsorProfile | null;
  monthlyCents: number;
  oneTimeCents: number;
  lifetimeCents: number;
  rank: number;
  firstSponsoredAt: string | null;
}

export interface SponsorsData {
  monthlyCents: number;
  lifetimeCents: number;
  sponsors: Sponsor[];
}

export function sponsorDisplayName(sponsor: Sponsor): string {
  return sponsor.profile?.name ?? sponsor.profile?.login ?? 'Anonymous';
}

// GitHub serves the avatar at the requested size instead of the full-resolution original.
export function sponsorAvatarUrl(sponsor: Sponsor): string | undefined {
  if (!sponsor.profile?.avatarUrl) return undefined;
  try {
    const url = new URL(sponsor.profile.avatarUrl);
    url.searchParams.set('s', '96');
    return url.toString();
  } catch {
    return sponsor.profile.avatarUrl;
  }
}

// The initial stands in when there is no avatar or GitHub no longer serves it (e.g. deleted accounts).
export function sponsorAvatarFallback(sponsor: Sponsor): string {
  return sponsor.profile ? sponsorDisplayName(sponsor)[0].toUpperCase() : '?';
}

export function sponsorMonthlyMeta(sponsor: Sponsor): string {
  const parts = [`${formatUsd(sponsor.lifetimeCents)} total`];
  if (sponsor.firstSponsoredAt) parts.push(`since ${formatMonth(sponsor.firstSponsoredAt)}`);
  return parts.join(' · ');
}
