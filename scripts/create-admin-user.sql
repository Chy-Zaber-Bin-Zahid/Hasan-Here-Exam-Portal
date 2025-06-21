-- Create admin user with hashed password
-- Password: hasna47
INSERT OR IGNORE INTO users (username, password, role, full_name, email) VALUES 
('hasan', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Hasan Admin', 'hasan@example.com');
