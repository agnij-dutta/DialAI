import { GoogleGenerativeAI } from "@google/generative-ai"
import { KnowledgeBase } from "@/types/chat"
import { rateLimiter } from "./rate-limiter"

const DEFAULT_KNOWLEDGE_BASE: KnowledgeBase = {
  id: 'default',
  name: 'DialAI Sales',
  description: 'Default sales pitch for DialAI service',
  content: `
    Product: DialAI - AI-powered Sales Calling Solution
    
    Key Features & Benefits:
    - 24/7 automated cold calling with human-like conversation
    - Real-time analytics and insights
    - 3x faster lead qualification
    - 60% cost reduction vs human agents
    - Instant scalability
    
    Pricing:
    - Starter: $499/month (1000 calls)
    - Professional: $999/month (5000 calls)
    - Enterprise: Custom pricing
    
    Qualification Criteria:
    - Company size: 10+ employees
    - Current sales team: Yes
    - Monthly call volume: 500+
    - Pain points: Scaling sales, cost, consistency
    
    Required Customer Info:
    - Full Name
    - Company Name
    - Email
    - Phone
    - Current Call Volume
  `,
  prompt: `You are an AI sales agent. Be direct, professional, and efficient.

  Key Behaviors:
  1. Keep responses under 2 sentences unless explaining pricing/features
  2. Get to the point quickly - minimize small talk
  3. Qualify leads early using criteria from knowledge base
  4. For interested prospects, collect all required customer info
  5. End call if:
     - Customer is clearly not qualified
     - Customer shows no interest after 2-3 exchanges
     - You've collected all info for a successful sale
     - Call exceeds 5 minutes
  
  Response Guidelines:
  - Start with brief greeting and company intro
  - Focus on benefits over features
  - Use numbers and specifics when discussing ROI
  - Collect customer info naturally in conversation
  - End call professionally with clear next steps
  
  Personality:
  - Professional and direct
  - Solution-focused
  - Time-conscious
  - Confident but not pushy`
}

class ChatService {
  private genAI: GoogleGenerativeAI
  private knowledgeBase: KnowledgeBase[]
  private retryCount = 3
  private retryDelay = 1000
  private agentNames = [
    'Sarah', 'Emma', 'Lisa', 'Anna', 'Rachel',
    'Jessica', 'Emily', 'Sophie', 'Olivia', 'Grace'
  ]

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    this.knowledgeBase = [DEFAULT_KNOWLEDGE_BASE]
  }

  private getRandomAgentName(): string {
    return this.agentNames[Math.floor(Math.random() * this.agentNames.length)]
  }

  async startNewConversation(): Promise<{ greeting: string; agentName: string }> {
    const agentName = this.getRandomAgentName()
    const greeting = `Hello! This is ${agentName} from DialAI. I'm an AI assistant, and I'd love to tell you about our innovative sales calling solution. How are you today?`
    return { greeting, agentName }
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await rateLimiter.add(operation)
      } catch (error: any) {
        lastError = error
        if (error?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
          continue
        }
        throw error
      }
    }
    
    throw lastError
  }

  async generateResponse(messages: { role: string; content: string; agentName?: string }[], knowledgeBaseId?: string): Promise<string> {
    return this.retryOperation(async () => {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
      
      const kb = knowledgeBaseId 
        ? this.knowledgeBase.find(kb => kb.id === knowledgeBaseId) 
        : DEFAULT_KNOWLEDGE_BASE

      const agentName = messages.find(m => m.role === 'assistant')?.agentName || 'Sarah'

      const prompt = `${kb?.prompt}\n\nYou are ${agentName}, an AI sales agent.\n\nKnowledge Base:\n${kb?.content}\n\nConversation History:\n${
        messages.map(msg => `${msg.role === 'assistant' ? agentName : 'Customer'}: ${msg.content}`).join('\n')
      }\n\n${agentName}:`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new Error('Empty response from AI')
      }

      return text
    })
  }

  async analyzeSentiment(text: string): Promise<string> {
    return this.retryOperation(async () => {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
      
      const prompt = `
        Analyze the sentiment of the following text and provide a brief explanation.
        Text: "${text}"
        
        Respond in JSON format:
        {
          "sentiment": "positive|negative|neutral",
          "explanation": "brief explanation"
        }
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  async generateSummary(messages: { role: string; content: string }[]): Promise<string> {
    return this.retryOperation(async () => {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
      
      const prompt = `
        Summarize the following conversation and extract key information.
        
        Conversation:
        ${messages.map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'Customer'}: ${msg.content}`).join('\n')}
        
        Provide summary in JSON format:
        {
          "summary": "brief summary",
          "keyPoints": ["point1", "point2", ...],
          "nextSteps": "recommended next steps",
          "leadQuality": "hot|warm|cold",
          "customerInfo": {
            "name": "if mentioned",
            "company": "if mentioned",
            "email": "if mentioned",
            "phone": "if mentioned"
          }
        }
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })
  }

  getKnowledgeBase(): KnowledgeBase[] {
    return this.knowledgeBase
  }

  addKnowledgeBase(kb: Omit<KnowledgeBase, 'id'>): KnowledgeBase {
    const newKb = {
      ...kb,
      id: Math.random().toString(36).substring(7)
    }
    this.knowledgeBase.push(newKb)
    return newKb
  }

  updateKnowledgeBase(kb: KnowledgeBase): void {
    const index = this.knowledgeBase.findIndex(k => k.id === kb.id)
    if (index >= 0) {
      this.knowledgeBase[index] = kb
    }
  }
}

export const chatService = new ChatService()

