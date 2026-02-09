"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function addToast(message: string, type: ToastType = "info") {
  const id = String(Date.now()) + Math.random();
  const newToast: Toast = { id, message, type };
  toasts = [...toasts, newToast];
  toastListeners.forEach((listener) => listener(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(toasts));
  }, 3000);
}

export function showToast(message: string, type: ToastType = "info") {
  addToast(message, type);
}

export function ToastContainer() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setState(newToasts);
    toastListeners.push(listener);
    setState(toasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {state.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
                : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              toast.type === "success" ? "text-green-600 dark:text-green-400" : toast.type === "error" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
            }`}
          >
            {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
