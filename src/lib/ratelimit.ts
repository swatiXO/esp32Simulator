import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * AI generation endpoint — 10 requests per user per minute.
 * Prevents billing abuse on the Gemini API.
 */
export const generateBlocksLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:generate-blocks',
})

/**
 * Kit code redemption — 5 attempts per user per 15 minutes.
 * Prevents brute-force enumeration of activation codes.
 */
export const redeemLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:redeem',
})

/**
 * Auth actions (login, signup) — 10 attempts per IP per 10 minutes.
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})
