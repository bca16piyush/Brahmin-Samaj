/**
 * Generates a cryptographically secure temporary password using Web Crypto API.
 * This replaces the insecure Math.random() approach.
 * 
 * The password will:
 * - Be 16 characters of hex (from 16 random bytes)
 * - Include 'A1!' suffix to meet common password requirements
 * - Total length: 19 characters
 */
export function generateSecurePassword(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hexString = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
  return hexString + 'A1!';
}

/**
 * After creating a user with a secure temporary password,
 * trigger a password reset email so they can set their own password.
 */
export async function sendPasswordResetAfterCreation(
  supabase: any,
  email: string,
  origin: string = window.location.origin
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/login`,
    });
    
    if (error) {
      console.error('Failed to send password reset email:', error);
      return { error };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Error sending password reset:', err);
    return { error: err as Error };
  }
}
