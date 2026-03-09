// Legacy compatibility shim. Kept temporarily to avoid breaking stale imports.
// Non-provider API fallbacks are disabled by default.
export async function shouldUseEchoAPI(): Promise<boolean> {
  return false;
}
