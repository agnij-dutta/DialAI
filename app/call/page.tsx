"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useCallStore } from "@/lib/store"
import { formatDuration } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function CallPage() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  
  const {
    calls,
    activeCallId,
    error,
    isListening,
    isSpeaking,
    startCall,
    endCall,
    sendMessage,
    toggleListening,
    clearError
  } = useCallStore()

  const activeCall = activeCallId ? calls[activeCallId] : null
  const messages = activeCall?.messages || []

  useEffect(() => {
    // Request microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setPermissionGranted(true))
        .catch(() => {
          toast.error("Microphone access is required for voice calls")
          setPermissionGranted(false)
        })
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleStartCall = async () => {
    if (!permissionGranted) {
      toast.error("Please grant microphone access to start the call")
      return
    }
    try {
      await startCall()
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const handleEndCall = () => {
    if (activeCallId) {
      endCall(activeCallId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeCallId) return

    try {
      await sendMessage(input.trim())
      setInput("")
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-lg border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-8">
              {/* AI Avatar */}
              <motion.div 
                className={cn(
                  "relative w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center",
                  (isListening || isSpeaking) && "ring-4 ring-blue-500 ring-opacity-50"
                )}
                animate={{
                  scale: (isListening || isSpeaking) ? [1, 1.05, 1] : 1,
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="text-4xl font-bold">AI</span>
                {(isListening || isSpeaking) && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-500"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </motion.div>

              {/* Status */}
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  {activeCall?.assistantName || 'AI Assistant'}
                </h2>
                <p className={cn(
                  "text-sm",
                  activeCall ? "text-green-400" : "text-gray-400"
                )}>
                  {activeCall ? (
                    isListening ? "Listening..." : 
                    isSpeaking ? "Speaking..." : 
                    "Call in progress..."
                  ) : "Ready to call"}
                </p>
              </div>

              {/* Messages */}
              <div className="w-full max-h-[50vh] overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-4 py-2 text-sm",
                        message.role === "user" 
                          ? "ml-auto bg-blue-600 text-white" 
                          : "bg-gray-700 text-gray-100"
                      )}
                    >
                      {message.content}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              {activeCall && (
                <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                  <input
                    className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isListening || isSpeaking}
                  />
                  <Button 
                    type="submit" 
                    disabled={isListening || isSpeaking}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send
                  </Button>
                </form>
              )}

              {/* Control Buttons */}
              <div className="flex space-x-4">
                <Button
                  size="icon"
                  variant={isListening ? "destructive" : "secondary"}
                  className={cn(
                    "rounded-full w-12 h-12 transition-all duration-200",
                    isListening && "animate-pulse"
                  )}
                  onClick={toggleListening}
                  disabled={!activeCall || isSpeaking}
                >
                  {isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant={activeCall ? "destructive" : "default"}
                  className="rounded-full w-12 h-12 transition-all duration-200"
                  onClick={activeCall ? handleEndCall : handleStartCall}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : activeCall ? (
                    <PhoneOff className="h-6 w-6" />
                  ) : (
                    <Phone className="h-6 w-6" />
                  )}
                </Button>
              </div>

              {/* Call Info */}
              <div className="text-center text-sm text-gray-400">
                {activeCall ? (
                  <div className="space-y-1">
                    <p>Call duration: {formatDuration(Math.floor((Date.now() - activeCall.startTime) / 1000))}</p>
                    <p>Status: {activeCall.status}</p>
                  </div>
                ) : (
                  <p>Press the phone button to start the call</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

