// Supabase/Postgrest errors are plain objects (not instances of Error),
// so `error instanceof Error` is false for them and their real .message
// gets hidden behind a generic fallback. This pulls the message out
// regardless of the error's shape.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (error instanceof Error) return error.message
  return fallback
}
