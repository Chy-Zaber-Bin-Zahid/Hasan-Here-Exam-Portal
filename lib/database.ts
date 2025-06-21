import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"

export interface User {
  id: number
  username: string
  password: string
  role: "teacher" | "examinee"
  full_name: string
  email: string
  created_at: string
}

export interface ReadingQuestion {
  id: number
  title: string
  passage: string
  created_by: number
  created_at: string
  questions?: ReadingQuestionItem[]
}

export interface ReadingQuestionItem {
  id: number
  reading_question_id: number
  question_text: string
  question_order: number
}

export interface ListeningQuestion {
  id: number
  title: string
  audio_filename: string
  audio_size: number
  created_by: number
  created_at: string
  questions?: ListeningQuestionItem[]
}

export interface ListeningQuestionItem {
  id: number
  listening_question_id: number
  question_text: string
  question_order: number
}

export interface WritingQuestion {
  id: number
  title: string
  prompt: string
  instructions: string
  created_by: number
  created_at: string
}

export interface ExamSession {
  id: number
  user_id: number
  exam_type: "reading" | "listening" | "writing"
  exam_id: number
  started_at: string
  completed_at?: string
  time_limit?: number
  status: "in_progress" | "completed" | "abandoned"
}

export interface ExamAnswer {
  id: number
  session_id: number
  question_id?: number
  answer_text: string
  created_at: string
  updated_at: string
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // Create database file in the project root
    db = new Database("exam_portal.db")

    // Enable foreign keys
    db.pragma("foreign_keys = ON")

    // Initialize database schema
    initializeDatabase()
  }

  return db
}

function initializeDatabase() {
  if (!db) return

  try {
    // Read and execute the SQL initialization script
    const sqlScript = readFileSync(join(process.cwd(), "scripts", "init-database.sql"), "utf-8")

    // Split by semicolon and execute each statement
    const statements = sqlScript
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      db.exec(statement)
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// User operations
export function authenticateUser(username: string, password: string): User | null {
  const db = getDatabase()
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as User
    return user || null
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export function getUserById(id: number): User | null {
  const db = getDatabase()
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User
    return user || null
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

// Reading questions operations
export function getAllReadingQuestions(): ReadingQuestion[] {
  const db = getDatabase()
  try {
    const questions = db.prepare("SELECT * FROM reading_questions ORDER BY created_at DESC").all() as ReadingQuestion[]

    // Get questions for each reading question
    for (const question of questions) {
      question.questions = db
        .prepare("SELECT * FROM reading_question_items WHERE reading_question_id = ? ORDER BY question_order")
        .all(question.id) as ReadingQuestionItem[]
    }

    return questions
  } catch (error) {
    console.error("Get reading questions error:", error)
    return []
  }
}

export function getReadingQuestionById(id: number): ReadingQuestion | null {
  const db = getDatabase()
  try {
    const question = db.prepare("SELECT * FROM reading_questions WHERE id = ?").get(id) as ReadingQuestion

    if (question) {
      question.questions = db
        .prepare("SELECT * FROM reading_question_items WHERE reading_question_id = ? ORDER BY question_order")
        .all(question.id) as ReadingQuestionItem[]
    }

    return question || null
  } catch (error) {
    console.error("Get reading question error:", error)
    return null
  }
}

// Listening questions operations
export function getAllListeningQuestions(): ListeningQuestion[] {
  const db = getDatabase()
  try {
    const questions = db
      .prepare("SELECT * FROM listening_questions ORDER BY created_at DESC")
      .all() as ListeningQuestion[]

    // Get questions for each listening question
    for (const question of questions) {
      question.questions = db
        .prepare("SELECT * FROM listening_question_items WHERE listening_question_id = ? ORDER BY question_order")
        .all(question.id) as ListeningQuestionItem[]
    }

    return questions
  } catch (error) {
    console.error("Get listening questions error:", error)
    return []
  }
}

export function getListeningQuestionById(id: number): ListeningQuestion | null {
  const db = getDatabase()
  try {
    const question = db.prepare("SELECT * FROM listening_questions WHERE id = ?").get(id) as ListeningQuestion

    if (question) {
      question.questions = db
        .prepare("SELECT * FROM listening_question_items WHERE listening_question_id = ? ORDER BY question_order")
        .all(question.id) as ListeningQuestionItem[]
    }

    return question || null
  } catch (error) {
    console.error("Get listening question error:", error)
    return null
  }
}

// Writing questions operations
export function getAllWritingQuestions(): WritingQuestion[] {
  const db = getDatabase()
  try {
    return db.prepare("SELECT * FROM writing_questions ORDER BY created_at DESC").all() as WritingQuestion[]
  } catch (error) {
    console.error("Get writing questions error:", error)
    return []
  }
}

export function getWritingQuestionById(id: number): WritingQuestion | null {
  const db = getDatabase()
  try {
    const question = db.prepare("SELECT * FROM writing_questions WHERE id = ?").get(id) as WritingQuestion
    return question || null
  } catch (error) {
    console.error("Get writing question error:", error)
    return null
  }
}

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
