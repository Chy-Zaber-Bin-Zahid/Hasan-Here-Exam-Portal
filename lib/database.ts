import Database from "better-sqlite3"
import path from "path"

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
  questions: string
  created_at: string
}

export interface ListeningQuestion {
  id: number
  title: string
  audio_url: string
  text: string
  questions: string
  created_at: string
}

export interface WritingQuestion {
  id: number
  title: string
  prompt: string
  instructions: string
  word_limit: number
  created_at: string
}

export interface ExamSubmission {
  id: number
  examinee_name: string
  examinee_id: string
  exam_type: "reading" | "listening" | "writing"
  exam_id: number
  exam_title: string
  answers: string
  pdf_path: string
  submitted_at: string
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "exam_portal.db")
    db = new Database(dbPath)

    // Initialize database with tables
    initializeDatabase(db)
  }
  return db
}

function initializeDatabase(database: Database.Database) {
  console.log("🔄 Initializing database...")

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('teacher', 'examinee')),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      passage TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listening_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      text TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS writing_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      instructions TEXT NOT NULL,
      word_limit INTEGER DEFAULT 500,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examinee_name TEXT NOT NULL,
      examinee_id TEXT NOT NULL,
      exam_type TEXT NOT NULL CHECK (exam_type IN ('reading', 'listening', 'writing')),
      exam_id INTEGER NOT NULL,
      exam_title TEXT NOT NULL,
      answers TEXT NOT NULL,
      pdf_path TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Create admin user
  createAdminUser(database)
}

function createAdminUser(database: Database.Database) {
  try {
    // Delete existing user first to ensure clean state
    database.prepare("DELETE FROM users WHERE username = ?").run("hasan")
    console.log("🗑️ Cleared existing admin user")

    // Insert new admin user
    const result = database
      .prepare(`
        INSERT INTO users (username, password, role, full_name, email) 
        VALUES (?, ?, ?, ?, ?)
      `)
      .run("hasan", "hasan47", "teacher", "Hasan Admin", "hasan@example.com")

    console.log("✅ Admin user created with ID:", result.lastInsertRowid)

    // Verify user was created
    const createdUser = database.prepare("SELECT username, password, role FROM users WHERE username = ?").get("hasan")
    console.log("✅ Verified user in database:", createdUser)

    // Show all users for debugging
    const allUsers = database.prepare("SELECT id, username, role FROM users").all()
    console.log("📋 All users in database:", allUsers)
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
  }
}

export function authenticateUser(username: string, password: string): User | null {
  try {
    console.log("🔍 Authenticating user:", username, "with password length:", password.length)

    const db = getDatabase()

    // First check if user exists
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User

    if (!user) {
      console.log("❌ User not found:", username)
      return null
    }

    console.log("✅ User found in database:", user.username)
    console.log("🔐 Stored password:", user.password)
    console.log("🔐 Input password:", password)
    console.log("🔐 Passwords match:", user.password === password)

    // Check password
    if (user.password === password) {
      console.log("✅ Authentication successful for:", username)
      return user
    } else {
      console.log("❌ Password mismatch for:", username)
      return null
    }
  } catch (error) {
    console.error("❌ Authentication error:", error)
    return null
  }
}

// Reading Questions
export function getReadingQuestions(): ReadingQuestion[] {
  const db = getDatabase()
  return db.prepare("SELECT * FROM reading_questions ORDER BY created_at DESC").all() as ReadingQuestion[]
}

export function getReadingQuestion(id: number): ReadingQuestion | null {
  const db = getDatabase()
  return db.prepare("SELECT * FROM reading_questions WHERE id = ?").get(id) as ReadingQuestion | null
}

export function createReadingQuestion(title: string, passage: string, questions: string): ReadingQuestion {
  const db = getDatabase()
  const result = db
    .prepare(`
    INSERT INTO reading_questions (title, passage, questions) 
    VALUES (?, ?, ?)
  `)
    .run(title, passage, questions)

  return getReadingQuestion(result.lastInsertRowid as number)!
}

export function updateReadingQuestion(id: number, title: string, passage: string, questions: string): boolean {
  const db = getDatabase()
  const result = db
    .prepare(`
    UPDATE reading_questions 
    SET title = ?, passage = ?, questions = ? 
    WHERE id = ?
  `)
    .run(title, passage, questions, id)

  return result.changes > 0
}

export function deleteReadingQuestion(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare("DELETE FROM reading_questions WHERE id = ?").run(id)
  return result.changes > 0
}

// Listening Questions
export function getListeningQuestions(): ListeningQuestion[] {
  const db = getDatabase()
  return db.prepare("SELECT * FROM listening_questions ORDER BY created_at DESC").all() as ListeningQuestion[]
}

export function getListeningQuestion(id: number): ListeningQuestion | null {
  const db = getDatabase()
  return db.prepare("SELECT * FROM listening_questions WHERE id = ?").get(id) as ListeningQuestion | null
}

export function createListeningQuestion(
  title: string,
  audio_url: string,
  text: string,
  questions: string,
): ListeningQuestion {
  const db = getDatabase()
  const result = db
    .prepare(`
    INSERT INTO listening_questions (title, audio_url, text, questions) 
    VALUES (?, ?, ?, ?)
  `)
    .run(title, audio_url, text, questions)

  return getListeningQuestion(result.lastInsertRowid as number)!
}

export function updateListeningQuestion(
  id: number,
  title: string,
  audio_url: string,
  text: string,
  questions: string,
): boolean {
  const db = getDatabase()
  const result = db
    .prepare(`
    UPDATE listening_questions 
    SET title = ?, audio_url = ?, text = ?, questions = ? 
    WHERE id = ?
  `)
    .run(title, audio_url, text, questions, id)

  return result.changes > 0
}

export function deleteListeningQuestion(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare("DELETE FROM listening_questions WHERE id = ?").run(id)
  return result.changes > 0
}

// Writing Questions
export function getWritingQuestions(): WritingQuestion[] {
  const db = getDatabase()
  return db.prepare("SELECT * FROM writing_questions ORDER BY created_at DESC").all() as WritingQuestion[]
}

export function getWritingQuestion(id: number): WritingQuestion | null {
  const db = getDatabase()
  return db.prepare("SELECT * FROM writing_questions WHERE id = ?").get(id) as WritingQuestion | null
}

export function createWritingQuestion(
  title: string,
  prompt: string,
  instructions: string,
  word_limit: number,
): WritingQuestion {
  const db = getDatabase()
  const result = db
    .prepare(`
    INSERT INTO writing_questions (title, prompt, instructions, word_limit) 
    VALUES (?, ?, ?, ?)
  `)
    .run(title, prompt, instructions, word_limit)

  return getWritingQuestion(result.lastInsertRowid as number)!
}

export function updateWritingQuestion(
  id: number,
  title: string,
  prompt: string,
  instructions: string,
  word_limit: number,
): boolean {
  const db = getDatabase()
  const result = db
    .prepare(`
    UPDATE writing_questions 
    SET title = ?, prompt = ?, instructions = ?, word_limit = ? 
    WHERE id = ?
  `)
    .run(title, prompt, instructions, word_limit, id)

  return result.changes > 0
}

export function deleteWritingQuestion(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare("DELETE FROM writing_questions WHERE id = ?").run(id)
  return result.changes > 0
}

// Exam Submissions
export function createExamSubmission(
  examineeName: string,
  examineeId: string,
  examType: "reading" | "listening" | "writing",
  examId: number,
  examTitle: string,
  answers: string,
  pdfPath: string,
): ExamSubmission {
  const db = getDatabase()
  const result = db
    .prepare(`
    INSERT INTO exam_submissions (examinee_name, examinee_id, exam_type, exam_id, exam_title, answers, pdf_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .run(examineeName, examineeId, examType, examId, examTitle, answers, pdfPath)

  return db.prepare("SELECT * FROM exam_submissions WHERE id = ?").get(result.lastInsertRowid) as ExamSubmission
}

export function getExamSubmissions(): ExamSubmission[] {
  const db = getDatabase()
  return db.prepare("SELECT * FROM exam_submissions ORDER BY submitted_at DESC").all() as ExamSubmission[]
}
