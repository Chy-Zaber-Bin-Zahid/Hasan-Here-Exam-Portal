import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("Login attempt:", { username, password: "***" })

    if (!username || !password) {
      console.log("❌ Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Strict validation - only allow exact credentials
    if (username !== "hasan") {
      console.log("❌ Invalid username:", username)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (password !== "hasan47") {
      console.log("❌ Invalid password for user:", username)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get user from database to verify they exist
    const user = authenticateUser(username, password)

    if (!user) {
      console.log("❌ User not found in database:", username)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("✅ Authentication successful for user:", username)

    // Create session data
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    }

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    })

    // Set session cookie
    response.cookies.set("user-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
