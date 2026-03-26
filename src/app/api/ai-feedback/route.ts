import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { applyRateLimit } from '@/lib/rate-limiter-enhanced';
import { createErrorResponse, validateBodySize } from '@/lib/security';

// DEPRECATED: This endpoint returns mock data
// For production AI scoring, use:
// - /api/attempts/[attemptId]/writing/ai-score
// - /api/attempts/[attemptId]/speaking/ai-score

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await applyRateLimit(request, "AI");
    if (rateLimitResult) return rateLimitResult;

    // Authentication required (prevent public abuse)
    await requireAuth();

    const body = await request.json();
    
    // Validate body size
    const sizeValidation = validateBodySize(body);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const { type, content, audioData } = body;

    // Validate input
    if (!type || !['writing', 'speaking'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "writing" or "speaking"' },
        { status: 400 }
      );
    }

    // MOCK IMPLEMENTATION - Replace with real AI integration
    let feedback;

    switch (type) {
      case 'writing':
        feedback = {
          score: Math.floor(Math.random() * 2) + 6,
          feedback: "Your essay demonstrates good understanding of the topic.",
          suggestions: ["Use more varied vocabulary"],
          strengths: ["Clear introduction and conclusion"],
          improvements: ["Expand vocabulary range"],
        };
        break;

      case 'speaking':
        feedback = {
          fluency: 7,
          coherence: 6,
          lexicalResource: 7,
          grammaticalRange: 6,
          pronunciation: 7,
          overallScore: 6.6,
          feedback: "Your speaking demonstrates good fluency and pronunciation.",
          strengths: ["Good pronunciation"],
          improvements: ["Work on grammatical accuracy"],
        };
        break;

      default:
        feedback = {
          score: 6,
          feedback: "Good attempt.",
          suggestions: ["Keep practicing"],
          strengths: ["Good effort"],
          improvements: ["Continue practicing"],
        };
    }

    return NextResponse.json(feedback);
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}
