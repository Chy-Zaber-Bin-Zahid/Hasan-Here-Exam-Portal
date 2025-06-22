import { type NextRequest, NextResponse } from "next/server"
import { getListeningQuestion, updateListeningQuestion, deleteListeningQuestion } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const question = getListeningQuestion(id)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Get listening question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { title, audio_url, text, questions } = await request.json()

    if (!title || !audio_url || !questions) {
      return NextResponse.json({ error: "Title, audio URL, and questions are required" }, { status: 400 })
    }

    console.log("📝 Updating listening question ID:", id)

    const success = updateListeningQuestion(id, title, audio_url, text || "", questions)

    if (!success) {
      return NextResponse.json({ error: "Question not found or update failed" }, { status: 404 })
    }

    console.log("✅ Listening question updated successfully")

    return NextResponse.json({
      success: true,
      message: "Listening question updated successfully",
    })
  } catch (error) {
    console.error("Error updating listening question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    console.log("🗑️ Deleting listening question ID:", id)

    const success = deleteListeningQuestion(id)

    if (!success) {
      return NextResponse.json({ error: "Question not found or delete failed" }, { status: 404 })
    }

    console.log("✅ Listening question deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Listening question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting listening question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
