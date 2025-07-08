import { type NextRequest, NextResponse } from "next/server"
import { verifyTeacherAccess } from "@/lib/auth"
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const isValid = verifyTeacherAccess(password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid teacher access password" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Teacher access error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
