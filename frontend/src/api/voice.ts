import { ApiError, parseApiErrorDetail } from './errors'
import { apiBaseUrl } from './httpClient'

export type VoiceTranscribeResponse = {
  transcript: string
  confidence: number | null
  detected_language: string | null
}

export async function transcribeVoice(
  token: string,
  audio: Blob,
): Promise<VoiceTranscribeResponse> {
  const form = new FormData()
  form.append('file', audio, 'recording.webm')
  form.append('language_code', 'auto')

  const response = await fetch(`${apiBaseUrl}/voice/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      parseApiErrorDetail(body) ??
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, body)
  }

  return body as VoiceTranscribeResponse
}
