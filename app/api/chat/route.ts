import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Prepare the chat prompt
    const prompt = messages
      .map((msg: any) => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`)
      .join('\n') + '\nAssistant:'

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error('Empty response from AI')
    }

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response' },
      { status: 500 }
    )
  }
}

