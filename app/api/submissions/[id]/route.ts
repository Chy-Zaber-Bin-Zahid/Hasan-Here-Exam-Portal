import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, deleteExamSubmission } from "@/lib/database"
import { deleteSubmissionAndCleanUp } from "@/lib/file-storage"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const db = getDatabase();

    // First, get the submission record to find the PDF path
    const submission = db.prepare("SELECT pdf_path FROM exam_submissions WHERE id = ?").get(id) as { pdf_path: string };

    if (submission && submission.pdf_path) {
      // FIX: Call the new cleanup function
      deleteSubmissionAndCleanUp(submission.pdf_path);
    }

    // Now, delete the database record
    const success = deleteExamSubmission(id)

    if (!success) {
      if (!submission) {
        return NextResponse.json({ success: true, message: "Submission already deleted." });
      }
      return NextResponse.json({ error: "Submission not found or delete failed" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}