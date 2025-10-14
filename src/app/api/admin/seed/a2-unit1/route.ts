import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    console.log("Starting seed process...");
    
    const user = await requireAuth();
    console.log("User authenticated:", user?.email);
    
    const role = (user as any).role;
    console.log("User role:", role);

    // Only ADMIN, BOSS, or TEACHER can seed
    if (!["ADMIN", "BOSS", "TEACHER"].includes(role)) {
      console.log("Access denied for role:", role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if exam already exists
    console.log("Checking for existing exam...");
    const existing = await prisma.exam.findFirst({
      where: {
        title: "General English A2 — Unit 1",
        category: "GENERAL_ENGLISH",
        track: "A2",
      },
    });

    if (existing) {
      console.log("Exam already exists:", existing.id);
      return NextResponse.json(
        { error: "This exam already exists", examId: existing.id },
        { status: 400 }
      );
    }

    console.log("Creating new exam...");

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
              durationMin: 15,
              order: 1,
              questions: {
                create: [
                  // Q1 - TF with passage
                  {
                    qtype: "TF",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      passage: "Sara lives in Baku and studies every evening.",
                      text: "Sara studies in the morning.",
                    },
                    answerKey: { value: false },
                    explanation: {
                      text: "The passage says Sara studies every evening, not in the morning.",
                    },
                  },
                  // Q2 - MCQ_SINGLE with passage
                  {
                    qtype: "MCQ_SINGLE",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      passage: "Tom usually goes to work by bus.",
                      text: "How does Tom usually go to work?",
                    },
                    options: {
                      choices: ["by car", "by bus", "on foot"],
                    },
                    answerKey: { index: 1 },
                    explanation: {
                      text: "The passage clearly states 'Tom usually goes to work by bus'.",
                    },
                  },
                  // Q3 - MCQ_MULTI
                  {
                    qtype: "MCQ_MULTI",
                    order: 3,
                    maxScore: 1,
                    prompt: {
                      text: "Choose healthy morning habits.",
                    },
                    options: {
                      choices: ["Skipping breakfast", "Drinking water", "Short exercise"],
                    },
                    answerKey: { indices: [1, 2] },
                    explanation: {
                      text: "Drinking water and doing short exercise are healthy habits. Skipping breakfast is not recommended.",
                    },
                  },
                ],
              },
            },

            // LISTENING SECTION (text-based transcript)
            {
              type: "LISTENING",
              title: "Listening Comprehension",
              durationMin: 10,
              order: 2,
              questions: {
                create: [
                  // Q1 - TF
                  {
                    qtype: "TF",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      transcript: "The meeting starts at nine thirty.",
                      text: "The meeting starts at 9:30.",
                    },
                    answerKey: { value: true },
                    explanation: {
                      text: "The transcript says 'nine thirty', which is 9:30.",
                    },
                  },
                  // Q2 - SELECT
                  {
                    qtype: "SELECT",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      transcript: "Please bring your ID and a pen.",
                      text: "What should you bring?",
                    },
                    options: {
                      choices: ["Notebook only", "ID and a pen", "Laptop"],
                    },
                    answerKey: { index: 1 },
                    explanation: {
                      text: "The speaker clearly asks to bring 'your ID and a pen'.",
                    },
                  },
                ],
              },
            },

            // WRITING SECTION
            {
              type: "WRITING",
              title: "Writing Skills",
              durationMin: 20,
              order: 3,
              questions: {
                create: [
                  // Q1 - ORDER_SENTENCE
                  {
                    qtype: "ORDER_SENTENCE",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "Put the words in the correct order to make a sentence.",
                      tokens: ["is", "playing", "she", "in", "garden", "the"],
                    },
                    answerKey: {
                      order: [2, 0, 1, 3, 5, 4], // she is playing in the garden
                    },
                    explanation: {
                      text: "The correct sentence is: 'She is playing in the garden.'",
                    },
                  },
                  // Q2 - DND_GAP
                  {
                    qtype: "DND_GAP",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "Fill in the blanks with the correct form of 'to be'.",
                      textWithBlanks: "I ___ running. You ___ playing. He ___ reading.",
                    },
                    options: {
                      bank: ["am", "is", "are"],
                    },
                    answerKey: {
                      blanks: ["am", "are", "is"],
                    },
                    explanation: {
                      text: "I am, You are, He is - these are the correct forms of 'to be'.",
                    },
                  },
                ],
              },
            },

            // GRAMMAR SECTION
            {
              type: "GRAMMAR",
              title: "Grammar",
              durationMin: 10,
              order: 4,
              questions: {
                create: [
                  // Q1 - MCQ_SINGLE
                  {
                    qtype: "MCQ_SINGLE",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "She ___ to school by bus.",
                    },
                    options: {
                      choices: ["go", "goes", "going"],
                    },
                    answerKey: { index: 1 },
                    explanation: {
                      text: "With third person singular (she) in present simple, we use 'goes'.",
                    },
                  },
                  // Q2 - GAP
                  {
                    qtype: "GAP",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "I usually ___ coffee in the morning.",
                    },
                    answerKey: { answers: ["drink"] },
                    explanation: {
                      text: "With 'I' in present simple, we use the base form 'drink'.",
                    },
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
                  // Q1 - DND_GAP
                  {
                    qtype: "DND_GAP",
                    order: 1,
                    maxScore: 1,
                    prompt: {
                      text: "Fill in the blanks with the correct verbs.",
                      textWithBlanks: "I need to ___ a ticket and ___ a hotel.",
                    },
                    options: {
                      bank: ["book", "buy", "cook"],
                    },
                    answerKey: {
                      blanks: ["buy", "book"],
                    },
                    explanation: {
                      text: "We 'buy' a ticket and 'book' a hotel.",
                    },
                  },
                  // Q2 - MCQ_MULTI
                  {
                    qtype: "MCQ_MULTI",
                    order: 2,
                    maxScore: 1,
                    prompt: {
                      text: "Select words related to 'transport'.",
                    },
                    options: {
                      choices: ["bus", "keyboard", "train", "window"],
                    },
                    answerKey: { indices: [0, 2] },
                    explanation: {
                      text: "Bus and train are types of transport. Keyboard and window are not.",
                    },
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
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { 
        error: "Failed to seed exam", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
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

