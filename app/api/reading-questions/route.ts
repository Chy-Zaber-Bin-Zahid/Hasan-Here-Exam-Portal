import { type NextRequest, NextResponse } from "next/server"
import { getReadingQuestions, createReadingQuestion } from "@/lib/database"

export async function GET() {
  try {
    const questions = getReadingQuestions()
    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching reading questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, passage, questions } = await request.json()

    if (!title || !passage || !questions) {
      return NextResponse.json({ error: "Title, passage, and questions are required" }, { status: 400 })
    }

    console.log("💾 Creating reading question:", { title, passage: passage.substring(0, 50) + "..." })

    const newQuestion = createReadingQuestion(title, passage, questions)

    console.log("✅ Reading question created with ID:", newQuestion.id)

    return NextResponse.json({
      success: true,
      id: newQuestion.id,
      message: "Reading question created successfully",
    })
  } catch (error) {
    console.error("Error creating reading question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
