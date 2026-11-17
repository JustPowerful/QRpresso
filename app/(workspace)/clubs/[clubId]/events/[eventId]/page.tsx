import type { Metadata } from "next";
import { EventDetail } from "@/components/clubs/event-detail";

export const metadata: Metadata = { title: "Event | AI Hub" };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ clubId: string; eventId: string }>;
}) {
  const { clubId, eventId } = await params;
  return <EventDetail eventId={eventId} clubId={clubId} />;
}
