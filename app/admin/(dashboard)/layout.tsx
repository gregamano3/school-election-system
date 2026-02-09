import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import ThemeToggle from "@/components/ThemeToggle";
import { ToastContainer } from "@/components/Toast";
import { getSiteSettings } from "@/lib/site-settings";
import AdminSidebar from "./AdminSidebar";
import ChangePasswordDialog from "./ChangePasswordDialog";

export default async function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string })?.role !== "admin") redirect("/election-code");
  const { logoUrl } = await getSiteSettings();
  const userId = session.user?.id ? parseInt(session.user.id, 10) : 0;
  
  // Check passwordChanged directly from database, not from session
  let passwordChanged = 1;
  if (userId > 0) {
    const [user] = await db.select({ passwordChanged: users.passwordChanged }).from(users).where(eq(users.id, userId)).limit(1);
    passwordChanged = user?.passwordChanged ?? 1;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f8] dark:bg-[#101822]">
      <AdminSidebar logoUrl={logoUrl} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-end gap-2 border-b border-[#dbe0e6] bg-white px-4 dark:border-[#2d394a] dark:bg-[#1a2433]">
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="text-sm font-medium text-[#617289] hover:text-[#136dec] dark:text-[#a1b0c3] dark:hover:text-[#136dec]"
            >
              Sign out
            </button>
          </form>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ToastContainer />
      {passwordChanged === 0 && userId > 0 && <ChangePasswordDialog userId={userId} />}
    </div>
  );
}
