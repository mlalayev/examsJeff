import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

/**
 * POST /api/admin/seed/ge-demo
 * Seeds demo General English exams (2-3 units per level)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only ADMIN and BOSS can seed
    if (role !== "ADMIN" && role !== "BOSS") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const levels = ["A1", "A2", "B1", "B1+", "B2"];
    const createdExams = [];

    for (const level of levels) {
      // Create 2-3 units per level
      const unitCount = level === "A2" ? 3 : 2;

      for (let unitNum = 1; unitNum <= unitCount; unitNum++) {
        const examTitle = `General English ${level} — Unit ${unitNum}`;

        // Check if exam already exists
        const existing = await prisma.exam.findFirst({
          where: {
            title: examTitle,
            category: "GENERAL_ENGLISH",
            track: level,
          },
        });

        if (existing) {
          console.log(`Exam "${examTitle}" already exists, skipping...`);
          continue;
        }

        // Create exam with sections
        const exam = await prisma.exam.create({
          data: {
            title: examTitle,
            category: "GENERAL_ENGLISH",
            track: level,
            isActive: true,
            createdById: user.id,
            sections: {
              create: [
                {
                  type: "READING",
                  title: "Reading Comprehension",
                  order: 1,
                  durationMin: 15,
                  questions: {
                    create: [
                      // TF Question
                      {
                        qtype: "TF",
                        order: 1,
                        maxScore: 1,
                        prompt: {
                          passage: `Emma lives in London and works at a bookstore. She loves reading mystery novels.`,
                          text: "Emma works at a library.",
                        },
                        answerKey: { value: false },
                        explanation: { text: "Emma works at a bookstore, not a library." },
                      },
                      // MCQ_SINGLE
                      {
                        qtype: "MCQ_SINGLE",
                        order: 2,
                        maxScore: 1,
                        prompt: {
                          passage: `Tom usually takes the bus to work every morning.`,
                          text: "How does Tom go to work?",
                        },
                        options: { choices: ["by car", "by bus", "on foot", "by train"] },
                        answerKey: { index: 1 },
                        explanation: { text: "The passage states Tom takes the bus." },
                      },
                      // MCQ_MULTI
                      {
                        qtype: "MCQ_MULTI",
                        order: 3,
                        maxScore: 1,
                        prompt: {
                          text: "Which of these are healthy breakfast options?",
                        },
                        options: {
                          choices: ["Fresh fruit", "Donuts", "Yogurt", "Candy"],
                        },
                        answerKey: { indices: [0, 2] },
                        explanation: { text: "Fresh fruit and yogurt are healthy options." },
                      },
                    ],
                  },
                },
                {
                  type: "LISTENING",
                  title: "Listening Comprehension",
                  order: 2,
                  durationMin: 15,
                  questions: {
                    create: [
                      // TF with transcript
                      {
                        qtype: "TF",
                        order: 1,
                        maxScore: 1,
                        prompt: {
                          transcript: "The meeting will start at 9:30 in room 204.",
                          text: "The meeting starts at 9:30.",
                        },
                        answerKey: { value: true },
                        explanation: { text: "The audio confirms 9:30." },
                      },
                      // SELECT (dropdown)
                      {
                        qtype: "SELECT",
                        order: 2,
                        maxScore: 1,
                        prompt: {
                          transcript: "Please bring your ID card and a pen to the exam.",
                          text: "What should you bring?",
                        },
                        options: {
                          choices: ["Notebook", "ID card and pen", "Laptop", "Calculator"],
                        },
                        answerKey: { index: 1 },
                        explanation: { text: "You need ID card and pen." },
                      },
                    ],
                  },
                },
                {
                  type: "WRITING",
                  title: "Writing Skills",
                  order: 3,
                  durationMin: 20,
                  questions: {
                    create: [
                      // ORDER_SENTENCE
                      {
                        qtype: "ORDER_SENTENCE",
                        order: 1,
                        maxScore: 1,
                        prompt: {
                          tokens: ["is", "playing", "she", "in", "the", "garden"],
                        },
                        answerKey: { order: [2, 0, 1, 3, 4, 5] },
                        explanation: { text: 'Correct: "she is playing in the garden"' },
                      },
                      // DND_GAP
                      {
                        qtype: "DND_GAP",
                        order: 2,
                        maxScore: 1,
                        prompt: {
                          textWithBlanks: "I ___ reading a book. You ___ watching TV. He ___ cooking dinner.",
                        },
                        options: { bank: ["am", "is", "are", "was", "were"] },
                        answerKey: { blanks: ["am", "are", "is"] },
                        explanation: { text: "Correct forms: am, are, is" },
                      },
                    ],
                  },
                },
                {
                  type: "GRAMMAR",
                  title: "Grammar",
                  order: 4,
                  durationMin: 10,
                  questions: {
                    create: [
                      // MCQ_SINGLE
                      {
                        qtype: "MCQ_SINGLE",
                        order: 1,
                        maxScore: 1,
                        prompt: { text: "She ___ to school every day." },
                        options: { choices: ["go", "goes", "going", "gone"] },
                        answerKey: { index: 1 },
                        explanation: { text: "Third person singular uses 'goes'." },
                      },
                      // GAP (fill in the blank)
                      {
                        qtype: "GAP",
                        order: 2,
                        maxScore: 1,
                        prompt: { text: "I usually ___ coffee in the morning." },
                        answerKey: { answers: ["drink"] },
                        explanation: { text: "Simple present: drink" },
                      },
                    ],
                  },
                },
                {
                  type: "VOCABULARY",
                  title: "Vocabulary",
                  order: 5,
                  durationMin: 10,
                  questions: {
                    create: [
                      // DND_GAP
                      {
                        qtype: "DND_GAP",
                        order: 1,
                        maxScore: 1,
                        prompt: {
                          textWithBlanks: "I need to ___ a ticket and ___ a hotel room.",
                        },
                        options: { bank: ["buy", "book", "cook", "make"] },
                        answerKey: { blanks: ["buy", "book"] },
                        explanation: { text: "buy a ticket, book a hotel" },
                      },
                      // MCQ_MULTI
                      {
                        qtype: "MCQ_MULTI",
                        order: 2,
                        maxScore: 1,
                        prompt: { text: "Select words related to 'transport':" },
                        options: {
                          choices: ["bus", "keyboard", "train", "window", "bicycle"],
                        },
                        answerKey: { indices: [0, 2, 4] },
                        explanation: { text: "bus, train, bicycle are transport" },
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

        createdExams.push({
          id: exam.id,
          title: exam.title,
          level: exam.track,
          sections: exam.sections.length,
          questions: exam.sections.reduce((sum, s) => sum + s.questions.length, 0),
        });

        console.log(`✓ Created: ${examTitle}`);
      }
    }

    return NextResponse.json({
      message: `Successfully seeded ${createdExams.length} General English exams`,
      exams: createdExams,
    });
  } catch (error: any) {
    console.error("Error seeding GE demo exams:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed exams" },
      { status: 500 }
    );
  }
}

