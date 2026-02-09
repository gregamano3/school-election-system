"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-lg p-2 text-[#617289] transition hover:bg-[#f0f2f4] hover:text-[#111418] dark:text-gray-400 dark:hover:bg-[#2d394a] dark:hover:text-white"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? (
        <span className="material-symbols-outlined text-xl" aria-hidden="true">light_mode</span>
      ) : (
        <span className="material-symbols-outlined text-xl" aria-hidden="true">dark_mode</span>
      )}
    </button>
  );
}
