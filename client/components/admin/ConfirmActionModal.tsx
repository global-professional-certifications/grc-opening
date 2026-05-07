import React from "react";

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClassName = "bg-red-600 hover:bg-red-700",
  isProcessing = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[17px] font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">{message}</p>
        {children && <div className="mb-5">{children}</div>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 py-2.5 rounded-xl text-white text-[14px] font-bold transition-all disabled:opacity-60 ${confirmClassName}`}
          >
            {isProcessing ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
