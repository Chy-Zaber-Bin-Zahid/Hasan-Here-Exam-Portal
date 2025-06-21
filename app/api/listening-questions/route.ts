import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAllListeningQuestions } from "@/lib/actions/listening-question.actions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const questions = await getAllListeningQuestions()

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching listening questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, audioUrl, audioFilename, audioSize, questions } = await request.json()

    if (!title || !audioUrl || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Title, audio, and questions are required" }, { status: 400 })
    }

    const db = getDatabase()

    const transaction = db.transaction(() => {
      const insertQuestion = db.prepare(`
        INSERT INTO listening_questions (title, audio_url, audio_filename, audio_size, created_by)
        VALUES (?, ?, ?, ?, ?)
      `)

      const result = insertQuestion.run(title, audioUrl, audioFilename, audioSize, session.user.id)
      const questionId = result.lastInsertRowid

      const insertItem = db.prepare(`
        INSERT INTO listening_question_items 
        (listening_question_id, question_text, question_type, options, correct_answer, points, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      questions.forEach((item: any, index: number) => {
        insertItem.run(
          questionId,
          item.text,
          item.type || "short_answer",
          item.options ? JSON.stringify(item.options) : null,
          item.correctAnswer || null,
          item.points || 1,
          index,
        )
      })

      return questionId
    })

    const questionId = transaction()

    return NextResponse.json({
      success: true,
      id: questionId,
      message: "Listening question created successfully",
    })
  } catch (error) {
    console.error("Error creating listening question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
