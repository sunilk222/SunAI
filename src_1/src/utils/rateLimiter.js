const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 5;

const buckets = {};

export function checkRateLimit(action) {
  const now = Date.now();
  if (!buckets[action]) buckets[action] = [];

  buckets[action] = buckets[action].filter((t) => now - t < WINDOW_MS);

  if (buckets[action].length >= MAX_PER_WINDOW) {
    const oldest = buckets[action][0];
    const waitSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, waitSec };
  }

  buckets[action].push(now);
  return { allowed: true, waitSec: 0 };
}
