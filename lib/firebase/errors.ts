/**
 * Firebase Error Formatter & Parser
 * Converts raw Firebase SDK errors and codes into clear, actionable, user-friendly messages.
 */

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  // Direct string errors
  if (typeof error === "string") return error;

  const code: string = error.code || "";
  const rawMessage: string = error.message || "";

  // 1. Firebase Auth Errors
  switch (code) {
    case "auth/email-already-in-use":
      return "This email address is already registered. Please sign in instead or use another email.";
    case "auth/invalid-email":
      return "The email address entered is invalid. Please check the spelling.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a password with at least 6 characters.";
    case "auth/user-not-found":
      return "No account exists with this email address. Please register a new account.";
    case "auth/wrong-password":
      return "Incorrect password. Please check your password and try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials and try again.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password.";
    case "auth/too-many-requests":
      return "Access temporarily blocked due to multiple failed attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network connection failed. Please check your internet connection and retry.";
    case "auth/user-disabled":
      return "This user account has been disabled by an administrator.";
    case "auth/requires-recent-login":
      return "This operation requires recent authentication. Please log out and sign in again.";
  }

  // 2. Cloud Firestore Errors
  if (code.includes("permission-denied") || rawMessage.toLowerCase().includes("permission-denied")) {
    return "Firebase Firestore Permission Denied: Your database rules in Firebase Console are blocking writes. Please go to Firebase Console > Firestore Database > Rules and publish rules allowing read/write access.";
  }
  if (code.includes("unavailable") || rawMessage.toLowerCase().includes("unavailable")) {
    return "Firebase Database is currently unreachable. Please check your connection.";
  }
  if (code.includes("resource-exhausted")) {
    return "Firebase quota exceeded. Please check your project billing or rate limits.";
  }

  // 3. Parse formatted Firebase error messages like "Firebase: Error (auth/email-already-in-use)."
  const match = rawMessage.match(/\((auth\/[^)]+)\)/);
  if (match && match[1]) {
    return getFriendlyErrorMessage({ code: match[1] });
  }

  // Clean generic "Firebase: Error" wrapper
  const cleaned = rawMessage
    .replace(/^Firebase:\s*(Error\s*)?/i, "")
    .replace(/\s*\([^)]*\)\.?$/, "")
    .trim();

  if (cleaned.length > 0) {
    return cleaned;
  }

  return "An unexpected error occurred. Please try again.";
}
