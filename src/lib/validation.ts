import { z } from 'zod';

// ========== Authentication Schemas ==========
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  mobile: z.string()
    .trim()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must be less than 15 digits')
    .regex(/^[+]?[0-9]+$/, 'Mobile number must contain only digits'),
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters'),
});

// ========== Profile Schemas ==========
export const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  mobile: z.string()
    .trim()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must be less than 15 digits')
    .regex(/^[+]?[0-9]+$/, 'Mobile number must contain only digits'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable(),
  gotra: z.string()
    .trim()
    .max(100, 'Gotra must be less than 100 characters')
    .optional()
    .nullable(),
  father_name: z.string()
    .trim()
    .max(100, "Father's name must be less than 100 characters")
    .optional()
    .nullable(),
  native_village: z.string()
    .trim()
    .max(200, 'Native village must be less than 200 characters')
    .optional()
    .nullable(),
  reference_person: z.string()
    .trim()
    .max(100, 'Reference person must be less than 100 characters')
    .optional()
    .nullable(),
  reference_mobile: z.string()
    .trim()
    .max(15, 'Reference mobile must be less than 15 digits')
    .regex(/^[+]?[0-9]*$/, 'Reference mobile must contain only digits')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const verificationSubmitSchema = profileSchema.extend({
  gotra: z.string()
    .trim()
    .min(1, 'Gotra is required for verification')
    .max(100, 'Gotra must be less than 100 characters'),
  father_name: z.string()
    .trim()
    .min(1, "Father's name is required for verification")
    .max(100, "Father's name must be less than 100 characters"),
  native_village: z.string()
    .trim()
    .min(1, 'Native village is required for verification')
    .max(200, 'Native village must be less than 200 characters'),
});

// ========== Admin User Creation Schema ==========
export const adminUserCreateSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  mobile: z.string()
    .trim()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must be less than 15 digits')
    .regex(/^[+]?[0-9]+$/, 'Mobile number must contain only digits'),
  gotra: z.string()
    .trim()
    .max(100, 'Gotra must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  father_name: z.string()
    .trim()
    .max(100, "Father's name must be less than 100 characters")
    .optional()
    .or(z.literal('')),
  native_village: z.string()
    .trim()
    .max(200, 'Native village must be less than 200 characters')
    .optional()
    .or(z.literal('')),
});

// ========== Pandit Booking Schemas ==========
export const bookingSchema = z.object({
  pandit_id: z.string().uuid('Invalid pandit ID'),
  ceremony_type: z.string()
    .trim()
    .min(3, 'Ceremony type must be at least 3 characters')
    .max(200, 'Ceremony type must be less than 200 characters'),
  booking_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD expected)'),
  booking_time: z.string()
    .max(50, 'Booking time must be less than 50 characters')
    .optional()
    .nullable(),
  location: z.string()
    .trim()
    .max(500, 'Location must be less than 500 characters')
    .optional()
    .nullable(),
  message: z.string()
    .trim()
    .max(2000, 'Message must be less than 2000 characters')
    .optional()
    .nullable(),
});

// ========== Review Schemas ==========
export const reviewSchema = z.object({
  pandit_id: z.string().uuid('Invalid pandit ID'),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  review_text: z.string()
    .trim()
    .max(2000, 'Review must be less than 2000 characters')
    .optional()
    .nullable(),
  ceremony_type: z.string()
    .trim()
    .max(200, 'Ceremony type must be less than 200 characters')
    .optional()
    .nullable(),
});

export const updateReviewSchema = reviewSchema.extend({
  id: z.string().uuid('Invalid review ID'),
});

// ========== Event Schemas ==========
export const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .trim()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  event_date: z.string()
    .min(1, 'Event date is required'),
  end_date: z.string()
    .optional()
    .nullable(),
  location: z.string()
    .trim()
    .max(500, 'Location must be less than 500 characters')
    .optional()
    .nullable(),
  event_type: z.string()
    .trim()
    .max(100, 'Event type must be less than 100 characters')
    .optional()
    .nullable(),
  image_url: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL must be less than 500 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  youtube_live_url: z.string()
    .max(500, 'YouTube URL must be less than 500 characters')
    .optional()
    .nullable(),
  map_url: z.string()
    .max(500, 'Map URL must be less than 500 characters')
    .optional()
    .nullable(),
  is_live: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  registration_limit: z.number()
    .int('Registration limit must be a whole number')
    .min(0, 'Registration limit cannot be negative')
    .max(10000, 'Registration limit must be less than 10000')
    .optional()
    .nullable(),
});

// ========== News Schemas ==========
export const newsSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10000 characters'),
  is_urgent: z.boolean().optional(),
  send_notification: z.boolean().optional(),
});

// ========== Pandit Schemas ==========
export const panditSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .trim()
    .max(15, 'Phone must be less than 15 digits')
    .regex(/^[+]?[0-9]*$/, 'Phone must contain only digits')
    .optional()
    .nullable(),
  whatsapp: z.string()
    .trim()
    .max(15, 'WhatsApp must be less than 15 digits')
    .regex(/^[+]?[0-9]*$/, 'WhatsApp must contain only digits')
    .optional()
    .nullable(),
  bio: z.string()
    .trim()
    .max(2000, 'Bio must be less than 2000 characters')
    .optional()
    .nullable(),
  location: z.string()
    .trim()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),
  availability: z.string()
    .trim()
    .max(500, 'Availability must be less than 500 characters')
    .optional()
    .nullable(),
  expertise: z.array(z.string().max(100)).optional(),
  photo_url: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be less than 500 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
  experience_start_date: z.string()
    .optional()
    .nullable(),
  weekly_availability: z.record(z.unknown()).optional(),
});

// ========== Expertise Option Schema ==========
export const expertiseOptionSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Expertise name must be at least 2 characters')
    .max(100, 'Expertise name must be less than 100 characters'),
});

// ========== Type Exports ==========
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type VerificationSubmitInput = z.infer<typeof verificationSubmitSchema>;
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type PanditInput = z.infer<typeof panditSchema>;
export type ExpertiseOptionInput = z.infer<typeof expertiseOptionSchema>;

// ========== Validation Helpers ==========

/**
 * Validates input and returns the validated data or throws an error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const firstError = result.error.errors[0];
  throw new Error(firstError?.message || 'Validation failed');
}

/**
 * Validates input and returns a result object with success status
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { success: false, error: firstError?.message || 'Validation failed' };
}
