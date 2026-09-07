-- Upsert known test users with a known password hash (Password123)
INSERT INTO users (full_name, email, password, role)
VALUES
  ('System Admin', 'admin@test.com', '$2b$10$dt/D8vOiMtH7C2H7rBa9p.J53uJMBPc0dkldfso7Q8.o33DW.wuBO', 'ADMIN'),
  ('HR Manager',    'hr@test.com',   '$2b$10$dt/D8vOiMtH7C2H7rBa9p.J53uJMBPc0dkldfso7Q8.o33DW.wuBO', 'HR'),
  ('Senior Mentor', 'mentor@test.com','$2b$10$dt/D8vOiMtH7C2H7rBa9p.J53uJMBPc0dkldfso7Q8.o33DW.wuBO', 'MENTOR'),
  ('Demo Intern',   'intern1@test.com','$2b$10$dt/D8vOiMtH7C2H7rBa9p.J53uJMBPc0dkldfso7Q8.o33DW.wuBO', 'INTERN')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;

SELECT user_id, full_name, email, role FROM users WHERE email IN ('admin@test.com','hr@test.com','mentor@test.com','intern1@test.com') ORDER BY user_id;