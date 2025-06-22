import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const { examType, examId, examTitle, examineeName, examineeId, answers, pdfData, timeSpent } = await request.json()

    console.log("📝 Exam submission received:", {
      examType,
      examId,
      examTitle,
      examineeName,
      examineeId,
      timeSpent,
    })

    if (!pdfData || !examineeName || !examineeId) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfData.split(",")[1], "base64")

    // Create folder structure: storage/name_id/examType/
    const folderName = `${examineeName}_${examineeId}`
    const storagePath = join(process.cwd(), "storage", folderName, examType)

    // Ensure directory exists
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true })
      console.log("📁 Created folder:", storagePath)
    }

    // Generate PDF filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${examTitle || examType}_${timestamp}.pdf`
    const fullPath = join(storagePath, filename)
    const relativePath = `storage/${folderName}/${examType}/${filename}`

    // Save PDF file
    writeFileSync(fullPath, pdfBuffer)
    console.log("💾 PDF saved to:", fullPath)

    // Save to database with correct column names
    const db = getDatabase()

    const insertSubmission = db.prepare(`
      INSERT INTO exam_submissions 
      (examinee_name, examinee_id, exam_type, exam_id, exam_title, answers, pdf_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertSubmission.run(
      examineeName,
      examineeId,
      examType,
      examId || 0,
      examTitle || `${examType}_exam`,
      JSON.stringify(answers),
      relativePath,
    )

    console.log("✅ Exam submission saved to database with ID:", result.lastInsertRowid)

    return NextResponse.json({
      success: true,
      submissionId: result.lastInsertRowid,
      pdfPath: relativePath,
      folderPath: `storage/${folderName}/${examType}/`,
      message: "Exam submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting exam:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
