import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // This endpoint will be called by Vercel Cron
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find payments due tomorrow
    const duePayments = await prisma.paymentSchedule.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollment: {
          select: {
            courseName: true,
            courseType: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notifications for each due payment
    const notifications = [];
    for (const payment of duePayments) {
      // Create notification for student
      const studentNotification = await prisma.notification.create({
        data: {
          userId: payment.student.id,
          channel: "in-app",
          title: "Payment Due Tomorrow",
          body: `Your payment of $${payment.amount} for ${payment.enrollment.courseName} is due tomorrow.`,
          meta: {
            paymentId: payment.id,
            amount: payment.amount,
            courseName: payment.enrollment.courseName,
          },
        },
      });

      // Find branch admins for this payment's branch
      const branchAdmins = await prisma.user.findMany({
        where: {
          role: "BRANCH_ADMIN",
          branchId: payment.branchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Create notifications for branch admins
      for (const admin of branchAdmins) {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            channel: "in-app",
            title: "Student Payment Due",
            body: `${payment.student.name}'s payment of $${payment.amount} for ${payment.enrollment.courseName} is due tomorrow.`,
            meta: {
              paymentId: payment.id,
              studentId: payment.student.id,
              studentName: payment.student.name,
              amount: payment.amount,
              courseName: payment.enrollment.courseName,
            },
          },
        });
        notifications.push(adminNotification);
      }

      notifications.push(studentNotification);
    }

    // Also check for overdue payments (more than 7 days past due)
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - 7);

    const overduePayments = await prisma.paymentSchedule.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: overdueDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollment: {
          select: {
            courseName: true,
            courseType: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update overdue payments status
    for (const payment of overduePayments) {
      await prisma.paymentSchedule.update({
        where: { id: payment.id },
        data: { status: "OVERDUE" },
      });

      // Create notification for branch admins about overdue payments
      const branchAdmins = await prisma.user.findMany({
        where: {
          role: "BRANCH_ADMIN",
          branchId: payment.branchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      for (const admin of branchAdmins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            channel: "in-app",
            title: "Overdue Payment Alert",
            body: `${payment.student.name}'s payment of $${payment.amount} for ${payment.enrollment.courseName} is overdue.`,
            meta: {
              paymentId: payment.id,
              studentId: payment.student.id,
              studentName: payment.student.name,
              amount: payment.amount,
              courseName: payment.enrollment.courseName,
              overdue: true,
            },
          },
        });
      }
    }

    return NextResponse.json({
      message: "Payment reminders processed successfully",
      duePayments: duePayments.length,
      overduePayments: overduePayments.length,
      notificationsCreated: notifications.length,
    });

  } catch (error) {
    console.error("Payment reminders cron error:", error);
    return NextResponse.json({ error: "Failed to process payment reminders" }, { status: 500 });
  }
}
