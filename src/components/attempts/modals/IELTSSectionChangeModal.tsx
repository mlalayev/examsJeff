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

  console.log("=== IELTS Section Change ===");
  console.log("From Section:", fromSection);
  console.log("To Section:", toSection);
  console.log("Answers with Questions:", answersWithQuestions);
  console.log("===========================");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Leaving {fromSection} Section
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium text-orange-600">
              ⚠️ Important: Please read carefully
            </p>
            <p>
              <strong>If you haven't finished all questions</strong>, we recommend you stay in this section and complete them.
            </p>
            <p>
              <strong>If you leave this section</strong>, you will NOT be able to return or make any changes to your answers.
            </p>
            <p className="text-gray-600">
              Your answers for this section have been saved and logged (check console for details).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Stay in {fromSection}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-[#303380] text-white rounded-lg font-medium hover:bg-[#252a6b] transition-colors"
          >
            Continue to {toSection}
          </button>
        </div>
      </div>
    </div>
  );
}

