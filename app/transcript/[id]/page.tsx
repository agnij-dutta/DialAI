"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { useCallStore } from "@/lib/store"

export default function TranscriptPage({ params }: { params: { id: string } }) {
  const { calls } = useCallStore()
  const call = calls[params.id]

  if (!call) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Transcript not found</h1>
          <p className="text-muted-foreground mt-2">The requested call transcript could not be found.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Call Transcript #{params.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {call.messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-4"
                >
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-medium">
                      {message.role === "assistant" ? "AI Assistant" : "Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex-1 bg-muted p-4 rounded-lg">
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

