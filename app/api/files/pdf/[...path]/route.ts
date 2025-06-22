import { type NextRequest, NextResponse } from "next/server"
import { getPDFFile } from "@/lib/file-storage"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const [examineeName_Id, examType, filename] = params.path

    if (!examineeName_Id || !examType || !filename) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    // Extract name and ID from the folder name
    const lastUnderscoreIndex = examineeName_Id.lastIndexOf("_")
    const examineeName = examineeName_Id.substring(0, lastUnderscoreIndex)
    const examineeId = examineeName_Id.substring(lastUnderscoreIndex + 1)

    const pdfBuffer = getPDFFile(examineeName, examineeId, examType, filename)

    if (!pdfBuffer) {
      return NextResponse.json({ error: "PDF file not found" }, { status: 404 })
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Error serving PDF file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
