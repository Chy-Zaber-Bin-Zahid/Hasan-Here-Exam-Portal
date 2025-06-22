import { type NextRequest, NextResponse } from "next/server"
import { getWritingQuestion, updateWritingQuestion, deleteWritingQuestion } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const question = getWritingQuestion(id)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Get writing question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { title, prompt, instructions, word_limit } = await request.json()

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and prompt are required" }, { status: 400 })
    }

    console.log("📝 Updating writing question ID:", id)

    const success = updateWritingQuestion(id, title, prompt, instructions || "", word_limit || 500)

    if (!success) {
      return NextResponse.json({ error: "Question not found or update failed" }, { status: 404 })
    }

    console.log("✅ Writing question updated successfully")

    return NextResponse.json({
      success: true,
      message: "Writing question updated successfully",
    })
  } catch (error) {
    console.error("Error updating writing question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    console.log("🗑️ Deleting writing question ID:", id)

    const success = deleteWritingQuestion(id)

    if (!success) {
      return NextResponse.json({ error: "Question not found or delete failed" }, { status: 404 })
    }

    console.log("✅ Writing question deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Writing question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting writing question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
