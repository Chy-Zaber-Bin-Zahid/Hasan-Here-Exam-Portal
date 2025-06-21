import { type NextRequest, NextResponse } from "next/server"
import { savePDFFile, removeActiveExamMarker } from "@/lib/file-storage"
import { getDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { examType, examId, examTitle, examineeName, examineeId, answers, pdfData, timeSpent } = await request.json()

    if (!pdfData || !examineeName || !examineeId) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfData.split(",")[1], "base64")

    // Save PDF file in the proper folder structure: storage/name_id/examType/
    const { filename, path, fullPath } = savePDFFile(
      pdfBuffer,
      examType,
      examineeName,
      examineeId,
      examTitle || `${examType}_exam`,
    )

    // Remove active exam marker
    removeActiveExamMarker(examineeName, examineeId, examType)

    // Save exam submission to database
    const db = getDatabase()

    const insertSubmission = db.prepare(`
      INSERT INTO exam_submissions 
      (exam_type, exam_id, examinee_name, examinee_id, exam_title, answers_json, pdf_filename, pdf_path, time_spent, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertSubmission.run(
      examType,
      examId,
      examineeName,
      examineeId,
      examTitle,
      JSON.stringify(answers),
      filename,
      path,
      timeSpent,
      new Date().toISOString(),
    )

    return NextResponse.json({
      success: true,
      submissionId: result.lastInsertRowid,
      pdfPath: path,
      folderPath: `storage/${examineeName}_${examineeId}/${examType}/`,
      message: "Exam submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting exam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
