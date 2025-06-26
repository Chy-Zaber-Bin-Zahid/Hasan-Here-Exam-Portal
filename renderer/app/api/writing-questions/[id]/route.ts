import { type NextRequest, NextResponse } from "next/server";
import { deleteWritingQuestion, getWritingQuestion, updateWritingQuestion } from "../../../../lib/database";
import { deleteImageFile } from "../../../../lib/file-storage";

export async function generateStaticParams() {
  return [];
}

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
    // Destructure new field from the request
    const { title, prompt, instructions, word_limit, old_image_to_delete } = await request.json()

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and prompt are required" }, { status: 400 })
    }

    console.log("📝 Updating writing question ID:", id)

    const success = updateWritingQuestion(id, title, prompt, instructions || "", word_limit || 0)

    if (!success) {
      return NextResponse.json({ error: "Question not found or update failed" }, { status: 404 })
    }
    
    // If the update was successful and there's an old image to delete, delete it.
    if (old_image_to_delete) {
        console.log("🗑️ Deleting old image:", old_image_to_delete);
        deleteImageFile(old_image_to_delete);
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
    
    const questionToDelete = getWritingQuestion(id);
    if (questionToDelete && questionToDelete.instructions) {
        try {
            const details = JSON.parse(questionToDelete.instructions);
            if (details.imageUrl) {
                const filename = details.imageUrl.split('/').pop();
                if (filename) {
                    deleteImageFile(filename);
                }
            }
        } catch(e) {
            console.error("Could not parse instructions to find image for deletion:", e);
        }
    }


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