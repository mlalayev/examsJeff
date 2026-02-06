import React from "react";

interface SubmitModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionTitle: string;
}

export const SubmitModuleModal: React.FC<SubmitModuleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sectionTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Finish this module?
        </h2>
        <p className="mb-1 text-sm text-gray-700">
          You are about to submit the current section:
        </p>
        <p className="mb-4 text-sm font-medium text-gray-900">
          {sectionTitle || "Current section"}
        </p>
        <p className="mb-6 text-sm text-gray-600">
          After submitting, you will not be able to change answers in this
          section.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b]"
          >
            Submit section
          </button>
        </div>
      </div>
    </div>
  );
};


