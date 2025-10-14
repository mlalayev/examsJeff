import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only ADMIN, BOSS, or TEACHER can seed
    if (!["ADMIN", "BOSS", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if exam already exists
    const existing = await prisma.exam.findFirst({
      where: {
        title: "General English A2 — Unit 1",
        category: "GENERAL_ENGLISH",
        track: "A2",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This exam already exists", examId: existing.id },
        { status: 400 }
      );
    }

    // Create exam with sections and questions
    const exam = await prisma.exam.create({
      data: {
        title: "General English A2 — Unit 1",
        category: "GENERAL_ENGLISH",
        track: "A2",
        isActive: true,
        createdById: user.id,
        sections: {
          create: [
            // READING SECTION
            {
              type: "READING",
              title: "Reading Comprehension",
              durationMin: 20,
              order: 1,
              questions: {
                create: [
                  // Q1 - MCQ with passage
                  {
                    qtype: "MCQ",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "What time does the library close on weekdays?",
                      passage: "The City Library is open Monday to Friday from 9:00 AM to 6:00 PM. On Saturdays, it opens at 10:00 AM and closes at 4:00 PM. The library is closed on Sundays and public holidays.",
                    },
                    options: {
                      variants: [
                        { id: "A", text: "4:00 PM" },
                        { id: "B", text: "6:00 PM" },
                        { id: "C", text: "9:00 PM" },
                        { id: "D", text: "10:00 PM" },
                      ],
                    },
                    answerKey: { correct: "B" },
                    explanation: {
                      text: "The passage states 'Monday to Friday from 9:00 AM to 6:00 PM', so the library closes at 6:00 PM on weekdays.",
                    },
                  },
                  // Q2 - GAP fill
                  {
                    qtype: "GAP",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "I ___ go to the gym on weekends.",
                      hint: "Use an adverb of frequency",
                    },
                    answerKey: { correct: "usually", alternatives: ["often", "sometimes"] },
                    explanation: {
                      text: "The sentence requires an adverb of frequency. Common answers include 'usually', 'often', or 'sometimes'.",
                    },
                  },
                  // Q3 - Another MCQ
                  {
                    qtype: "MCQ",
                    order: 3,
                    maxScore: 1,
                    prompt: {
                      text: "According to the passage, when is the library closed?",
                      passage: "The City Library is open Monday to Friday from 9:00 AM to 6:00 PM. On Saturdays, it opens at 10:00 AM and closes at 4:00 PM. The library is closed on Sundays and public holidays.",
                    },
                    options: {
                      variants: [
                        { id: "A", text: "Mondays" },
                        { id: "B", text: "Saturdays" },
                        { id: "C", text: "Sundays and public holidays" },
                        { id: "D", text: "Weekdays" },
                      ],
                    },
                    answerKey: { correct: "C" },
                  },
                ],
              },
            },

            // LISTENING SECTION (text-based transcript)
            {
              type: "LISTENING",
              title: "Listening Comprehension",
              durationMin: 15,
              order: 2,
              questions: {
                create: [
                  // Q1 - True/False
                  {
                    qtype: "TF",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "The meeting starts at 9:30.",
                      transcript: "Good morning everyone. Just a reminder that our weekly team meeting will start at 9:30 sharp in the conference room. Please bring your project updates.",
                    },
                    answerKey: { correct: true },
                  },
                  // Q2 - ORDER (sequence of events)
                  {
                    qtype: "ORDER",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "Put the events in the correct order based on the conversation.",
                      transcript: "First, you need to arrive at the airport. Then, go to the check-in counter. After that, the flight will start boarding. Finally, there will be a short break before takeoff.",
                    },
                    options: {
                      items: [
                        { id: "1", text: "Arrive at airport" },
                        { id: "2", text: "Check-in" },
                        { id: "3", text: "Start boarding" },
                        { id: "4", text: "Break before takeoff" },
                      ],
                    },
                    answerKey: { correctOrder: ["1", "2", "3", "4"] },
                  },
                  // Q3 - MCQ from listening
                  {
                    qtype: "MCQ",
                    order: 3,
                    maxScore: 1,
                    prompt: {
                      text: "Where will the meeting take place?",
                      transcript: "Good morning everyone. Just a reminder that our weekly team meeting will start at 9:30 sharp in the conference room. Please bring your project updates.",
                    },
                    options: {
                      variants: [
                        { id: "A", text: "In the office" },
                        { id: "B", text: "In the conference room" },
                        { id: "C", text: "Online" },
                        { id: "D", text: "In the cafeteria" },
                      ],
                    },
                    answerKey: { correct: "B" },
                  },
                ],
              },
            },

            // WRITING SECTION
            {
              type: "WRITING",
              title: "Writing Skills",
              durationMin: 25,
              order: 3,
              questions: {
                create: [
                  // Q1 - SHORT_TEXT (sentence ordering)
                  {
                    qtype: "SHORT_TEXT",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "Put the words in the correct order to make a sentence.",
                      words: ["was", "going", "he", "yesterday", "morning", "Sunday", "on"],
                    },
                    answerKey: {
                      correct: "He was going on Sunday morning yesterday.",
                      alternatives: ["He was going yesterday on Sunday morning."],
                    },
                    explanation: {
                      text: "The correct word order follows: Subject + Verb + Time expression",
                    },
                  },
                  // Q2 - ESSAY
                  {
                    qtype: "ESSAY",
                    order: 2,
                    maxScore: 5,
                    prompt: {
                      text: "Write a short paragraph (50-80 words) about your daily routine.",
                      instructions: "Include: what time you wake up, what you do in the morning, and your evening activities.",
                      minWords: 50,
                      maxWords: 80,
                    },
                    answerKey: null, // Manual grading required
                    explanation: {
                      rubric: "Grammar (0-2), Vocabulary (0-2), Content (0-1)",
                    },
                  },
                ],
              },
            },

            // GRAMMAR SECTION
            {
              type: "GRAMMAR",
              title: "Grammar",
              durationMin: 15,
              order: 4,
              questions: {
                create: [
                  // Q1 - MCQ
                  {
                    qtype: "MCQ",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "She ___ to school by bus every day.",
                    },
                    options: {
                      variants: [
                        { id: "A", text: "go" },
                        { id: "B", text: "goes" },
                        { id: "C", text: "going" },
                        { id: "D", text: "gone" },
                      ],
                    },
                    answerKey: { correct: "B" },
                    explanation: {
                      text: "With third person singular (she/he/it) in present simple, we add 's' or 'es' to the verb.",
                    },
                  },
                  // Q2 - DND_MATCH (contractions)
                  {
                    qtype: "DND_MATCH",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "Match the full forms with their contractions.",
                    },
                    options: {
                      pairs: [
                        { id: "p1", left: "I am", right: "I'm" },
                        { id: "p2", left: "You are", right: "You're" },
                        { id: "p3", left: "He is", right: "He's" },
                        { id: "p4", left: "They are", right: "They're" },
                      ],
                    },
                    answerKey: {
                      correctPairs: [
                        { leftId: "I am", rightId: "I'm" },
                        { leftId: "You are", rightId: "You're" },
                        { leftId: "He is", rightId: "He's" },
                        { leftId: "They are", rightId: "They're" },
                      ],
                    },
                  },
                  // Q3 - GAP
                  {
                    qtype: "GAP",
                    order: 3,
                    maxScore: 1,
                    prompt: {
                      text: "They ___ playing football in the park right now.",
                      hint: "Use the present continuous tense",
                    },
                    answerKey: { correct: "are" },
                  },
                ],
              },
            },

            // VOCABULARY SECTION
            {
              type: "VOCABULARY",
              title: "Vocabulary",
              durationMin: 10,
              order: 5,
              questions: {
                create: [
                  // Q1 - DND_MATCH (words to definitions)
                  {
                    qtype: "DND_MATCH",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "Match each word with its correct definition.",
                    },
                    options: {
                      pairs: [
                        { id: "p1", left: "Happy", right: "Feeling or showing pleasure" },
                        { id: "p2", left: "Tired", right: "In need of sleep or rest" },
                        { id: "p3", left: "Hungry", right: "Feeling a need for food" },
                        { id: "p4", left: "Angry", right: "Feeling or showing strong annoyance" },
                      ],
                    },
                    answerKey: {
                      correctPairs: [
                        { leftId: "Happy", rightId: "Feeling or showing pleasure" },
                        { leftId: "Tired", rightId: "In need of sleep or rest" },
                        { leftId: "Hungry", rightId: "Feeling a need for food" },
                        { leftId: "Angry", rightId: "Feeling or showing strong annoyance" },
                      ],
                    },
                  },
                  // Q2 - GAP
                  {
                    qtype: "GAP",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "I need to ___ a ticket for the concert.",
                      hint: "A verb meaning 'to purchase'",
                    },
                    answerKey: { correct: "buy", alternatives: ["purchase", "get"] },
                  },
                  // Q3 - MCQ
                  {
                    qtype: "MCQ",
                    order: 3,
                    maxScore: 1,
                    prompt: {
                      text: "What is the opposite of 'expensive'?",
                    },
                    options: {
                      variants: [
                        { id: "A", text: "cheap" },
                        { id: "B", text: "costly" },
                        { id: "C", text: "valuable" },
                        { id: "D", text: "pricey" },
                      ],
                    },
                    answerKey: { correct: "A" },
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      examId: exam.id,
      title: exam.title,
      category: exam.category,
      track: exam.track,
      sectionsCount: exam.sections.length,
      questionsCount: exam.sections.reduce((sum, s) => sum + s.questions.length, 0),
      sections: exam.sections.map((s) => ({
        type: s.type,
        title: s.title,
        questionsCount: s.questions.length,
        questionTypes: [...new Set(s.questions.map((q) => q.qtype))],
      })),
    });
  } catch (error) {
    console.error("Seed A2 Unit 1 error:", error);
    return NextResponse.json(
      { error: "Failed to seed exam", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove the seeded exam
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    if (!["ADMIN", "BOSS"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        title: "General English A2 — Unit 1",
        category: "GENERAL_ENGLISH",
        track: "A2",
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Delete exam (cascade will handle sections and questions)
    await prisma.exam.delete({
      where: { id: exam.id },
    });

    return NextResponse.json({
      success: true,
      message: "Demo exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete seed error:", error);
    return NextResponse.json(
      { error: "Failed to delete exam", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

