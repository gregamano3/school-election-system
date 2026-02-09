import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // RBAC: redirect logged-in users to the right area by role
  if (session) {
    const role = (session.user as { role?: string })?.role;
    if (pathname === "/login") {
      return Response.redirect(new URL(role === "admin" ? "/admin" : "/election-code", req.url));
    }
    if (pathname === "/") {
      return Response.redirect(new URL(role === "admin" ? "/admin" : "/election-code", req.url));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|.*\\.(?:svg|png|ico|webp|jpg|jpeg)$).*)"],
};
