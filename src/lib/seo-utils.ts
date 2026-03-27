/**
 * Clamp a page title to stay within the SEO-safe limit.
 * The root layout appends " | GroomLocal" (13 chars), so page-level
 * titles must be <= maxLen (default 47) to keep the full title under 60.
 *
 * Truncates at the last word boundary and appends "..." if needed.
 */
export function clampTitle(title: string, maxLen = 47): string {
  if (title.length <= maxLen) return title;
  const truncTarget = maxLen - 3; // room for "..."
  const lastSpace = title.lastIndexOf(" ", truncTarget);
  if (lastSpace > 10) {
    return title.slice(0, lastSpace) + "...";
  }
  return title.slice(0, truncTarget) + "...";
}

/**
 * Clamp a meta description to the ideal SEO length (120-155 chars).
 *
 * - If already in range, return as-is.
 * - If too long, truncate at the last sentence boundary before max,
 *   or at the last space before max with "..." appended.
 * - If too short, return as-is (caller should provide a better fallback).
 */
export function clampDescription(
  desc: string,
  min = 120,
  max = 155,
): string {
  const trimmed = desc.trim();

  if (trimmed.length >= min && trimmed.length <= max) {
    return trimmed;
  }

  if (trimmed.length > max) {
    // Try to cut at a sentence boundary (. or !) before max
    const sub = trimmed.slice(0, max);
    const lastPeriod = sub.lastIndexOf(". ");
    const lastExcl = sub.lastIndexOf("! ");

    // Also check if the string ends right at a period
    const endsWithSentence = sub.endsWith(".") || sub.endsWith("!");
    if (endsWithSentence && sub.length >= min) {
      return sub;
    }

    const sentenceEnd = Math.max(lastPeriod, lastExcl);
    if (sentenceEnd > 0) {
      const candidate = trimmed.slice(0, sentenceEnd + 1);
      if (candidate.length >= min) {
        return candidate;
      }
    }

    // Fall back to word boundary with ellipsis
    const truncTarget = max - 3; // leave room for "..."
    const lastSpace = trimmed.lastIndexOf(" ", truncTarget);
    if (lastSpace > min) {
      return trimmed.slice(0, lastSpace) + "...";
    }
    return trimmed.slice(0, truncTarget) + "...";
  }

  // Too short - return as-is, caller should build a better string
  return trimmed;
}
