interface WritingFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

interface SpeakingFeedback {
  fluency: number;
  coherence: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export async function getWritingFeedback(essay: string): Promise<WritingFeedback> {
  try {
    const response = await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'writing',
        content: essay,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get feedback');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting writing feedback:', error);
    throw error;
  }
}

export async function getSpeakingFeedback(audioBlob: Blob): Promise<SpeakingFeedback> {
  try {
    // In a real implementation, you would convert the audio blob to a format
    // that can be sent to the API (e.g., base64 or upload to a file service)
    const response = await fetch('/api/ai-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'speaking',
        audioData: 'mock-audio-data', // In real implementation, this would be the actual audio data
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get feedback');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting speaking feedback:', error);
    throw error;
  }
}
