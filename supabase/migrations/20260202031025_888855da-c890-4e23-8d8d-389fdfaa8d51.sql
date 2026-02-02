-- Insert admin roles for specified users (using service role context)
-- First, we need to add the admin role for the existing user
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('aksahuakhil@gmail.com', 'rambaburathour133@gmail.com', 'trendra.care.ac.in@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;