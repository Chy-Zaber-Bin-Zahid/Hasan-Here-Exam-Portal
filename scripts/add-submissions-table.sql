-- Add exam submissions table to track all submitted exams
CREATE TABLE IF NOT EXISTS exam_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('reading', 'listening', 'writing')),
  exam_id INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  pdf_filename TEXT NOT NULL,
  pdf_path TEXT NOT NULL,
  time_spent INTEGER, -- in seconds
  submitted_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON exam_submissions(exam_type, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_date ON exam_submissions(submitted_at);
