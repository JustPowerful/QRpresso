"use client";

import Link from "next/link";
import { ArrowLeft, Check, QrCode, Ticket } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export function EventAttendees({ clubId, eventId }: { clubId: string; eventId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const attendees = useQuery(trpc.ticket.attendees.queryOptions({ eventId }));
  const checkIn = useMutation(trpc.ticket.checkIn.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={`/clubs/${clubId}/events/${eventId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} aria-hidden="true" /> Back to event</Link>
      {attendees.isPending ? (
        <div className="h-56 animate-pulse rounded-xl border bg-muted/40" aria-label="Loading ticket holders" />
      ) : attendees.isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="font-semibold">Ticket holders unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{attendees.error.message}</p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Event attendance</p>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">{attendees.data.event.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{attendees.data.tickets.length} {attendees.data.tickets.length === 1 ? "ticket holder" : "ticket holders"}</p>
            <Link href={`/clubs/${clubId}/events/${eventId}/check-in`} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"><QrCode size={16} aria-hidden="true" /> Open QR scanner</Link>
          </div>
          {checkIn.error && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{checkIn.error.message}</p>}
          {attendees.data.tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Ticket size={20} aria-hidden="true" /></div>
              <h2 className="font-semibold">No tickets have been granted yet</h2>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <ul className="divide-y">
                {attendees.data.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ticket.user.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{ticket.user.email}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                      <div className="text-left text-sm text-muted-foreground sm:text-right">
                        <p>Ticket amount: {ticket.price.toFixed(2)}</p>
                        <p className="mt-1 text-xs">Granted {new Date(ticket.purchasedAt).toLocaleString()}</p>
                        {ticket.checkedInAt && <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={13} aria-hidden="true" /> Checked in {new Date(ticket.checkedInAt).toLocaleString()}</p>}
                      </div>
                      <Button type="button" size="sm" variant={ticket.checkedInAt ? "secondary" : "default"} disabled={Boolean(ticket.checkedInAt) || checkIn.isPending} onClick={() => { checkIn.reset(); checkIn.mutate({ eventId, ticketId: ticket.id }); }}>
                        {ticket.checkedInAt ? "Checked in" : checkIn.isPending ? "Checking in…" : "Mark checked in"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
