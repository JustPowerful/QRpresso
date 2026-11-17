"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CreateEventDialog } from "@/components/clubs/create-event-dialog";
import { EventTicketAction } from "@/components/clubs/event-ticket-action";
import { EventManagementActions } from "@/components/clubs/event-management-actions";
import { useTRPC } from "@/trpc/client";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ClubDetail({ clubId }: { clubId: string }) {
  const trpc = useTRPC();
  const clubQuery = useQuery(trpc.club.getClubById.queryOptions({ clubId }));

  if (clubQuery.isPending) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"><div className="h-64 animate-pulse rounded-xl border bg-muted/40" /></main>;
  }

  if (clubQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <Link href="/clubs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to clubs</Link>
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">Club unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{clubQuery.error.message}</p>
        </div>
      </main>
    );
  }

  const club = clubQuery.data;
  const canManageEvents = club.isFounder || club.isManager;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/clubs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={16} aria-hidden="true" /> Back to clubs</Link>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="relative h-36 bg-secondary sm:h-48">
          {club.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.coverImage} alt="" className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="-mt-12 flex min-w-0 items-end gap-4">
            {club.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={club.profileImage} alt="" className="size-20 shrink-0 rounded-xl border-4 border-card bg-card object-cover" />
            ) : (
              <div className="grid size-20 shrink-0 place-items-center rounded-xl border-4 border-card bg-primary text-primary-foreground"><UsersRound size={28} aria-hidden="true" /></div>
            )}
            <div className="min-w-0 pb-1">
              <h1 className="truncate font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">{club.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Created {new Date(club.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {canManageEvents && <CreateEventDialog clubId={club.id} />}
        </div>
        {club.description && <p className="max-w-3xl px-5 pb-6 text-sm leading-6 text-muted-foreground sm:px-7">{club.description}</p>}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upcoming events</h2>
            <p className="mt-1 text-sm text-muted-foreground">See what’s happening in {club.name}.</p>
          </div>
          {canManageEvents && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{club.isFounder ? "Founder" : "Manager"}</span>}
        </div>
        {club.events.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><CalendarDays size={20} aria-hidden="true" /></div>
            <h3 className="font-semibold">No events yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">{canManageEvents ? "Create the first event for this club." : "Check back later for upcoming events."}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {club.events.map((event) => (
              <article key={event.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays size={15} aria-hidden="true" /> {formatDate(event.date)}</div>
                <h3 className="text-lg font-semibold">{event.name}</h3>
                {event.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{event.description}</p>}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {event.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{event.location}</span>}
                  <span>{event.eventType === "PAID" ? `Paid · ${event.price.toFixed(2)}` : "Free"}</span>
                </div>
                <EventTicketAction
                  eventId={event.id}
                  eventType={event.eventType}
                  price={event.price}
                  attendeeCount={event.attendeeCount}
                  attendeeLimit={event.attendeeLimit}
                  viewerTicketId={event.viewerTicketId}
                  viewerTicketRequest={event.viewerTicketRequest}
                  date={event.date}
                  isUpcoming={event.isUpcoming}
                />
                {canManageEvents && (
                  <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
                    <EventManagementActions event={event} />
                    {event.eventType === "PAID" && (
                      <Link href={`/clubs/${club.id}/events/${event.id}/requests`} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                        Manage ticket requests
                      </Link>
                    )}
                    <Link href={`/clubs/${club.id}/events/${event.id}/attendees`} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                      View ticket holders
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
