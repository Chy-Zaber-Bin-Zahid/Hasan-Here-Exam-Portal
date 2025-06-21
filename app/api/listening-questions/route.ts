import { type NextRequest, NextResponse } from "next/server"
import { getListeningQuestions, createListeningQuestion } from "@/lib/database"

export async function GET() {
  try {
    const questions = getListeningQuestions()
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching listening questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, audio_url, text, questions } = await request.json()

    if (!title || !audio_url || !questions) {
      return NextResponse.json({ error: "Title, audio URL, and questions are required" }, { status: 400 })
    }

    console.log("💾 Creating listening question:", { title, audio_url })

    const newQuestion = createListeningQuestion(title, audio_url, text || "", questions)

    console.log("✅ Listening question created with ID:", newQuestion.id)

    return NextResponse.json({
      success: true,
      id: newQuestion.id,
      message: "Listening question created successfully",
    })
  } catch (error) {
    console.error("Error creating listening question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
