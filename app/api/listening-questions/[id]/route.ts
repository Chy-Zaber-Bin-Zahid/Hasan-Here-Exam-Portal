import { type NextRequest, NextResponse } from "next/server"
import { getListeningQuestionById } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const question = getListeningQuestionById(id)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Get listening question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
