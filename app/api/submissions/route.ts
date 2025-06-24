import { NextResponse } from "next/server"
import { getExamSubmissions } from "@/lib/database"
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const submissions = getExamSubmissions()
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching exam submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}