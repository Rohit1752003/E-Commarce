import {z} from 'zod'
const registerWithPassword = z.object({
    username : z.string().trim(). min(4).max(8),
    email : z.string().lowercase().trim(),
    password : z.string().lowercase().trim().min(6).max(12).optional()
})
const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});
const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
export {registerWithPassword, loginSchema , forgotPasswordSchema , resetPasswordSchema}