/**
 * Small formatting helpers used across the admin UI.
 */

export function initials(firstName?: string | null, lastName?: string | null) {
  const f = firstName?.trim()?.[0] ?? "";
  const l = lastName?.trim()?.[0] ?? "";
  return (f + l || "?").toUpperCase();
}

/**
 * "2 minutes ago", "yesterday", "3 weeks ago" — Intl-driven so it
 * automatically respects the user's locale.
 *
 * Falls back to "Just now" for <30s and to absolute date for >365d.
 */
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "seconds"],
  [60, "minutes"],
  [24, "hours"],
  [7, "days"],
  [4.34524, "weeks"],
  [12, "months"],
  [Number.POSITIVE_INFINITY, "years"],
];

export function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = (d.getTime() - Date.now()) / 1000;

  if (Math.abs(seconds) < 30) return "Just now";

  let duration = seconds;
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return d.toLocaleDateString();
}
