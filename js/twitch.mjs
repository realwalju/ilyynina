export function uptimeState(text) {
  const value = text.trim();
  if (/^(?:[\w-]+ is )?offline[.!]?$/i.test(value)) return 'offline';
  const duration = /^\d+ (?:week|day|hour|minute|second)s?(?:,?\s+(?:and\s+)?\d+ (?:week|day|hour|minute|second)s?)*$/i;
  return duration.test(value) ? 'live' : 'unknown';
}

export function followerCount(text) {
  const value = text.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) return null;
  const count = Number(value.replaceAll(',', ''));
  return Number.isSafeInteger(count) ? count : null;
}

export async function channelInfo(handle, field) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('https://decapi.me/twitch/' + field + '/' +
      encodeURIComponent(handle), { signal: controller.signal });
    if (!response.ok) throw new Error('Channel lookup failed');
    return (await response.text()).trim();
  } finally { clearTimeout(timeout); }
}
