"use client";

import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#dbe0e6] bg-white shadow-xl dark:border-[#2d394a] dark:bg-[#1a2433]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#dbe0e6] p-4 dark:border-[#2d394a]">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#617289] hover:bg-[#f0f2f4] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
