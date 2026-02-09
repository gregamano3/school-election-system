"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        studentId: studentId.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid ID or password.");
        setLoading(false);
        return;
      }
      // Redirect to home; middleware will send admin → /admin, others → /dashboard
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#111418] dark:text-gray-200">
            ID Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
              badge
            </span>
            <input
              className="block w-full rounded-lg border border-[#dbe0e6] bg-white py-3 pl-11 pr-4 text-base placeholder:text-gray-400 focus:border-[#136dec] focus:ring-[#136dec] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Enter your ID"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#111418] dark:text-gray-200">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
              lock
            </span>
            <input
              className="block w-full rounded-lg border border-[#dbe0e6] bg-white py-3 pl-11 pr-4 text-base placeholder:text-gray-400 focus:border-[#136dec] focus:ring-[#136dec] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#136dec] px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#136dec]/90 focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
