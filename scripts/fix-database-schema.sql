-- Drop the existing table and recreate with correct schema
DROP TABLE IF EXISTS exam_submissions;

CREATE TABLE exam_submissions (
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

-- Create indexes for better performance
CREATE INDEX idx_exam_submissions_examinee ON exam_submissions(examinee_name, examinee_id);
CREATE INDEX idx_exam_submissions_type ON exam_submissions(exam_type);
CREATE INDEX idx_exam_submissions_date ON exam_submissions(submitted_at);
