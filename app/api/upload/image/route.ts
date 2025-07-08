import { type NextRequest, NextResponse } from "next/server"
import { saveImageFile } from "@/lib/file-storage"
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }
    
    if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save the image file using the new function
    const { filename, path } = saveImageFile(buffer, imageFile.name)

    return NextResponse.json({
      success: true,
      filename,
      path, // This will be the public URL like /api/files/image/filename.ext
      originalName: imageFile.name,
      size: imageFile.size,
    })
  } catch (error) {
    console.error("Error uploading image file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}