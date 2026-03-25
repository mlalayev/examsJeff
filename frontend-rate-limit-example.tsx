/**
 * Frontend utility for handling AI scoring with rate limit support
 * Add this to your frontend code where you call AI scoring APIs
 */

import toast from 'react-hot-toast';

interface RateLimitError {
  error: string;
  hint: string;
  remaining: number;
  resetIn: number;
}

/**
 * Call AI scoring API with automatic rate limit handling
 */
export async function callAIScore(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    // Handle rate limiting (429)
    if (response.status === 429) {
      const data: RateLimitError = await response.json();
      toast.error(
        `Too many requests. Please wait ${data.resetIn} seconds.`,
        { duration: 5000 }
      );
      throw new Error(data.error);
    }

    // Handle OpenAI rate limit (if backend returns as 500 with specific message)
    if (!response.ok) {
      const data = await response.json();
      
      if (data.error?.includes('rate limit exceeded')) {
        toast.error(
          'OpenAI API rate limit reached. Please try again in a few minutes.',
          { duration: 7000 }
        );
        throw new Error(data.error);
      }

      if (data.error?.includes('timeout')) {
        toast.error(
          'Request timed out. The AI is taking too long. Please try again.',
          { duration: 5000 }
        );
        throw new Error(data.error);
      }

      // Generic error
      toast.error(data.error || 'Failed to score with AI');
      throw new Error(data.error || 'API error');
    }

    const result = await response.json();
    
    // Show success message
    if (result.cached) {
      toast.success('Loaded cached AI score');
    } else {
      toast.success('AI scoring completed!');
    }

    return result;
  } catch (error: any) {
    console.error('AI scoring error:', error);
    
    if (!error.message.includes('rate limit') && 
        !error.message.includes('timeout')) {
      toast.error('Network error. Please check your connection.');
    }
    
    throw error;
  }
}

/**
 * Example usage in a React component
 */
export function useAIScoring() {
  const [isScoring, setIsScoring] = React.useState(false);
  const [lastScoredAt, setLastScoredAt] = React.useState<Date | null>(null);

  const scoreWriting = async (attemptId: string, force: boolean = false) => {
    // Prevent double-clicking
    if (isScoring) {
      toast.error('Already scoring, please wait...');
      return null;
    }

    setIsScoring(true);
    
    try {
      const result = await callAIScore(
        `/api/attempts/${attemptId}/writing/ai-score`,
        {
          body: JSON.stringify({ force }),
        }
      );
      
      setLastScoredAt(new Date());
      return result;
    } catch (error) {
      return null;
    } finally {
      setIsScoring(false);
    }
  };

  const scoreSpeaking = async (attemptId: string, force: boolean = false) => {
    if (isScoring) {
      toast.error('Already scoring, please wait...');
      return null;
    }

    setIsScoring(true);
    
    try {
      const result = await callAIScore(
        `/api/attempts/${attemptId}/speaking/ai-score`,
        {
          body: JSON.stringify({ force }),
        }
      );
      
      setLastScoredAt(new Date());
      return result;
    } catch (error) {
      return null;
    } finally {
      setIsScoring(false);
    }
  };

  return {
    scoreWriting,
    scoreSpeaking,
    isScoring,
    lastScoredAt,
  };
}

/**
 * Button component with rate limit awareness
 */
export function AIScoreButton({
  attemptId,
  onSuccess,
}: {
  attemptId: string;
  onSuccess?: (result: any) => void;
}) {
  const { scoreWriting, isScoring } = useAIScoring();

  const handleClick = async () => {
    const result = await scoreWriting(attemptId);
    if (result && onSuccess) {
      onSuccess(result);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isScoring}
      className="btn btn-primary"
    >
      {isScoring ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" />
          Scoring with AI...
        </>
      ) : (
        <>
          🤖 Score with AI
        </>
      )}
    </button>
  );
}

/**
 * Show rate limit status to users
 */
export function RateLimitStatus() {
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [resetIn, setResetIn] = React.useState<number | null>(null);

  // After each API call, check response headers
  React.useEffect(() => {
    const checkRateLimit = async () => {
      // Make a HEAD request to check limits without consuming quota
      try {
        const response = await fetch('/api/health/rate-limit', {
          method: 'HEAD',
        });
        
        const limit = response.headers.get('X-RateLimit-Limit');
        const rem = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (rem) setRemaining(parseInt(rem));
        if (reset) setResetIn(parseInt(reset));
      } catch (error) {
        // Ignore errors
      }
    };

    checkRateLimit();
  }, []);

  if (remaining === null) return null;

  return (
    <div className="alert alert-info">
      <small>
        AI Scoring: {remaining} requests remaining
        {resetIn && ` (resets in ${resetIn}s)`}
      </small>
    </div>
  );
}
