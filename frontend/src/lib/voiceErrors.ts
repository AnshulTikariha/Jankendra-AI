export function friendlyVoiceError(message: string, fallback: string): string {
  const lower = message.toLowerCase()

  if (
    lower.includes('service_disabled') ||
    lower.includes('has not been used') ||
    lower.includes('speech.googleapis.com') ||
    lower.includes('speech-to-text api')
  ) {
    return fallback
  }

  if (lower.includes('permission_denied') || lower.includes('403')) {
    return fallback
  }

  if (message.length > 100 || message.includes('{') || message.includes('googleapis.com')) {
    return fallback
  }

  return message
}
