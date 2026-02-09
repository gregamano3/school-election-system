"use client";

import { useState } from "react";
import Modal from "./Modal";

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    message: string;
    onConfirm: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const confirm = (
    message: string,
    onConfirm: () => void,
    options?: { title?: string; confirmText?: string; cancelText?: string }
  ) => {
    setConfig({
      message,
      onConfirm,
      title: options?.title || "Confirm",
      confirmText: options?.confirmText || "Confirm",
      cancelText: options?.cancelText || "Cancel",
    });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    config?.onConfirm();
    setIsOpen(false);
    setConfig(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setConfig(null);
  };

  const Dialog = () => (
    <Modal isOpen={isOpen} onClose={handleCancel} title={config?.title || "Confirm"}>
      <p className="mb-4 text-sm text-[#617289] dark:text-[#a1b0c3]">{config?.message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium dark:border-[#2d394a] dark:bg-[#1a2433]"
        >
          {config?.cancelText || "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4]"
        >
          {config?.confirmText || "Confirm"}
        </button>
      </div>
    </Modal>
  );

  return { confirm, Dialog };
}
