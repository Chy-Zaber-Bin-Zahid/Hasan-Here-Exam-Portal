import { type NextRequest, NextResponse } from "next/server"
import { getPDFFile } from "../../../../../lib/file-storage"

export async function generateStaticParams() {
  return [];
}

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    // You need to extract examineeName, examineeId, and examType from params or request
    // For example, if you expect them as query parameters:
    const { searchParams } = new URL(request.url)
    const examineeName = searchParams.get("examineeName") || ""
    const examineeId = searchParams.get("examineeId") || ""
    const examType = searchParams.get("examType") || ""
    const filename = params.filename

    const pdfBuffer = getPDFFile(examineeName, examineeId, examType, filename)

    if (!pdfBuffer) {
      return NextResponse.json({ error: "PDF file not found" }, { status: 404 })
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${params.filename}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Error serving PDF file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
