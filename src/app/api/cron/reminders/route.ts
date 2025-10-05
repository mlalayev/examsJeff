import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminder } from "@/lib/email";

// Protect cron endpoint with a secret token
// In production, set CRON_SECRET in Vercel environment variables
const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Time windows with 20 minute buffer to catch bookings
    // 24h window: from now+23h40m to now+24h20m
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 40 * 60 * 1000);
    const window24hEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 20 * 60 * 1000);
    
    // 1h window: from now+40m to now+1h20m
    const window1hStart = new Date(now.getTime() + 40 * 60 * 1000);
    const window1hEnd = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 20 * 60 * 1000);

    console.log('🔔 Running reminder cron job...');
    console.log('Current time (UTC):', now.toISOString());

    let sent24h = 0;
    let sent1h = 0;

    // Find bookings needing 24h reminder
    const bookings24h = await prisma.booking.findMany({
      where: {
        startAt: {
          gte: window24hStart,
          lte: window24hEnd,
        },
        reminded24h: false,
        status: {
          in: ["CONFIRMED", "IN_PROGRESS"]
        }
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        teacher: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    console.log(`Found ${bookings24h.length} bookings needing 24h reminder`);

    // Send 24h reminders
    for (const booking of bookings24h) {
      try {
        // Send emails
        await sendBookingReminder({
          studentEmail: booking.student.email,
          studentName: booking.student.name,
          teacherEmail: booking.teacher?.email || null,
          teacherName: booking.teacher?.name || null,
          examTitle: booking.exam.title,
          startAt: booking.startAt,
          sections: booking.sections,
          hoursUntil: 24,
        });

        // Create in-app notifications
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            channel: "IN_APP",
            title: "Exam Reminder: 24 hours",
            body: `Your exam "${booking.exam.title}" is scheduled in 24 hours`,
            sentAt: new Date(),
            meta: {
              bookingId: booking.id,
              examId: booking.exam.id,
              type: "REMINDER_24H"
            }
          }
        });

        if (booking.teacherId) {
          await prisma.notification.create({
            data: {
              userId: booking.teacherId,
              channel: "IN_APP",
              title: "Exam Reminder: 24 hours",
              body: `${booking.student.name || booking.student.email} has exam "${booking.exam.title}" in 24 hours`,
              sentAt: new Date(),
              meta: {
                bookingId: booking.id,
                examId: booking.exam.id,
                studentId: booking.studentId,
                type: "REMINDER_24H"
              }
            }
          });
        }

        // Update reminder flag
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminded24h: true }
        });

        sent24h++;
      } catch (error) {
        console.error(`Error sending 24h reminder for booking ${booking.id}:`, error);
      }
    }

    // Find bookings needing 1h reminder
    const bookings1h = await prisma.booking.findMany({
      where: {
        startAt: {
          gte: window1hStart,
          lte: window1hEnd,
        },
        reminded1h: false,
        status: {
          in: ["CONFIRMED", "IN_PROGRESS"]
        }
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        teacher: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    console.log(`Found ${bookings1h.length} bookings needing 1h reminder`);

    // Send 1h reminders
    for (const booking of bookings1h) {
      try {
        // Send emails
        await sendBookingReminder({
          studentEmail: booking.student.email,
          studentName: booking.student.name,
          teacherEmail: booking.teacher?.email || null,
          teacherName: booking.teacher?.name || null,
          examTitle: booking.exam.title,
          startAt: booking.startAt,
          sections: booking.sections,
          hoursUntil: 1,
        });

        // Create in-app notifications
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            channel: "IN_APP",
            title: "Exam Starting Soon!",
            body: `Your exam "${booking.exam.title}" starts in 1 hour`,
            sentAt: new Date(),
            meta: {
              bookingId: booking.id,
              examId: booking.exam.id,
              type: "REMINDER_1H"
            }
          }
        });

        if (booking.teacherId) {
          await prisma.notification.create({
            data: {
              userId: booking.teacherId,
              channel: "IN_APP",
              title: "Exam Starting Soon",
              body: `${booking.student.name || booking.student.email} has exam "${booking.exam.title}" in 1 hour`,
              sentAt: new Date(),
              meta: {
                bookingId: booking.id,
                examId: booking.exam.id,
                studentId: booking.studentId,
                type: "REMINDER_1H"
              }
            }
          });
        }

        // Update reminder flag
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminded1h: true }
        });

        sent1h++;
      } catch (error) {
        console.error(`Error sending 1h reminder for booking ${booking.id}:`, error);
      }
    }

    console.log(`✅ Reminder cron completed: ${sent24h} x 24h, ${sent1h} x 1h`);

    return NextResponse.json({
      success: true,
      sent24h,
      sent1h,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

