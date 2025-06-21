import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { getAllWritingQuestions } from "@/lib/database"

export async function GET() {
  try {
    const questions = await getAllWritingQuestions()

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Get writing questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // const token = request.cookies.get("auth-token")?.value
    // const user = token ? verifyToken(token) : null
    const user = {
      id: 1,
      role: "teacher",
    }

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, prompt, instructions, wordLimit, timeLimit } = await request.json()

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and prompt are required" }, { status: 400 })
    }

    const db = getDatabase()

    const insertQuestion = db.prepare(`
      INSERT INTO writing_questions (title, prompt, instructions, word_limit, time_limit, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = insertQuestion.run(
      title,
      prompt,
      instructions || null,
      wordLimit || null,
      timeLimit || null,
      user.id,
    )

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: "Writing question created successfully",
    })
  } catch (error) {
    console.error("Error creating writing question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
