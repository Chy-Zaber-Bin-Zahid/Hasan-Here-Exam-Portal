import { type NextRequest, NextResponse } from "next/server"
import { getAudioFile } from "../../../../../lib/file-storage"

export async function generateStaticParams() {
  return [];
}

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const audioBuffer = getAudioFile(params.filename)

    if (!audioBuffer) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 })
    }

    // Determine content type based on file extension
    const extension = params.filename.split(".").pop()?.toLowerCase()
    let contentType = "audio/mpeg" // default

    switch (extension) {
      case "mp3":
        contentType = "audio/mpeg"
        break
      case "wav":
        contentType = "audio/wav"
        break
      case "m4a":
        contentType = "audio/mp4"
        break
      case "ogg":
        contentType = "audio/ogg"
        break
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Error serving audio file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
