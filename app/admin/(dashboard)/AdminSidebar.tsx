"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/elections", label: "Elections", icon: "how_to_vote" },
  { href: "/admin/voters", label: "Voters", icon: "people" },
  { href: "/admin/audit", label: "Audit Log", icon: "history" },
  { href: "/admin/votes", label: "Votes", icon: "ballot" },
  { href: "/results", label: "Results", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminSidebar({ logoUrl }: { logoUrl: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-[#dbe0e6] bg-white dark:border-[#2d394a] dark:bg-[#1a2433]">
      <div className="flex h-16 items-center gap-3 border-b border-[#dbe0e6] px-4 dark:border-[#2d394a]">
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
        <span className="min-w-0 truncate text-sm font-bold tracking-tight text-[#111418] dark:text-white">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[#136dec]/10 text-[#136dec] dark:bg-[#136dec]/20"
                  : "text-[#617289] hover:bg-[#f0f2f4] hover:text-[#136dec] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a] dark:hover:text-[#136dec]"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
