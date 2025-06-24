import { type NextRequest, NextResponse } from "next/server"
import { getPDFFile } from "@/lib/file-storage"
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const pdfBuffer = getPDFFile(params.filename)

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
