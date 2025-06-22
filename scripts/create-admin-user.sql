-- Create admin user with hashed password
-- Username: hasan
-- Password: hasan47
INSERT OR REPLACE INTO users (username, password, role, full_name, email) VALUES 
('hasan', '$2a$10$8K1p/a0dLRdcCu9FYO/OyeW9QEBVxVV4HqHmBOWOwfDdEcAveHh.C', 'teacher', 'Hasan Admin', 'hasan@example.com');
