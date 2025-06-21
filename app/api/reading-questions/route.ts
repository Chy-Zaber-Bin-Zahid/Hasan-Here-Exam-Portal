import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, getAllReadingQuestions } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // const token = request.cookies.get("auth-token")?.value
    // const user = token ? verifyToken(token) : null

    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // const db = getDatabase()

    // // Get reading questions with their question items
    // const questions = db
    //   .prepare(`
    //   SELECT rq.*, u.full_name as creator_name
    //   FROM reading_questions rq
    //   JOIN users u ON rq.created_by = u.id
    //   ORDER BY rq.created_at DESC
    // `)
    //   .all() as (ReadingQuestion & { creator_name: string })[]

    // // Get question items for each reading question
    // for (const question of questions) {
    //   const items = db
    //     .prepare(`
    //     SELECT * FROM reading_question_items
    //     WHERE reading_question_id = ?
    //     ORDER BY order_index
    //   `)
    //     .all(question.id) as ReadingQuestionItem[]

    //   // Parse options JSON
    //   question.questions = items.map((item) => ({
    //     ...item,
    //     options: item.options ? JSON.parse(item.options) : undefined,
    //   }))
    // }

    const questions = getAllReadingQuestions()

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching reading questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // const token = request.cookies.get("auth-token")?.value
    // const user = token ? verifyToken(token) : null

    // if (!user || user.role !== "teacher") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const session = request.cookies.get("session")?.value

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real application, you would verify the session cookie
    // and retrieve the user's role from the session data.
    // For this example, we'll assume the session cookie is valid
    // and the user has the "teacher" role.
    const user = {
      id: "fake-user-id", // Replace with actual user ID from session
      role: "teacher",
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, passage, questions } = await request.json()

    if (!title || !passage || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Title, passage, and questions are required" }, { status: 400 })
    }

    const db = getDatabase()

    // Start transaction
    const transaction = db.transaction(() => {
      // Insert reading question
      const insertQuestion = db.prepare(`
        INSERT INTO reading_questions (title, passage, created_by)
        VALUES (?, ?, ?)
      `)

      const result = insertQuestion.run(title, passage, user.id)
      const questionId = result.lastInsertRowid

      // Insert question items
      const insertItem = db.prepare(`
        INSERT INTO reading_question_items 
        (reading_question_id, question_text, question_type, options, correct_answer, points, order_index)
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
      message: "Reading question created successfully",
    })
  } catch (error) {
    console.error("Error creating reading question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
