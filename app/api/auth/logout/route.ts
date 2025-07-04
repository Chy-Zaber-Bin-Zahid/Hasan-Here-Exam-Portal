import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear the session cookie
  response.cookies.set("user-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  })

  return response
}
