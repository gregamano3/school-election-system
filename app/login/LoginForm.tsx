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
      
      // NextAuth v5 returns { error: string | undefined, ok: boolean, status: number, url: string | null }
      // Debug logging (remove in production if needed)
      if (process.env.NODE_ENV === "development") {
        console.log("Login response:", { ok: res?.ok, error: res?.error, status: res?.status });
      }
      
      // Check for error first - NextAuth can return ok: true with an error field
      // This handles cases like {ok: true, error: 'CredentialsSignin'}
      if (res?.error) {
        setLoading(false);
        setError("Invalid ID or password.");
        return;
      }
      
      // Check ok property - if it's not explicitly true, authentication failed
      if (!res || res.ok !== true) {
        setLoading(false);
        setError("Invalid ID or password.");
        return;
      }
      
      // If we get here, ok is true and no error, login was successful
      // Redirect to home; middleware will send admin → /admin, others → /election-code
      setLoading(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#dbe0e6] bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-label="Login form">
        <div className="flex flex-col gap-2">
          <label htmlFor="student-id" className="text-sm font-semibold text-[#111418] dark:text-gray-200">
            ID Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" aria-hidden="true">
              badge
            </span>
            <input
              id="student-id"
              className="block w-full rounded-lg border border-[#dbe0e6] bg-white py-3 pl-11 pr-4 text-base placeholder:text-gray-400 focus:border-[#136dec] focus:ring-[#136dec] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Enter your ID"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              autoComplete="username"
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-[#111418] dark:text-gray-200">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" aria-hidden="true">
              lock
            </span>
            <input
              id="password"
              className="block w-full rounded-lg border border-[#dbe0e6] bg-white py-3 pl-11 pr-4 text-base placeholder:text-gray-400 focus:border-[#136dec] focus:ring-[#136dec] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
        </div>
        {error && (
          <p id="login-error" className="text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#136dec] px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#136dec]/90 focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:ring-offset-2 disabled:opacity-50"
          aria-busy={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
