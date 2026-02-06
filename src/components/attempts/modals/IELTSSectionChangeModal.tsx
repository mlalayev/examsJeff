"use client";

interface IELTSSectionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromSection: string;
  toSection: string;
  currentSectionAnswers: Record<string, any>;
  currentSectionQuestions: Array<{ id: string; prompt: any; qtype: string }>;
}

export function IELTSSectionChangeModal({
  isOpen,
  onClose,
  onConfirm,
  fromSection,
  toSection,
  currentSectionAnswers,
  currentSectionQuestions,
  }: IELTSSectionChangeModalProps) {
    if (!isOpen) return null;

    // Log answers with question details for backend submission
    const answersWithQuestions = currentSectionQuestions.map((q) => ({
      questionId: q.id,
      questionType: q.qtype,
      prompt: q.prompt,
      answer: currentSectionAnswers[q.id] || null,
    }));

    console.log("=== IELTS Section Change - Answers Log ===");
    console.log("From Section:", fromSection);
    console.log("To Section:", toSection);
    console.log("Total Questions:", currentSectionQuestions.length);
    console.log("Answers with Questions:", JSON.stringify(answersWithQuestions, null, 2));
    console.log("==========================================");
  
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-gray-900">
              Move to next section?
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              From <span className="font-semibold text-gray-700">{fromSection}</span> to{" "}
              <span className="font-semibold text-gray-700">{toSection}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-base"
          >
            ×
          </button>
        </div>

        {/* Warning strip */}
        <div className="mx-5 mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-medium text-amber-900">
          Warning: After moving to the next section, you won&apos;t be able to return here to view or change answers.
        </div>

        {/* Description under warning */}
        <div className="mx-5 mt-3 text-[11px] text-gray-600 leading-relaxed">
          You can wait until the timer finishes or move to the next section now. If you want to double-check
          anything before continuing, press{" "}
          <span className="font-semibold text-gray-800">Cancel</span> and stay in the current section.
        </div>

        {/* Footer */}
        <div className="px-5 py-4 mt-4 flex justify-end gap-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Stay in current
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

