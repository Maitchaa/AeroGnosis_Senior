export interface CrackQuantification {
  length_mm: number;
  max_width_mm: number;
  mean_width_mm: number;
}

export interface PredictResponse {
  success: boolean;
  file_name: string;
  height: number;
  width: number;
  crack_coverage_pct: number;
  avg_confidence: number;
  max_confidence: number;
  severity: string;
  quantification: CrackQuantification;
  overlay_image_b64: string;
}

const API_URL = import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000/predict';

export async function runAiModelOnImage(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'AI API error');
  }

  return (await response.json()) as PredictResponse;
}
