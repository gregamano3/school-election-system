import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processCandidatePhoto } from "@/lib/upload-candidate-photo";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const mimeType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await processCandidatePhoto(buffer, mimeType);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: { url: result.url } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
