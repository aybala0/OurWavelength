import Redis from 'ioredis'

const client = new Redis(process.env.REDIS_URL!)

// Wrapper with the same interface used throughout the app
export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const val = await client.get(key)
    if (!val) return null
    return JSON.parse(val) as T
  },
  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    const str = JSON.stringify(value)
    if (options?.ex) {
      await client.set(key, str, 'EX', options.ex)
    } else {
      await client.set(key, str)
    }
  },
}
