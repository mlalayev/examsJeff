# General English scoring and staff register

## Exam scoring

New General English exam submissions use a fixed 100-point budget:

| Category | Maximum |
| --- | ---: |
| Grammar | 25 |
| Vocabulary | 25 |
| Listening | 25 |
| Reading | 15 |
| Writing | 10 |

Questions have equal weight within their category. Repeated sections of the same type are combined by question count, so two listening sections share 25 points. Missing categories contribute zero; their points are not redistributed. Writing assessment remains automatic after submission; an AI failure leaves the grade pending without losing the submitted answers. General English homework retains its previous grading rules.

Speaking is a separate transcript assessment out of 100, excluded from overall and coin rewards. Audio and transcripts remain available for review. Use **Check with AI** on the speaking results to save its score; pronunciation cannot be assessed from the transcript. General English recording questions have independent Start/Save controls and a two-minute recording limit. IELTS keeps its own flow.

TXT import accepts `[SPEAKING]` and `Type: SPEAKING_RECORDING`, without an answer key. The import dialog's ChatGPT instructions include these rules. Repeated section headings still create separate sections.

Existing historical results are not bulk regraded by deployment. Rechecking a General English writing result recalculates that attempt with the new exam weights.

## Staff pages

- **Users**: All users, Parents, Partners, Active students, Alumni, Sunday examiners, Archive.
- **Profile & payments** opens personal details and access to the existing payment history/class fees. Existing account and payment action buttons are retained.
- **CRM**: All contacts and named stage filters.
- **Student register**: `/dashboard/student-register`, under Teaching for teachers and Courses for Creator/Admin/Boss.

The register uses saved lesson records, submitted exam attempts and weekly reports. Rows are per class/student. Teachers are restricted to their own classes and the exam categories mapped to those class names; SAT Verbal and SAT Math can both see the complete SAT attempt. Unknown class names grant no exam access. Missing feedback is shown as unrecorded, never as absence. Lesson cells open details; teachers can continue to the corresponding lesson editor. Staff can select a teacher. Dates use Asia/Baku.

## SAT break

SAT exams with four modules receive a ten-minute break between Verbal 2 and Math 1 if none exists. Existing break sections are reused. The countdown survives refresh and advances to Math 1 when it expires; Continue can finish the break early. Homework receives no new break or timer. Existing attempts already in Math are not redirected into the newly added break.

## Deployment

No database migration or new environment variable is required. Deploy the changed source, build successfully, then restart the application. Local tests mock the AI provider and database; production permissions, real recordings and grading should also be checked with a test account after deployment.
