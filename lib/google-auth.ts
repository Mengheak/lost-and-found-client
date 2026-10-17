export function googleAuthError(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const code = "data" in error && error.data && typeof error.data === "object" && "code" in error.data ? error.data.code : undefined;
    if (code === "GOOGLE_DISABLED" || code === "GOOGLE_CONFIGURATION") return "Google sign-in isn’t configured yet. Please use email and password for now.";
    if (error.status === 409) return "This email already has an account. Please sign in with your existing method; accounts are not linked automatically.";
    if (error.status === 401) return "Google sign-in expired or was already used. Please start again.";
    if (error.status === 403) return "Google sign-in is not permitted for this account.";
    if (error.status === 429) return "Too many Google sign-in attempts. Please wait and try again.";
  }
  return "Google sign-in couldn’t finish. Please start again or sign in with email.";
}
