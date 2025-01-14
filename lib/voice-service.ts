declare class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onaudiostart: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start(): void;
  stop(): void;
}

// Types for the Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null
  private synthesis!: SpeechSynthesis
  private isListening: boolean = false
  private onTranscript: ((text: string) => void) | null = null
  private voices: SpeechSynthesisVoice[] = []
  private silenceTimer: NodeJS.Timeout | null = null
  private lastSpeechTime: number = Date.now()
  private SILENCE_THRESHOLD = 3000 // 3 seconds of silence
  private restartTimeout: NodeJS.Timeout | null = null
  private voicesLoaded: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
      this.synthesis = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    const loadVoicesCallback = () => {
      this.voices = this.synthesis.getVoices()
      this.voicesLoaded = true
      speechSynthesis.removeEventListener('voiceschanged', loadVoicesCallback)
    }

    // Try immediate load
    this.voices = this.synthesis.getVoices()
    if (this.voices.length > 0) {
      this.voicesLoaded = true
    } else {
      // Wait for voices to load
      speechSynthesis.addEventListener('voiceschanged', loadVoicesCallback)
    }
  }

  private async ensureVoicesLoaded(): Promise<void> {
    if (this.voicesLoaded) return

    return new Promise((resolve) => {
      const checkVoices = () => {
        if (this.voicesLoaded) {
          resolve()
        } else {
          setTimeout(checkVoices, 100)
        }
      }
      checkVoices()
    })
  }

  private getBestVoice(): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices()
    return voices.find(voice => 
      voice.lang.includes('en') && 
      voice.name.toLowerCase().includes('female')
    ) || voices[0] || null
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    this.recognition.onstart = () => {
      this.lastSpeechTime = Date.now()
      this.startSilenceDetection()
    }

    this.recognition.onresult = (event) => {
      this.lastSpeechTime = Date.now()
      
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript && this.onTranscript) {
        this.onTranscript(finalTranscript)
      }
    }

    this.recognition.onaudiostart = () => {
      this.lastSpeechTime = Date.now()
    }

    this.recognition.onaudioend = () => {
      // Don't immediately check silence, wait a bit
      setTimeout(() => this.checkSilence(), 500)
    }

    this.recognition.onend = () => {
      if (this.isListening) {
        // Add a small delay before restarting to prevent rapid restarts
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout)
        }
        this.restartTimeout = setTimeout(() => {
          if (this.isListening) {
            this.recognition?.start()
          }
        }, 300)
      }
    }

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setTimeout(() => this.checkSilence(), 500)
        return
      }
      console.error('Speech recognition error:', event.error)
      
      // Attempt to recover from errors by restarting
      if (this.isListening) {
        this.stopListening()
        setTimeout(() => {
          if (this.onTranscript) {
            this.startListening(this.onTranscript)
          }
        }, 1000)
      }
    }
  }

  private startSilenceDetection() {
    if (this.silenceTimer) {
      clearInterval(this.silenceTimer)
    }
    this.silenceTimer = setInterval(() => {
      this.checkSilence()
    }, 1000)
  }

  private checkSilence() {
    const timeSinceLastSpeech = Date.now() - this.lastSpeechTime
    if (timeSinceLastSpeech > this.SILENCE_THRESHOLD) {
      if (this.onTranscript) {
        this.onTranscript('') // Signal silence detected
      }
    }
  }

  startListening(onTranscript: (text: string) => void) {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    // Clean up any existing state
    this.stopListening()
    
    // Small delay before starting new recognition
    setTimeout(() => {
      this.onTranscript = onTranscript
      this.recognition?.start()
      this.isListening = true
      this.lastSpeechTime = Date.now()
      this.startSilenceDetection()
    }, 100)
  }

  stopListening() {
    if (this.recognition) {
      this.isListening = false
      this.recognition.stop()
      
      if (this.silenceTimer) {
        clearInterval(this.silenceTimer)
        this.silenceTimer = null
      }
      
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout)
        this.restartTimeout = null
      }
      
      this.onTranscript = null
    }
  }

  async speak(text: string): Promise<void> {
    await this.ensureVoicesLoaded()
    
    return new Promise((resolve, reject) => {
      try {
        const wasListening = this.isListening
        const previousOnTranscript = this.onTranscript
        
        // Temporarily pause recognition while speaking
        this.stopListening()

        const utterance = new SpeechSynthesisUtterance(text)
        
        // Try to get a voice, but don't fail if we can't
        const voice = this.getBestVoice()
        if (voice) {
          utterance.voice = voice
        }
        
        utterance.rate = 0.9 // Slightly slower for better clarity
        utterance.pitch = 1
        utterance.volume = 1

        let retryCount = 0
        const maxRetries = 3

        const trySpeak = () => {
          utterance.onend = () => {
            // Resume recognition after speaking if it was active before
            if (wasListening && previousOnTranscript) {
              setTimeout(() => {
                this.startListening(previousOnTranscript)
              }, 300)
            }
            resolve()
          }
          
          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error)
            
            if (retryCount < maxRetries) {
              retryCount++
              console.log(`Retrying speech synthesis (attempt ${retryCount})...`)
              
              // Try with default voice on retry
              utterance.voice = null
              
              // Wait a bit before retrying
              setTimeout(() => {
                this.synthesis.cancel()
                trySpeak()
              }, 100 * retryCount)
            } else {
              // If all retries fail, just resolve without speaking
              console.warn('Speech synthesis failed after retries, continuing without voice')
              if (wasListening && previousOnTranscript) {
                setTimeout(() => {
                  this.startListening(previousOnTranscript)
                }, 300)
              }
              resolve()
            }
          }

          // Cancel any ongoing speech
          this.synthesis.cancel()
          
          // Chrome requires a timeout after cancel
          setTimeout(() => {
            this.synthesis.speak(utterance)
          }, 50)
        }

        trySpeak()
      } catch (error) {
        console.error('Speech synthesis setup error:', error)
        // Don't reject, just resolve and continue without voice
        resolve()
      }
    })
  }

  cancel() {
    this.synthesis.cancel()
    this.stopListening()
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }
}

export const voiceService = new VoiceService()

