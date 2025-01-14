import { create } from 'zustand'
import { CallState, Call, Message, KnowledgeBase } from '@/types/chat'
import { chatService } from './chat-service'
import { voiceService } from './voice-service'
import { storage } from './storage'

interface ChatStore extends CallState {
  error: string | null
  isListening: boolean
  isSpeaking: boolean
  startCall: () => Promise<string>
  endCall: (callId: string) => void
  sendMessage: (content: string, useVoice?: boolean) => Promise<void>
  toggleListening: () => void
  clearError: () => void
  setActiveKnowledgeBase: (id: string) => void
  addKnowledgeBase: (kb: Omit<KnowledgeBase, 'id'>) => void
  updateKnowledgeBase: (kb: KnowledgeBase) => void
}

export const useCallStore = create<ChatStore>((set, get) => ({
  calls: storage.loadCalls(),
  activeCallId: undefined,
  error: null,
  isListening: false,
  isSpeaking: false,
  knowledgeBase: chatService.getKnowledgeBase(),
  activeKnowledgeBaseId: 'default',

  clearError: () => set({ error: null }),

  setActiveKnowledgeBase: (id: string) => {
    set({ activeKnowledgeBaseId: id })
  },

  addKnowledgeBase: (kb: Omit<KnowledgeBase, 'id'>) => {
    const newKb = chatService.addKnowledgeBase(kb)
    set(state => ({
      knowledgeBase: [...state.knowledgeBase, newKb]
    }))
  },

  updateKnowledgeBase: (kb: KnowledgeBase) => {
    chatService.updateKnowledgeBase(kb)
    set(state => ({
      knowledgeBase: state.knowledgeBase.map(k => k.id === kb.id ? kb : k)
    }))
  },

  toggleListening: () => {
    const state = get()
    const { isListening, activeCallId, sendMessage } = state

    if (!activeCallId) return

    if (isListening) {
      voiceService.stopListening()
      set({ isListening: false })
    } else {
      voiceService.startListening(async (text) => {
        if (text.trim()) {
          await sendMessage(text, true)
        }
      })
      set({ isListening: true })
    }
  },

  startCall: async () => {
    try {
      const callId = Math.random().toString(36).substring(7)
      const { greeting, agentName } = await chatService.startNewConversation()

      const newCall: Call = {
        id: callId,
        status: 'active',
        startTime: Date.now(),
        messages: [{
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: greeting,
          timestamp: Date.now(),
          agentName
        }],
        assistantName: agentName
      }

      set(state => {
        const newState = {
          calls: { ...state.calls, [callId]: newCall },
          activeCallId: callId,
          error: null
        }
        storage.saveCalls(newState.calls)
        return newState
      })

      // Ensure voices are loaded before speaking
      await voiceService.speak(greeting)

      return callId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  endCall: async (callId: string) => {
    try {
      const state = get()
      const call = state.calls[callId]

      const summary = await chatService.generateSummary(call.messages)

      set(state => {
        const newState = {
          calls: {
            ...state.calls,
            [callId]: {
              ...state.calls[callId],
              status: 'completed',
              endTime: Date.now(),
              summary
            }
          },
          activeCallId: undefined,
          error: null
        }
        storage.saveCalls(newState.calls)
        return newState
      })

      voiceService.cancel()
      voiceService.stopListening()
      set({ isListening: false, isSpeaking: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end call'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  sendMessage: async (content: string, useVoice = true) => {
    const state = get()
    const { activeCallId, calls, activeKnowledgeBaseId } = state

    if (!activeCallId || !calls[activeCallId]) {
      const error = 'No active call found'
      set({ error })
      throw new Error(error)
    }

    const userMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content,
      timestamp: Date.now()
    }

    try {
      // First update state with user message
      set(state => {
        const newState = {
          calls: {
            ...state.calls,
            [activeCallId]: {
              ...state.calls[activeCallId],
              messages: [...state.calls[activeCallId].messages, userMessage]
            }
          },
          error: null
        }
        storage.saveCalls(newState.calls)
        return newState
      })

      // Generate AI response
      const response = await chatService.generateResponse(
        [...calls[activeCallId].messages, userMessage],
        activeKnowledgeBaseId
      )

      const assistantMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        agentName: calls[activeCallId].assistantName
      }

      // Update state with AI response
      set(state => {
        const newState = {
          calls: {
            ...state.calls,
            [activeCallId]: {
              ...state.calls[activeCallId],
              messages: [...state.calls[activeCallId].messages, assistantMessage]
            }
          }
        }
        storage.saveCalls(newState.calls)
        return newState
      })

      // Speak the response if voice is enabled
      if (useVoice) {
        await voiceService.speak(response)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  }
}))

