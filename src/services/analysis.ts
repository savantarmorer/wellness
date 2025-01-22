export interface GenerateAnalysisParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface GenerateAnalysisResult {
  result: string;
}

export const generateAnalysis = async (params: GenerateAnalysisParams): Promise<GenerateAnalysisResult> => {
  const response = await fetch('https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to generate analysis');
  }

  return response.json();
}; 