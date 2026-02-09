"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/elections", label: "Elections", icon: "how_to_vote" },
  { href: "/admin/voters", label: "Voters", icon: "people" },
  { href: "/admin/groups", label: "Groups", icon: "group" },
  { href: "/admin/audit", label: "Audit Log", icon: "history" },
  { href: "/results", label: "Results", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function MobileMenu({ logoUrl }: { logoUrl: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[#617289] hover:bg-[#f0f2f4] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a] lg:hidden"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-2xl">menu</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl dark:bg-[#1a2433] lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-[#dbe0e6] px-4 dark:border-[#2d394a]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden text-white">
                  {logoUrl ? (
                    <img
                      src="/api/site-logo"
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-auto max-w-full object-contain"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-[#136dec]">how_to_vote</span>
                  )}
                </div>
                <span className="text-sm font-bold tracking-tight text-[#111418] dark:text-white">
                  Admin
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#617289] hover:bg-[#f0f2f4] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a]"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#136dec]/10 text-[#136dec] dark:bg-[#136dec]/20"
                        : "text-[#617289] hover:bg-[#f0f2f4] hover:text-[#136dec] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a] dark:hover:text-[#136dec]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
