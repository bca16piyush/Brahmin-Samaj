import { z } from 'zod';

// Indian mobile number regex: starts with 6-9, followed by 9 digits
const indianMobileRegex = /^[6-9]\d{9}$/;

// Clean mobile number by removing spaces, dashes, and country code
export const cleanMobileNumber = (mobile: string): string => {
  let cleaned = mobile.replace(/[\s\-\(\)]/g, '');
  // Remove +91 or 91 prefix if present
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
};

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .transform(cleanMobileNumber)
    .refine(
      (val) => indianMobileRegex.test(val),
      'Please enter a valid 10-digit Indian mobile number'
    ),
});

export const verificationSchema = z.object({
  gotra: z.string().min(1, 'Please select your Gotra'),
  father_name: z
    .string()
    .trim()
    .min(2, 'Father\'s name must be at least 2 characters')
    .max(100, 'Father\'s name must be less than 100 characters'),
  native_village: z
    .string()
    .trim()
    .min(2, 'Village name must be at least 2 characters')
    .max(100, 'Village name must be less than 100 characters'),
  reference_person: z
    .string()
    .trim()
    .max(100, 'Reference name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  reference_mobile: z
    .string()
    .optional()
    .transform((val) => val ? cleanMobileNumber(val) : '')
    .refine(
      (val) => val === '' || indianMobileRegex.test(val),
      'Please enter a valid 10-digit Indian mobile number'
    ),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type VerificationFormData = z.infer<typeof verificationSchema>;
