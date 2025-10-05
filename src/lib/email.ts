// Email helper for sending notifications
// In development: logs to console
// In production: configure SMTP settings in .env

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, text, html } = options;

  // Check if SMTP is configured
  const smtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );

  if (smtpConfigured) {
    // Production: use nodemailer with SMTP
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(`✅ Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return false;
    }
  } else {
    // Development: log to console
    console.log('\n📧 ================== EMAIL (DEV MODE) ==================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${text}`);
    console.log('========================================================\n');
    return true;
  }
}

interface BookingReminderData {
  studentEmail: string;
  studentName: string | null;
  teacherEmail: string | null;
  teacherName: string | null;
  examTitle: string;
  startAt: Date;
  sections: string[];
  hoursUntil: number;
}

export async function sendBookingReminder(data: BookingReminderData): Promise<void> {
  const {
    studentEmail,
    studentName,
    teacherEmail,
    teacherName,
    examTitle,
    startAt,
    sections,
    hoursUntil,
  } = data;

  // Format date in Asia/Baku timezone
  const bakuTime = startAt.toLocaleString('en-US', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const sectionsText = sections.join(', ');
  const timeText = hoursUntil === 24 ? '24 hours' : '1 hour';

  // Email to student
  const studentSubject = `Reminder: ${examTitle} in ${timeText}`;
  const studentText = `
Hello ${studentName || 'Student'},

This is a reminder that you have an exam scheduled:

📚 Exam: ${examTitle}
📅 Date & Time: ${bakuTime} (Asia/Baku)
📝 Sections: ${sectionsText}
⏰ Starting in: ${timeText}

Please make sure you are prepared and ready at the scheduled time.

Good luck!

---
JEFF Exams Portal
  `.trim();

  await sendEmail({
    to: studentEmail,
    subject: studentSubject,
    text: studentText,
  });

  // Email to teacher (if exists)
  if (teacherEmail) {
    const teacherSubject = `Reminder: ${studentName || studentEmail} has exam in ${timeText}`;
    const teacherText = `
Hello ${teacherName || 'Teacher'},

This is a reminder that your student has an exam scheduled:

👤 Student: ${studentName || studentEmail}
📚 Exam: ${examTitle}
📅 Date & Time: ${bakuTime} (Asia/Baku)
📝 Sections: ${sectionsText}
⏰ Starting in: ${timeText}

The student has been notified.

---
JEFF Exams Portal
    `.trim();

    await sendEmail({
      to: teacherEmail,
      subject: teacherSubject,
      text: teacherText,
    });
  }
}

