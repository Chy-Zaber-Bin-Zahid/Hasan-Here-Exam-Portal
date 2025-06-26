import { type NextRequest, NextResponse } from "next/server";
import { getImageFile } from "../../../../../lib/file-storage";

export async function generateStaticParams() {
  return [];
}

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename;
    const imageBuffer = getImageFile(filename);

    if (!imageBuffer) {
      return NextResponse.json({ error: "Image file not found" }, { status: 404 });
    }

    // Determine content type from file extension
    const extension = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream"; // Default binary type

    switch (extension) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
    }

    // Return the image file as a response
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving image file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}