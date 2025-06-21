-- Initialize SQLite database for Exam Portal
-- This will create all necessary tables and sample data

-- Users table (teachers and examinees)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'examinee')),
  full_name TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reading questions table
CREATE TABLE IF NOT EXISTS reading_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  passage TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Reading question items
CREATE TABLE IF NOT EXISTS reading_question_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reading_question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  FOREIGN KEY (reading_question_id) REFERENCES reading_questions(id) ON DELETE CASCADE
);

-- Listening questions table
CREATE TABLE IF NOT EXISTS listening_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  audio_filename TEXT NOT NULL,
  audio_size INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Listening question items
CREATE TABLE IF NOT EXISTS listening_question_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listening_question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  FOREIGN KEY (listening_question_id) REFERENCES listening_questions(id) ON DELETE CASCADE
);

-- Writing questions table
CREATE TABLE IF NOT EXISTS writing_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  instructions TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Exam sessions table (track exam attempts)
CREATE TABLE IF NOT EXISTS exam_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('reading', 'listening', 'writing')),
  exam_id INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  time_limit INTEGER, -- in minutes
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Exam answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  question_id INTEGER,
  answer_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_reading_questions_created_by ON reading_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_listening_questions_created_by ON listening_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_writing_questions_created_by ON writing_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_session_id ON exam_answers(session_id);

-- Insert sample users (passwords are plain text for simplicity)
INSERT OR IGNORE INTO users (username, password, role, full_name, email) VALUES
('admin', 'admin123', 'teacher', 'Administrator', 'admin@examportal.com'),
('teacher1', 'teacher123', 'teacher', 'John Teacher', 'teacher1@examportal.com'),
('student1', 'student123', 'examinee', 'Alice Student', 'student1@examportal.com'),
('student2', 'student123', 'examinee', 'Bob Student', 'student2@examportal.com');

-- Insert sample reading questions
INSERT OR IGNORE INTO reading_questions (id, title, passage, created_by) VALUES
(1, 'Climate Change Reading', 'Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities have been the main driver of climate change since the 1800s. The burning of fossil fuels generates greenhouse gas emissions that act like a blanket wrapped around Earth, trapping heat and raising temperatures.', 1),
(2, 'Technology in Education', 'The integration of technology in education has transformed how students learn and teachers instruct. Digital tools, online resources, and interactive platforms have made learning more accessible and engaging. However, this digital transformation also presents challenges such as the digital divide and the need for digital literacy skills.', 1);

-- Insert sample reading question items
INSERT OR IGNORE INTO reading_question_items (reading_question_id, question_text, question_order) VALUES
(1, 'What is the main cause of climate change since the 1800s according to the passage?', 1),
(1, 'How do greenhouse gas emissions affect Earth''s temperature?', 2),
(1, 'Are climate variations always caused by human activities?', 3),
(2, 'How has technology transformed education according to the passage?', 1),
(2, 'What are some challenges mentioned regarding digital transformation in education?', 2);

-- Insert sample listening questions
INSERT OR IGNORE INTO listening_questions (id, title, audio_filename, audio_size, created_by) VALUES
(1, 'University Lecture', 'lecture-sample.mp3', 2048000, 1),
(2, 'Job Interview Conversation', 'interview-sample.mp3', 1536000, 1);

-- Insert sample listening question items
INSERT OR IGNORE INTO listening_question_items (listening_question_id, question_text, question_order) VALUES
(1, 'What is the main topic of the lecture?', 1),
(1, 'What examples does the professor give to support the main point?', 2),
(2, 'What position is the candidate applying for?', 1),
(2, 'What qualifications does the candidate mention?', 2);

-- Insert sample writing questions
INSERT OR IGNORE INTO writing_questions (id, title, prompt, instructions, created_by) VALUES
(1, 'Opinion Essay', 'Some people believe that social media has a positive impact on society, while others argue it has negative effects. What is your opinion?', 'Write a well-structured essay of at least 250 words. Include specific examples to support your arguments.', 1),
(2, 'Problem-Solution Essay', 'Traffic congestion is a major problem in many cities around the world. What are the causes of this problem and what solutions can you suggest?', 'Write an essay of at least 300 words. Discuss both causes and solutions with relevant examples.', 1);
