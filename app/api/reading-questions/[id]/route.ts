import { type NextRequest, NextResponse } from "next/server"
import { getReadingQuestion, updateReadingQuestion, deleteReadingQuestion } from "@/lib/database"
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const question = getReadingQuestion(id)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error("Get reading question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { title, passage, questions } = await request.json()

    if (!title || !passage || !questions) {
      return NextResponse.json({ error: "Title, passage, and questions are required" }, { status: 400 })
    }

    console.log("📝 Updating reading question ID:", id)

    const success = updateReadingQuestion(id, title, passage, questions)

    if (!success) {
      return NextResponse.json({ error: "Question not found or update failed" }, { status: 404 })
    }

    console.log("✅ Reading question updated successfully")

    return NextResponse.json({
      success: true,
      message: "Reading question updated successfully",
    })
  } catch (error) {
    console.error("Error updating reading question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    console.log("🗑️ Deleting reading question ID:", id)

    const success = deleteReadingQuestion(id)

    if (!success) {
      return NextResponse.json({ error: "Question not found or delete failed" }, { status: 404 })
    }

    console.log("✅ Reading question deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Reading question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting reading question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
