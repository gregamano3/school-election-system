"use client";

import { useState } from "react";
import Modal from "./Modal";

export function useInputDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const prompt = (
    title: string,
    label: string,
    onConfirm: (value: string) => void,
    options?: { placeholder?: string; defaultValue?: string; confirmText?: string; cancelText?: string }
  ) => {
    setConfig({
      title,
      label,
      onConfirm,
      placeholder: options?.placeholder,
      defaultValue: options?.defaultValue || "",
      confirmText: options?.confirmText || "OK",
      cancelText: options?.cancelText || "Cancel",
    });
    setIsOpen(true);
  };

  const Dialog = () => {
    const [value, setValue] = useState(config?.defaultValue || "");

    const handleConfirm = () => {
      if (value.trim()) {
        config?.onConfirm(value.trim());
        setIsOpen(false);
        setConfig(null);
        setValue("");
      }
    };

    const handleCancel = () => {
      setIsOpen(false);
      setConfig(null);
      setValue("");
    };

    if (!config) return null;

    return (
      <Modal isOpen={isOpen} onClose={handleCancel} title={config.title}>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">{config.label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") handleCancel();
              }}
              placeholder={config.placeholder}
              autoFocus
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium dark:border-[#2d394a] dark:bg-[#1a2433]"
            >
              {config.cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!value.trim()}
              className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4] disabled:opacity-50"
            >
              {config.confirmText}
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  return { prompt, Dialog };
}
