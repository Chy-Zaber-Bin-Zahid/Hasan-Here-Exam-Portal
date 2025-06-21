import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase, type User } from "./database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface AuthUser {
  id: number
  username: string
  role: "teacher" | "examinee"
  full_name: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    const db = getDatabase()

    try {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User

      if (!user) {
        resolve(null)
        return
      }

      verifyPassword(password, user.password).then((isValid) => {
        if (isValid) {
          resolve({
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name,
            email: user.email,
          })
        } else {
          resolve(null)
        }
      })
    } catch (error) {
      console.error("Authentication error:", error)
      resolve(null)
    }
  })
}
