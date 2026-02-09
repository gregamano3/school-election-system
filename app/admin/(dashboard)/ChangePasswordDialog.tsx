"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function ChangePasswordDialog({ userId }: { userId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOpen(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change password");
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
      showToast("Password changed successfully", "success");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#dbe0e6] bg-white p-6 shadow-lg dark:border-[#2d394a] dark:bg-[#1a2433]">
        <h2 className="mb-4 text-xl font-bold text-[#111418] dark:text-white">
          Change Password
        </h2>
        <p className="mb-6 text-sm text-[#617289] dark:text-[#a1b0c3]">
          You are using a default password. Please change it now for security.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#111418] dark:text-gray-200">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#111418] dark:text-gray-200">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#111418] dark:text-gray-200">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#136dec]/90 disabled:opacity-50"
            >
              {loading ? "Changing…" : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
