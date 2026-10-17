export interface AuthUser {
  id: string; name: string; email: string; phone: string | null;
  profilePhotoUrl: string | null;
  role: string; createdAt: string;
}
export interface Credentials { email: string; password: string }
export interface Registration extends Credentials { name: string; phone?: string }
export const PASSWORD_HINT = "Use at least 8 characters (maximum 72 UTF-8 bytes).";
export function validPassword(password: string) {
  return password.trim().length > 0 && [...password].length >= 8 && new TextEncoder().encode(password).length <= 72;
}
export function authError(error: unknown): string {
  if (error && typeof error === "object" && "status" in error) {
    switch (error.status) {
      case 400: return "Please check your details and try again.";
      case 401: return "Your email or password is incorrect.";
      case 403: return "Sign-in is not permitted. Please contact support if you believe this is a mistake.";
      case 409: return "An account with this email already exists. Please sign in.";
      case 429: return "Too many attempts. Please wait before trying again.";
    }
  }
  return "We couldn’t reach the account service. Please try again.";
}
