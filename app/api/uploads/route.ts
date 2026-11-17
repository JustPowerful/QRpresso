import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMinioObject, putMinioObject } from "@/lib/minio";

const maxFileSize = 5 * 1024 * 1024;
const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type ImageType = (typeof imageTypes)[number];
type ImageTarget = "club-profile" | "club-cover" | "event-thumbnail";

function identifyImage(bytes: Buffer): { type: ImageType; extension: string } | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { type: "image/png", extension: "png" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { type: "image/jpeg", extension: "jpg" };
  }
  if (bytes.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/)) {
    return { type: "image/gif", extension: "gif" };
  }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return { type: "image/webp", extension: "webp" };
  }
  return null;
}

function oldObjectKey(url: string | null) {
  const prefix = "/api/media/";
  if (!url?.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return /^(club-profile|club-cover|event-thumbnail)\/[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(png|jpg|webp|gif)$/.test(key)
    ? key
    : null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(request.url).origin !== origin) {
    return NextResponse.json({ error: "Uploads must come from this application." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxFileSize + 100_000) {
    return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 413 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to upload an image." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const target = formData.get("target");
  const resourceId = formData.get("resourceId");
  const file = formData.get("file");
  if (
    (target !== "club-profile" && target !== "club-cover" && target !== "event-thumbnail") ||
    typeof resourceId !== "string" ||
    !resourceId ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "Invalid image upload." }, { status: 400 });
  }
  if (!imageTypes.includes(file.type as ImageType) || file.size === 0 || file.size > maxFileSize) {
    return NextResponse.json({ error: "Use a PNG, JPEG, WebP, or GIF image up to 5 MB." }, { status: 400 });
  }

  let objectPrefix: ImageTarget;
  let previousUrl: string | null;
  if (target === "event-thumbnail") {
    const event = await db.event.findUnique({
      where: { id: resourceId },
      select: { id: true, clubId: true, thumbnail: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    const membership = await db.membership.findFirst({
      where: {
        clubId: event.clubId,
        userId: session.user.id,
        role: { in: ["FOUNDER", "MEMBER"] },
      },
      select: { id: true },
    });
    if (!membership) return NextResponse.json({ error: "Only club founders and members can change images." }, { status: 403 });
    objectPrefix = target;
    previousUrl = event.thumbnail;
  } else {
    const club = await db.club.findUnique({
      where: { id: resourceId },
      select: { id: true, profileImage: true, coverImage: true },
    });
    if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });
    const membership = await db.membership.findFirst({
      where: {
        clubId: club.id,
        userId: session.user.id,
        role: { in: ["FOUNDER", "MEMBER"] },
      },
      select: { id: true },
    });
    if (!membership) return NextResponse.json({ error: "Only club founders and members can change images." }, { status: 403 });
    objectPrefix = target;
    previousUrl = target === "club-profile" ? club.profileImage : club.coverImage;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedImage = identifyImage(bytes);
  if (!detectedImage || file.type !== detectedImage.type) {
    return NextResponse.json({ error: "The selected file is not a supported image." }, { status: 400 });
  }

  const key = `${objectPrefix}/${resourceId}/${randomUUID()}.${detectedImage.extension}`;
  try {
    await putMinioObject(key, bytes, detectedImage.type);
    const imageUrl = `/api/media/${key}`;

    if (target === "event-thumbnail") {
      await db.event.update({ where: { id: resourceId }, data: { thumbnail: imageUrl } });
    } else {
      await db.club.update({
        where: { id: resourceId },
        data: target === "club-profile" ? { profileImage: imageUrl } : { coverImage: imageUrl },
      });
    }

    const oldKey = oldObjectKey(previousUrl);
    if (oldKey) await deleteMinioObject(oldKey).catch(() => undefined);
    return NextResponse.json({ url: imageUrl });
  } catch {
    return NextResponse.json({ error: "Image upload failed. Check the MinIO service configuration." }, { status: 502 });
  }
}
