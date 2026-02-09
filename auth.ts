import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        studentId: { label: "ID Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.studentId || !credentials?.password) return null;
          const studentId = String(credentials.studentId).trim();
          const password = String(credentials.password);
          const [user] = await db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
          if (!user) return null;
          const valid = await compare(password, user.passwordHash);
          if (!valid) return null;
          // RBAC: role comes only from DB, never from client
          return {
            id: String(user.id),
            email: user.email ?? undefined,
            name: user.name ?? user.studentId,
            image: null,
            role: user.role,
            studentId: user.studentId,
            passwordChanged: user.passwordChanged ?? 0,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.studentId = (user as { studentId?: string }).studentId;
        token.passwordChanged = (user as { passwordChanged?: number }).passwordChanged ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { studentId?: string }).studentId = token.studentId as string;
        (session.user as { passwordChanged?: number }).passwordChanged = (token.passwordChanged as number) ?? 0;
      }
      return session;
    },
    authorized({ request, auth: session }) {
      const { pathname } = request.nextUrl;
      const publicPaths = ["/login", "/results"];
      const apiPublicPrefixes = ["/api/auth", "/api/elections", "/api/positions", "/api/candidates", "/api/parties", "/api/results", "/api/results-sse", "/api/site-logo", "/api/favicon"];
      if (pathname.startsWith("/api/")) {
        if (apiPublicPrefixes.some((p) => pathname.startsWith(p))) return true;
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (pathname.startsWith("/api/admin/") && (session.user as { role?: string })?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }
      if (publicPaths.includes(pathname) || pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
      if (!session) return NextResponse.redirect(new URL("/login", request.url));
      if (pathname.startsWith("/admin") && (session.user as { role?: string })?.role !== "admin") return NextResponse.redirect(new URL("/election-code", request.url));
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: typeof process.env.SESSION_MAX_AGE_SECONDS !== "undefined"
      ? parseInt(process.env.SESSION_MAX_AGE_SECONDS, 10) || 7200
      : 7200,
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

declare module "next-auth" {
  interface User {
    role?: string;
    studentId?: string;
    passwordChanged?: number;
  }
  interface Session {
    user: User & { id?: string; role?: string; studentId?: string; passwordChanged?: number };
  }
}
