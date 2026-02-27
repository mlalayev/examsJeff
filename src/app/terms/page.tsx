import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/mainpage/Footer/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | JEFF Exams",
  description:
    "Read the terms and conditions for using the JEFF Exams mock exams platform.",
};

export default function TermsOfServicePage() {
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
              Terms of Service
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
                  These Terms of Service (&quot;Terms&quot;) govern your access
                  to and use of the{" "}
                  <span className="font-semibold text-slate-900">
                    JEFF Exams
                  </span>{" "}
                  mock exams platform, including IELTS, TOEFL and SAT
                  preparation services (the &quot;Service&quot;).
                </p>
                <p>
                  By creating an account or using the Service, you agree to be
                  bound by these Terms. If you do not agree, you must not use
                  the Service.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  1. Eligibility and accounts
                </h2>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    You must provide accurate and complete information when
                    creating your account.
                  </li>
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your login credentials and for all activity under your
                    account.
                  </li>
                  <li>
                    If you are under the age required by your local laws, you
                    may only use the Service under the supervision of a parent,
                    guardian, teacher or school.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  2. Use of the Service
                </h2>
                <p className="mb-2">
                  The Service is provided for educational purposes only. You
                  agree that you will:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    Use the platform in accordance with these Terms and
                    applicable laws.
                  </li>
                  <li>
                    Not attempt to cheat, bypass exam rules, or manipulate exam
                    results.
                  </li>
                  <li>
                    Not interfere with or disrupt the security, integrity or
                    performance of the Service.
                  </li>
                  <li>
                    Not reverse engineer, decompile or attempt to derive source
                    code from the Service, except where permitted by law.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  3. Exams, feedback and AI usage
                </h2>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    The Service provides mock exams, AI-powered feedback and
                    teacher grading to help you prepare, but{" "}
                    <span className="font-medium">
                      does not guarantee specific scores
                    </span>{" "}
                    in official exams.
                  </li>
                  <li>
                    AI-generated feedback is provided on a best-effort basis and
                    may occasionally contain mistakes. Teachers and students
                    should use it as guidance, not as the only source of truth.
                  </li>
                  <li>
                    We may use your anonymized exam data to improve our
                    questions, analytics and AI models, as described in our{" "}
                    <Link
                      href="/privacy"
                      className="text-[#303380] hover:text-[#252a6b] font-medium underline decoration-1 underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  4. Payments and access
                </h2>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    Access to certain exams or features may require payment or a
                    valid subscription arranged with your school or provider.
                  </li>
                  <li>
                    Unless otherwise stated, fees are non-refundable once an
                    exam or package has been activated, except where required by
                    law.
                  </li>
                  <li>
                    We may temporarily suspend or limit access for maintenance,
                    security reasons, or to protect the Service and its users.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  5. Intellectual property
                </h2>
                <p className="mb-2">
                  All exam content, questions, explanations, software, design,
                  and branding on the Service are owned by JEFF Exams or its
                  licensors and are protected by intellectual property laws.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>
                    You are granted a limited, non-exclusive, non-transferable
                    license to use the Service for your personal or
                    educational-institution use.
                  </li>
                  <li>
                    You may not copy, redistribute, sell or publicly display
                    exam content without our prior written permission.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  6. Prohibited activities
                </h2>
                <p className="mb-2">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Upload or share unlawful, harmful or offensive content.</li>
                  <li>
                    Harass, abuse or harm other users, teachers or staff.
                  </li>
                  <li>
                    Attempt unauthorized access to other accounts or to areas of
                    the Service that are not intended for you.
                  </li>
                  <li>
                    Use automated tools (bots, scrapers) without our written
                    permission.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  7. Termination
                </h2>
                <p className="mb-2">
                  We may suspend or terminate your access to the Service if:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>You materially breach these Terms.</li>
                  <li>
                    We are required to do so by law or by a partner institution.
                  </li>
                  <li>
                    There are security or technical issues that require action.
                  </li>
                </ul>
                <p className="mt-2">
                  Where reasonable, we will try to notify you in advance and
                  explain the reason for suspension or termination.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  8. Disclaimers
                </h2>
                <p>
                  The Service is provided on an &quot;as is&quot; and &quot;as
                  available&quot; basis. While we aim to provide a reliable,
                  high-quality learning experience, we do not warrant that the
                  Service will be uninterrupted, error-free, or free of
                  inaccuracies in exam content or AI feedback. To the maximum
                  extent permitted by law, we disclaim all warranties, whether
                  express or implied.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  9. Limitation of liability
                </h2>
                <p>
                  To the maximum extent permitted by law, JEFF Exams will not be
                  liable for any indirect, incidental, special, consequential or
                  punitive damages, or any loss of profits or data, arising out
                  of or in connection with your use of the Service. In all
                  cases, our total liability for any claim relating to the
                  Service will be limited to the amount you paid (if any) for
                  access to the Service during the 6 months preceding the event
                  giving rise to the claim.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  10. Changes to these Terms
                </h2>
                <p>
                  We may update these Terms from time to time. When we make
                  material changes, we will update the &quot;Last updated&quot;
                  date at the top of this page and, where appropriate, provide
                  additional notice (for example, via email or in-app
                  notifications). Your continued use of the Service after the
                  changes take effect means you agree to the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  11. Contact us
                </h2>
                <p className="mb-2">
                  If you have any questions about these Terms or the Service,
                  you can contact us at:
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
                  For information about how we handle your data, please also
                  read our{" "}
                  <Link
                    href="/privacy"
                    className="text-[#303380] hover:text-[#252a6b] font-medium underline decoration-1 underline-offset-2"
                  >
                    Privacy Policy
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

