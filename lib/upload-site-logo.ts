import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "site");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (converted to WebP on save)
const ALLOWED_MIMES = ["image/jpeg", "image/png"] as const;

const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_HEADER);
}

function isPng(buffer: Buffer): boolean {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_HEADER);
}

function isValidImageBuffer(buffer: Buffer): boolean {
  return isJpeg(buffer) || isPng(buffer);
}

export type UploadResult = { url: string } | { error: string };

export async function processSiteLogo(
  buffer: Buffer,
  mimeType: string | null
): Promise<UploadResult> {
  if (buffer.length > MAX_SIZE_BYTES) {
    return { error: "File too large. Maximum size is 10MB." };
  }

  if (!mimeType || !ALLOWED_MIMES.includes(mimeType as (typeof ALLOWED_MIMES)[number])) {
    return { error: "Only JPG and PNG images are allowed." };
  }

  if (!isValidImageBuffer(buffer)) {
    return { error: "Invalid image file. File may be corrupted or not a valid JPG/PNG." };
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create upload dir:", e);
    return { error: "Failed to save image." };
  }

  const filename = `${randomUUID()}.webp`;
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath);
  } catch (e) {
    console.error("Sharp conversion error:", e);
    return { error: "Failed to process image." };
  }

  return { url: `/uploads/site/${filename}` };
}
