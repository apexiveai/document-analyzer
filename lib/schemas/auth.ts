import { z } from "zod";

/**
 * Login schema - validates email and password for login form
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

/**
 * Signup schema - validates email, password, and name for signup form
 */
export const signupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Full name is required"),
});

/**
 * Extract and format validation errors from Zod parse results
 * Returns a user-friendly error message combining all field errors
 */
export function formatValidationErrors(error: z.ZodError<unknown>): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".");
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      return `${fieldName}: ${issue.message}`;
    })
    .join("; ");
}

/**
 * Type exports for form data
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
