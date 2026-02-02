import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * IELTS Mock Test Sample 1
 * 
 * Structure:
 * - Listening: 30 minutes, 40 questions (4 parts, 10 questions each)
 * - Reading: 60 minutes, 40 questions (3 passages)
 * - Writing: 60 minutes, 2 tasks
 * - Speaking: 11-14 minutes, 3 parts
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();

    // Check if exam already exists
    const existing = await prisma.exam.findFirst({
      where: { title: "IELTS Mock Test Sample 1" },
    });

    if (existing) {
      // Return existing exam info instead of error
      return NextResponse.json({
        success: true,
        message: "IELTS Mock Test Sample 1 already exists",
        exam: {
          id: existing.id,
          title: existing.title,
          category: existing.category,
          isActive: existing.isActive,
        },
      });
    }

    // Create IELTS Mock Test Sample 1
    const exam = await prisma.exam.create({
      data: {
        title: "IELTS Mock Test Sample 1",
        category: "IELTS",
        readingType: "ACADEMIC",
        writingType: "ACADEMIC",
        isActive: true,
        createdById: user.id,
        sections: {
          create: [
            // LISTENING SECTION - 4 Parts, 30 minutes total
            {
              type: "LISTENING",
              title: "Listening Section",
              instruction: JSON.stringify({
                text: "You will hear a number of different recordings and you will have to answer questions on what you hear. There will be time for you to read the instructions and questions and you will have a chance to check your work. All the recordings will be played ONCE only. The test is in four parts. At the end of the test you will be given 10 minutes to transfer your answers to an answer sheet.",
              }),
              durationMin: 30,
              order: 1,
              questions: {
                create: [
                  // Part 1: Conversation (Q1-10) - Everyday social context
                  ...Array.from({ length: 10 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: i,
                    prompt: {
                      text: `Question ${i + 1}: What is the main topic of the conversation?`,
                    },
                    options: {
                      choices: [
                        "Making a hotel reservation",
                        "Ordering food at a restaurant",
                        "Asking for directions",
                        "Discussing travel plans",
                      ],
                    },
                    answerKey: { index: i % 4 },
                    maxScore: 1,
                  })),
                  // Part 2: Monologue (Q11-20) - Everyday social context
                  ...Array.from({ length: 10 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: 10 + i,
                    prompt: {
                      text: `Question ${11 + i}: According to the speaker, what is the main purpose of this announcement?`,
                    },
                    options: {
                      choices: [
                        "To inform about a schedule change",
                        "To advertise a new service",
                        "To provide safety instructions",
                        "To introduce a new staff member",
                      ],
                    },
                    answerKey: { index: (i + 1) % 4 },
                    maxScore: 1,
                  })),
                  // Part 3: Conversation (Q21-30) - Educational/training context
                  ...Array.from({ length: 10 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: 20 + i,
                    prompt: {
                      text: `Question ${21 + i}: What do the speakers agree about?`,
                    },
                    options: {
                      choices: [
                        "The assignment deadline should be extended",
                        "The topic needs more research",
                        "The presentation format is suitable",
                        "The group needs to meet more often",
                      ],
                    },
                    answerKey: { index: (i + 2) % 4 },
                    maxScore: 1,
                  })),
                  // Part 4: Academic Monologue (Q31-40)
                  ...Array.from({ length: 10 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: 31 + i,
                    prompt: {
                      text: `Question ${31 + i}: According to the lecture, what is the key finding of the research?`,
                    },
                    options: {
                      choices: [
                        "Climate change affects migration patterns",
                        "Technology improves communication",
                        "Education reduces poverty rates",
                        "Healthcare access increases life expectancy",
                      ],
                    },
                    answerKey: { index: (i + 3) % 4 },
                    maxScore: 1,
                  })),
                ],
              },
            },
            // READING SECTION - 3 Passages, 60 minutes
            {
              type: "READING",
              title: "Reading Section",
              instruction: JSON.stringify({
                text: "You should spend about 20 minutes on each passage. Read the passages and answer the questions.",
                passage: "Passage 1 will appear here...",
              }),
              durationMin: 60,
              order: 2,
              questions: {
                create: [
                  // Passage 1: Questions 1-13 - Easier text
                  ...Array.from({ length: 13 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: i,
                    prompt: {
                      passage: "The History of Coffee\n\nCoffee is one of the most popular beverages in the world. It originated in Ethiopia and was first cultivated in the Arabian Peninsula. By the 15th century, coffee had reached the rest of the Middle East, Persia, Turkey, and northern Africa. From there, it spread to Europe and the Americas. Today, Brazil is the world's largest coffee producer, followed by Vietnam and Colombia.",
                      text: `Question ${i + 1}: According to the passage, where did coffee originate?`,
                    },
                    options: {
                      choices: [
                        "Ethiopia",
                        "Arabian Peninsula",
                        "Brazil",
                        "Europe",
                      ],
                    },
                    answerKey: { index: 0 },
                    maxScore: 1,
                  })),
                  // Passage 2: Questions 14-26 - Medium difficulty
                  ...Array.from({ length: 13 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: 13 + i,
                    prompt: {
                      passage: "Urban Planning and Sustainable Development\n\nModern urban planning focuses on creating sustainable cities that can support growing populations while minimizing environmental impact. Key strategies include mixed-use development, public transportation systems, and green building practices. Cities like Copenhagen and Singapore serve as models for sustainable urban design.",
                      text: `Question ${14 + i}: What is the main focus of modern urban planning?`,
                    },
                    options: {
                      choices: [
                        "Creating sustainable cities",
                        "Reducing population growth",
                        "Building more highways",
                        "Increasing industrial zones",
                      ],
                    },
                    answerKey: { index: 0 },
                    maxScore: 1,
                  })),
                  // Passage 3: Questions 27-40 - Harder academic text
                  ...Array.from({ length: 14 }, (_, i) => ({
                    qtype: "MCQ_SINGLE" as const,
                    order: 26 + i,
                    prompt: {
                      passage: "Cognitive Psychology and Memory Formation\n\nMemory formation involves complex neural processes in the hippocampus and prefrontal cortex. Research indicates that sleep plays a crucial role in memory consolidation. Studies show that REM sleep, in particular, helps transfer information from short-term to long-term memory storage.",
                      text: `Question ${27 + i}: According to the passage, which brain regions are involved in memory formation?`,
                    },
                    options: {
                      choices: [
                        "Hippocampus and prefrontal cortex",
                        "Cerebellum and brainstem",
                        "Thalamus and hypothalamus",
                        "Amygdala and temporal lobe",
                      ],
                    },
                    answerKey: { index: 0 },
                    maxScore: 1,
                  })),
                ],
              },
            },
            // WRITING SECTION - 2 Tasks, 60 minutes
            {
              type: "WRITING",
              title: "Writing Section",
              instruction: JSON.stringify({
                text: "You should spend about 20 minutes on Task 1 and 40 minutes on Task 2.",
              }),
              durationMin: 60,
              order: 3,
              questions: {
                create: [
                  // Task 1: Describe graph/chart (150 words minimum)
                  {
                    qtype: "ESSAY" as const,
                    order: 0,
                    prompt: {
                      text: "Task 1: The graph below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
                    },
                    answerKey: null,
                    maxScore: 0, // Manual grading
                  },
                  // Task 2: Essay (250 words minimum)
                  {
                    qtype: "ESSAY" as const,
                    order: 1,
                    prompt: {
                      text: "Task 2: Some people think that it is better to educate boys and girls in separate schools. Others, however, believe that boys and girls benefit more from attending mixed schools. Discuss both these views and give your own opinion. Write at least 250 words.",
                    },
                    answerKey: null,
                    maxScore: 0, // Manual grading
                  },
                ],
              },
            },
            // SPEAKING SECTION - 3 Parts, 11-14 minutes
            {
              type: "SPEAKING",
              title: "Speaking Section",
              instruction: JSON.stringify({
                text: "The Speaking test consists of three parts. Part 1: Introduction and interview (4-5 minutes). Part 2: Long turn (3-4 minutes). Part 3: Discussion (4-5 minutes).",
              }),
              durationMin: 14,
              order: 4,
              questions: {
                create: [
                  // Part 1: Introduction questions
                  {
                    qtype: "SHORT_TEXT" as const,
                    order: 0,
                    prompt: {
                      text: "Part 1: What is your full name?",
                    },
                    answerKey: { answers: ["Sample answer"] },
                    maxScore: 0, // Manual grading
                  },
                  {
                    qtype: "SHORT_TEXT" as const,
                    order: 1,
                    prompt: {
                      text: "Part 1: Where are you from?",
                    },
                    answerKey: { answers: ["Sample answer"] },
                    maxScore: 0,
                  },
                  // Part 2: Cue card
                  {
                    qtype: "ESSAY" as const,
                    order: 2,
                    prompt: {
                      text: "Part 2: Describe a place you visited that made a strong impression on you. You should say: where it was, when you went there, what you did there, and explain why it made such an impression on you. You have 1 minute to prepare and 1-2 minutes to speak.",
                    },
                    answerKey: null,
                    maxScore: 0,
                  },
                  // Part 3: Discussion questions
                  {
                    qtype: "SHORT_TEXT" as const,
                    order: 3,
                    prompt: {
                      text: "Part 3: Do you think tourism has more positive or negative effects on local communities?",
                    },
                    answerKey: { answers: ["Sample answer"] },
                    maxScore: 0,
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
      exam: {
        id: exam.id,
        title: exam.title,
        category: exam.category,
        sectionsCount: exam.sections.length,
        totalQuestions: exam.sections.reduce(
          (sum, s) => sum + s.questions.length,
          0
        ),
      },
    });
  } catch (error: any) {
    console.error("Error creating IELTS Mock Test Sample 1:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create exam" },
      { status: 500 }
    );
  }
}

// GET method for info
export async function GET() {
  return NextResponse.json({
    message: "IELTS Mock Test Sample 1 Seed Endpoint",
    method: "POST",
    description: "Send a POST request to create the IELTS Mock Test Sample 1 exam",
    structure: {
      listening: "30 minutes, 40 questions (4 parts)",
      reading: "60 minutes, 40 questions (3 passages)",
      writing: "60 minutes, 2 tasks",
      speaking: "11-14 minutes, 3 parts",
    },
  });
}

