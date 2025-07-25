import { type NextRequest, NextResponse } from "next/server"
import { getListeningQuestion, updateListeningQuestion, deleteListeningQuestion } from "@/lib/database"
import { deleteAudioFile } from "@/lib/file-storage"
export const dynamic = 'force-dynamic'
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
    const { title, audio_url, text, questions, old_audio_to_delete } = await request.json()

    if (!title || !audio_url || !questions) {
      return NextResponse.json({ error: "Title, audio URL, and questions are required" }, { status: 400 })
    }

    console.log("📝 Updating listening question ID:", id)

    // Ensure questions are stringified before updating
    const questionsString = typeof questions === 'string' ? questions : JSON.stringify(questions);

    const success = updateListeningQuestion(id, title, audio_url, text || "", questionsString)

    if (!success) {
      return NextResponse.json({ error: "Question not found or update failed" }, { status: 404 })
    }
    
    // If the update was successful and there's an old audio file to delete, delete it.
    if (old_audio_to_delete) {
        console.log("🗑️ Deleting old audio file:", old_audio_to_delete);
        deleteAudioFile(old_audio_to_delete);
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

    // FIX: Get question details to find the audio file before deleting the DB record
    const questionToDelete = getListeningQuestion(id);

    if (!questionToDelete) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Delete the associated audio file
    if (questionToDelete.audio_url) {
        const filename = questionToDelete.audio_url.split('/').pop();
        if (filename) {
            deleteAudioFile(filename);
        }
    }

    // Now delete the database record
    const success = deleteListeningQuestion(id)

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