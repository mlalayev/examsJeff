import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/mainpage/Footer/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | JEFF Exams",
  description:
    "Learn how JEFF Exams collects, uses and protects your personal data for mock exams and educational services.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Page heading */}
          <div className="mb-10 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#303380]/70 mb-2">
              Legal
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated:{" "}
              <span className="font-medium text-slate-600">
                27 February 2026
              </span>
            </p>
          </div>

          {/* Card container */}
          <div className="bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70 rounded-2xl overflow-hidden">
            {/* Hero strip */}
            <div className="h-2 bg-gradient-to-r from-[#303380] via-indigo-500 to-sky-400" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 text-sm leading-relaxed text-slate-700">
              <section>
                <p className="mb-3">
                  This Privacy Policy explains how{" "}
                  <span className="font-semibold text-slate-900">
                    JEFF Exams
                  </span>{" "}
                  (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects,
                  uses and protects your information when you use our online
                  mock exams platform, including IELTS, TOEFL and SAT
                  preparation services (the &quot;Service&quot;).
                </p>
                <p>
                  By using the Service, you agree to the collection and use of
                  information in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  1. Information we collect
                </h2>
                <div className="space-y-2">
                  <p>We collect the following types of information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>
                      <span className="font-medium">Account information</span>{" "}
                      such as your name, email address, phone number and role
                      (student, teacher, administrator, etc.).
                    </li>
                    <li>
                      <span className="font-medium">Exam data</span> including
                      your practice attempts, answers, scores, AI feedback, and
                      teacher comments.
                    </li>
                    <li>
                      <span className="font-medium">Usage data</span> such as
                      pages visited, features used, session duration, and basic
                      technical information (browser type, device, approximate
                      location based on IP).
                    </li>
                    <li>
                      <span className="font-medium">Communication data</span>{" "}
                      including messages you send to us (for example via email
                      or messaging apps).
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  2. How we use your information
                </h2>
                <p className="mb-2">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>To create and manage your account on JEFF Exams.</li>
                  <li>
                    To deliver mock exams, AI-powered feedback and teacher
                    grading.
                  </li>
                  <li>
                    To track your progress and provide analytics to you and your
                    teachers or administrators.
                  </li>
                  <li>
                    To improve our exams, AI models and learning experience.
                  </li>
                  <li>
                    To communicate with you about updates, support and important
                    notices.
                  </li>
                  <li>To maintain the security and integrity of the Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  3. Legal bases for processing
                </h2>
                <p>
                  Where applicable, we process your personal data based on one
                  or more of the following legal bases: your consent, 
                  performance of a contract (providing the Service), compliance
                  with legal obligations, and our legitimate interests in
                  operating and improving the platform.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  4. Data retention
                </h2>
                <p>
                  We retain your information for as long as your account is
                  active or as needed to provide the Service, comply with legal
                  obligations, resolve disputes, and enforce our agreements.
                  When data is no longer required, we will delete or anonymize
                  it.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  5. Sharing and disclosure
                </h2>
                <p className="mb-2">
                  We do not sell your personal data. We may share your data in
                  the following situations:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    With{" "}
                    <span className="font-medium">teachers and schools</span>{" "}
                    who manage your learning and need access to your exam
                    results.
                  </li>
                  <li>
                    With <span className="font-medium">service providers</span>{" "}
                    who help us operate the platform (for example, hosting,
                    email, analytics), under appropriate confidentiality and
                    security obligations.
                  </li>
                  <li>
                    When required by <span className="font-medium">law</span> or
                    to protect our rights, users, or the public.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  6. International transfers
                </h2>
                <p>
                  Depending on where you are located, your data may be processed
                  on servers located in other countries. We take reasonable
                  steps to ensure that your information receives an adequate
                  level of protection in all locations.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  7. Your rights
                </h2>
                <p className="mb-2">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 mb-2">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction of inaccurate or incomplete data.</li>
                  <li>Request deletion of your data, in certain circumstances.</li>
                  <li>
                    Object to or restrict certain types of processing, including
                    direct marketing.
                  </li>
                  <li>Request a copy of your data in a portable format.</li>
                </ul>
                <p>
                  To exercise these rights, please contact us using the details
                  in the{" "}
                  <span className="font-medium text-slate-900">
                    Contact us
                  </span>{" "}
                  section below. We may need to verify your identity before
                  responding to your request.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  8. Children&apos;s privacy
                </h2>
                <p>
                  Our Service is used by students, including minors, under the
                  supervision of parents, guardians, teachers or schools. If you
                  believe that we have collected personal data from a child
                  without appropriate consent, please contact us and we will
                  take steps to delete the information.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  9. Changes to this Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or for legal, regulatory, or
                  operational reasons. When we make material changes, we will
                  update the &quot;Last updated&quot; date at the top of this
                  page and, where appropriate, provide additional notice.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  10. Contact us
                </h2>
                <p className="mb-2">
                  If you have any questions about this Privacy Policy or how we
                  handle your data, you can contact us at:
                </p>
                <ul className="list-none space-y-1">
                  <li>
                    Email:{" "}
                    <a
                      href="mailto:info@jeff.az"
                      className="text-[#303380] hover:text-[#252a6b] font-medium underline decoration-1 underline-offset-2"
                    >
                      info@jeff.az
                    </a>
                  </li>
                  <li>
                    Phone (WhatsApp):{" "}
                    <a
                      href="https://wa.me/994506119100"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#303380] hover:text-[#252a6b] font-medium underline decoration-1 underline-offset-2"
                    >
                      +994 50 611 91 00
                    </a>
                  </li>
                </ul>
              </section>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Part of the JEFF Exams platform.</span>
                <span className="hidden sm:inline">•</span>
                <span>
                  For general information about the service, visit{" "}
                  <Link
                    href="/"
                    className="text-[#303380] hover:text-[#252a6b] font-medium underline decoration-1 underline-offset-2"
                  >
                    jeff exams homepage
                  </Link>
                  .
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

