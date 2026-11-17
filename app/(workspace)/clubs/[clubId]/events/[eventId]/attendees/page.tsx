import type { Metadata } from "next";
import { EventAttendees } from "@/components/clubs/event-attendees";

export const metadata: Metadata = { title: "Ticket holders | AI Hub" };

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ clubId: string; eventId: string }>;
}) {
  const { clubId, eventId } = await params;
  return <EventAttendees clubId={clubId} eventId={eventId} />;
}
