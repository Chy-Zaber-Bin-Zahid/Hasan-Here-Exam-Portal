import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user-session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
