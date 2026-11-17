import { NextResponse } from "next/server";
import { getMinioObject } from "@/lib/minio";

const validKey = /^(club-profile|club-cover|event-thumbnail)\/[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(png|jpg|webp|gif)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: pathSegments } = await params;
  const key = pathSegments.join("/");
  if (!validKey.test(key)) return new NextResponse("Not found", { status: 404 });

  try {
    const image = await getMinioObject(key);
    if (!image.ok || !image.body) return new NextResponse("Not found", { status: 404 });
    return new Response(image.body, {
      headers: {
        "Content-Type": image.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Image unavailable", { status: 502 });
  }
}
