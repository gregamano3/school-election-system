import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { getSiteSettings } from "@/lib/site-settings";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    const role = (session.user as { role?: string })?.role;
    redirect(role === "admin" ? "/admin" : "/dashboard");
  }
  const { schoolName, logoUrl } = await getSiteSettings();
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[#f6f7f8] p-4 dark:bg-[#101822]">
      <div className="layout-content-container flex w-full max-w-[480px] flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center text-[#136dec]">
            {logoUrl ? (
              <img
                src="/api/site-logo"
                alt=""
                width={160}
                height={160}
                className="h-24 w-auto max-h-40 object-contain sm:h-32 sm:max-h-48"
              />
            ) : (
              <span className="material-symbols-outlined text-6xl">how_to_reg</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-white">
              {schoolName || "School Election"}
            </h1>
            <p className="text-sm font-medium text-[#617289] dark:text-gray-400">
              Student Government Elections
            </p>
          </div>
        </div>
        <LoginForm />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs font-medium uppercase tracking-widest text-[#617289] dark:text-gray-500">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Secure connection
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
