// POST /api/uploadImage — receives a base64 data URL image, saves it to /download/meal-images,
export const dynamic = "force-static";

// and returns the public file path. Used by the scanner to persist meal photos.
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = "/home/z/my-project/download/meal-images";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    // Validate it's a data URL
    const match = image.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/);
    if (!match) {
      // If it's already a URL (e.g., Unsplash sample), return it as-is
      if (image.startsWith("http")) {
        return NextResponse.json({ url: image, persisted: false });
      }
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure upload dir exists
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    writeFileSync(filepath, buffer);

    // Return a relative path that Caddy/the app can serve
    const publicUrl = `/download/meal-images/${filename}`;
    return NextResponse.json({ url: publicUrl, persisted: true, filename });
  } catch (e) {
    console.error("[uploadImage] error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
