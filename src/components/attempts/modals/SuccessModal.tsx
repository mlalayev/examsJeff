import React from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Exam submitted
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Your answers have been successfully submitted. You can safely close
          this window now.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b]"
        >
          Close
        </button>
      </div>
    </div>
  );
};


