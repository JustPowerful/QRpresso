import type { Metadata } from "next";
import { TicketScanner } from "@/components/clubs/ticket-scanner";

export const metadata: Metadata = { title: "Ticket check-in | AI Hub" };

export default async function TicketCheckInPage({
  params,
}: {
  params: Promise<{ clubId: string; eventId: string }>;
}) {
  const { clubId, eventId } = await params;
  return <TicketScanner clubId={clubId} eventId={eventId} />;
}
