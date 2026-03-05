import { createHash } from 'node:crypto';

interface RateLimitRule {
  key: string;
  max: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

interface RateLimitBucket {
  timestamps: number[];
  windowMs: number;
}

const buckets = new Map<string, RateLimitBucket>();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanupAt = 0;

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function maybeCleanupStaleBuckets(now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    const valid = pruneTimestamps(bucket.timestamps, bucket.windowMs, now);

    if (valid.length === 0) {
      buckets.delete(key);
      continue;
    }

    bucket.timestamps = valid;
    buckets.set(key, bucket);
  }

  lastCleanupAt = now;
}

function takeRateLimit(rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  maybeCleanupStaleBuckets(now);

  const scopedKey = `${rule.key}:${rule.windowMs}:${rule.max}`;
  const existing = buckets.get(scopedKey);
  const valid = pruneTimestamps(existing?.timestamps ?? [], rule.windowMs, now);

  if (valid.length >= rule.max) {
    const oldest = valid[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000));
    buckets.set(scopedKey, {
      timestamps: valid,
      windowMs: rule.windowMs
    });

    return {
      allowed: false,
      retryAfterSeconds
    };
  }

  valid.push(now);
  buckets.set(scopedKey, {
    timestamps: valid,
    windowMs: rule.windowMs
  });

  return {
    allowed: true
  };
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
}

export function checkContactRateLimit(clientIp: string, email: string): RateLimitResult {
  const rules: RateLimitRule[] = [
    {
      key: `ip-short:${clientIp}`,
      max: 5,
      windowMs: 10 * 60 * 1000
    },
    {
      key: `ip-long:${clientIp}`,
      max: 30,
      windowMs: 24 * 60 * 60 * 1000
    },
    {
      key: `email:${hashEmail(email)}`,
      max: 3,
      windowMs: 60 * 60 * 1000
    }
  ];

  for (const rule of rules) {
    const result = takeRateLimit(rule);
    if (!result.allowed) {
      return result;
    }
  }

  return {
    allowed: true
  };
}
