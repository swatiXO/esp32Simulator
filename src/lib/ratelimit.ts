import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * AI generation endpoint — 10 requests per user per minute.
 * Prevents billing abuse on the Gemini API.
 */
export const generateBlocksLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:generate-blocks',
});

/**
 * AI code explainer — 20 requests per user per hour.
 */
export const explainCodeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:explain-code',
});

/**
 * AI quiz generator — 10 requests per user per hour.
 */
export const generateQuizLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:generate-quiz',
});

/**
 * Kit code redemption — 5 attempts per user per 15 minutes.
 * Prevents brute-force enumeration of activation codes.
 */
export const redeemLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:redeem',
});
