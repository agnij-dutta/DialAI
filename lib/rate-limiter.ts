export class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastCallTime = 0
  private minInterval = 1000 // Minimum time between API calls in ms

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeToWait = Math.max(0, this.lastCallTime + this.minInterval - now)
      
      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait))
      }

      const fn = this.queue.shift()
      if (fn) {
        try {
          await fn()
        } catch (error) {
          console.error('Rate limiter error:', error)
        }
      }
      
      this.lastCallTime = Date.now()
    }

    this.processing = false
  }
}

export const rateLimiter = new RateLimiter()

