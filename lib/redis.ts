import { Redis } from '@upstash/redis'

// Reading keys safely from .env.local instead of hardcoding them
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})