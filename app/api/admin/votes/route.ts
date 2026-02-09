import { NextResponse } from "next/server";

export async function GET() {
  // Individual vote records are not accessible to maintain voter privacy and prevent coercion
  // Admins can view aggregated results on the Results page, but cannot see who voted for whom
  return NextResponse.json({ error: "Individual vote records are not accessible. Use the Results page to view aggregated election results." }, { status: 403 });
}
