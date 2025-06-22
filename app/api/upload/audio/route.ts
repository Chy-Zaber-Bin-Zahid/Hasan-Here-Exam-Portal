import { type NextRequest, NextResponse } from "next/server"
import { saveAudioFile } from "@/lib/file-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save the audio file
    const { filename, path } = saveAudioFile(buffer, audioFile.name)

    return NextResponse.json({
      success: true,
      filename,
      path,
      originalName: audioFile.name,
      size: audioFile.size,
    })
  } catch (error) {
    console.error("Error uploading audio file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
