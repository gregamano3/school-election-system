import { NextResponse } from "next/server";
import { auth } from "@/auth";

const TEMPLATE_CSV = `student_id,password,name,role
10001,changeme,Student One,voter
10002,changeme,Student Two,voter
10003,changeme,,voter`;

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return new NextResponse(TEMPLATE_CSV, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="voters_template.csv"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
