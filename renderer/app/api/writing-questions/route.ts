import { type NextRequest, NextResponse } from "next/server"
import { createWritingQuestion, getWritingQuestions } from "../../../lib/database"

export async function GET() {
  try {
    const questions = getWritingQuestions()
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Get writing questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, prompt, instructions, word_limit } = await request.json()

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and prompt are required" }, { status: 400 })
    }

    console.log("💾 Creating writing question:", { title, prompt: prompt.substring(0, 50) + "..." })

    const newQuestion = createWritingQuestion(title, prompt, instructions || "", word_limit || 500)

    console.log("✅ Writing question created with ID:", newQuestion.id)

    return NextResponse.json({
      success: true,
      id: newQuestion.id,
      message: "Writing question created successfully",
    })
  } catch (error) {
    console.error("Error creating writing question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
