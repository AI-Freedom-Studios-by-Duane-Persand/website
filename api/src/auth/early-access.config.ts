// api/src/auth/early-access.config.ts
// Whitelist of emails that have early access to the platform
// TODO: Move to database or environment variable for production

export const EARLY_ACCESS_WHITELIST: string[] = [
  // Add whitelisted emails here
  'admin@aifreedomstudios.com',
  'waali.azmi@gmail.com',
  'irum@gmail.com'
];

/**
 * Check if an email is whitelisted for early access
 */
export function isEmailWhitelisted(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  return EARLY_ACCESS_WHITELIST.some(
    whitelistedEmail => whitelistedEmail.toLowerCase() === normalizedEmail
  );
}
