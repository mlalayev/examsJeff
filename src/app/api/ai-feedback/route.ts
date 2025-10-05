import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, content, audioData } = await request.json();

    // In a real implementation, you would:
    // 1. Send the content/audio to ChatGPT API
    // 2. Process the response
    // 3. Return structured feedback

    // For now, return mock feedback based on the type
    let feedback;

    switch (type) {
      case 'writing':
        feedback = {
          score: Math.floor(Math.random() * 2) + 6, // 6-7
          feedback: "Your essay demonstrates good understanding of the topic. The structure is clear with introduction, body paragraphs, and conclusion. However, there are areas for improvement in vocabulary range and grammatical accuracy.",
          suggestions: [
            "Use more varied vocabulary and avoid repetition",
            "Include more specific examples to support arguments",
            "Pay attention to subject-verb agreement",
            "Use more complex sentence structures"
          ],
          strengths: [
            "Clear introduction and conclusion",
            "Logical paragraph organization",
            "Good use of linking words"
          ],
          improvements: [
            "Expand vocabulary range",
            "Improve grammatical accuracy",
            "Add more specific examples"
          ]
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
          feedback: "Your speaking demonstrates good fluency and pronunciation. You use a range of vocabulary effectively and your ideas are generally well-organized. However, there are some areas where you could improve your grammatical accuracy.",
          strengths: [
            "Good pronunciation and intonation",
            "Appropriate use of linking words",
            "Clear and coherent ideas"
          ],
          improvements: [
            "Work on grammatical accuracy",
            "Provide more specific examples",
            "Develop ideas more fully"
          ]
        };
        break;

      default:
        feedback = {
          score: 6,
          feedback: "Good attempt. Continue practicing to improve your skills.",
          suggestions: ["Keep practicing regularly", "Focus on weak areas"],
          strengths: ["Good effort"],
          improvements: ["Continue practicing"]
        };
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error processing AI feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
