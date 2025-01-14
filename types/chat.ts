export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface Call {
  id: string
  status: 'active' | 'completed' | 'failed' | 'scheduled'
  startTime: number
  endTime?: number
  messages: Message[]
  summary?: string
  sentiment?: string
  nextFollowUp?: Date
  assistantName?: string
  customerInfo?: {
    name?: string
    company?: string
    email?: string
    phone?: string
  }
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  content: string
  prompt: string
}

export interface CallState {
  calls: { [key: string]: Call }
  activeCallId?: string
  knowledgeBase: KnowledgeBase[]
  activeKnowledgeBaseId?: string
}

