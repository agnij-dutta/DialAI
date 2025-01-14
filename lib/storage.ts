import { Call } from "@/types/chat"

const STORAGE_KEY = 'dialai_calls'

export const storage = {
  saveCalls(calls: { [key: string]: Call }) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calls))
  },

  loadCalls(): { [key: string]: Call } {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error loading calls from storage:', error)
      return {}
    }
  },

  clearCalls() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }
}

