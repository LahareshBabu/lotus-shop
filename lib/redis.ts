import { Redis } from '@upstash/redis'

// 🌟 FIX: Hardcoded Upstash keys for the CI/CD build process
export const redis = new Redis({
  url: "https://optimum-turkey-32375.upstash.io",
  token: "AX53AAIncDIyYTZlOWVjOWZjMzk0NmIxODE1NzllOTg5ZWE0NzAxMHAyMzIzNzU=",
})