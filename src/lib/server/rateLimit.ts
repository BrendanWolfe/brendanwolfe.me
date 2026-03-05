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

const buckets = new Map<string, number[]>();

function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function takeRateLimit(rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const scopedKey = `${rule.key}:${rule.windowMs}:${rule.max}`;
  const existing = buckets.get(scopedKey) ?? [];
  const valid = pruneTimestamps(existing, rule.windowMs, now);

  if (valid.length >= rule.max) {
    const oldest = valid[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000));
    buckets.set(scopedKey, valid);

    return {
      allowed: false,
      retryAfterSeconds
    };
  }

  valid.push(now);
  buckets.set(scopedKey, valid);

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
