import React from "react";

interface ResumeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeNotification: React.FC<ResumeNotificationProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20 pt-4 sm:pt-6">
      <div className="w-full max-w-lg rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Attempt resumed</p>
            <p className="mt-1 text-xs sm:text-sm">
              We loaded your previous progress for this exam. You can continue
              from where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-xs font-medium text-blue-800 hover:text-blue-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


