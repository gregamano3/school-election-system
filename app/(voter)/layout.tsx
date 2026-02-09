import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function VoterLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f8] dark:bg-[#101822]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-3 dark:border-[#2d3748] dark:bg-[#1a202c] md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 text-[#136dec]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#136dec] text-white">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[#111418] dark:text-white">
              VoteSchool
            </h2>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-semibold text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Dashboard
            </Link>
            <Link href="/candidates" className="text-sm font-semibold text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Candidates
            </Link>
            <Link href="/positions" className="text-sm font-semibold text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Positions
            </Link>
            <Link href="/vote" className="text-sm font-semibold text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Vote
            </Link>
            <Link href="/results" className="text-sm font-semibold text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Results
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-[#64748b] dark:text-[#a0aec0]">
            {session.user?.name ?? (session.user as { studentId?: string })?.studentId}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit" className="text-sm font-medium text-[#64748b] hover:text-[#136dec] dark:text-[#a0aec0] dark:hover:text-[#136dec]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
