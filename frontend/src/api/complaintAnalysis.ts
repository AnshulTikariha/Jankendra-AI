import { apiFetch } from './httpClient'

export type ComplaintTextAnalysisResponse = {
  categories: string[]
  sentiment: string
  severity: string
  location: string | null
  summary: string
  keywords: string[]
}

export async function analyzeComplaintText(
  token: string,
  text: string,
): Promise<ComplaintTextAnalysisResponse> {
  return apiFetch<ComplaintTextAnalysisResponse>('/complaints/analyze-text', {
    method: 'POST',
    token,
    body: JSON.stringify({ text }),
  })
}
