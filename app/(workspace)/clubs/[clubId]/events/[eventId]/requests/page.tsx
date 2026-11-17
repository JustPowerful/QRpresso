import type { Metadata } from "next";
import { TicketRequests } from "@/components/clubs/ticket-requests";

export const metadata: Metadata = { title: "Ticket requests | QRpresso" };

export default async function TicketRequestsPage({
  params,
}: {
  params: Promise<{ clubId: string; eventId: string }>;
}) {
  const { clubId, eventId } = await params;
  return <TicketRequests clubId={clubId} eventId={eventId} />;
}
