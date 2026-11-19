"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  ScanLine,
  Tickets,
  UsersRound,
} from "lucide-react";
import { EventManagementActions } from "@/components/clubs/event-management-actions";
import { EventTicketAction } from "@/components/clubs/event-ticket-action";
import { ImageUploadButton } from "@/components/clubs/image-upload-button";
import { useTRPC } from "@/trpc/client";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function EventDetail({
  eventId,
  clubId,
}: {
  eventId: string;
  clubId: string;
}) {
  const trpc = useTRPC();
  const eventQuery = useQuery(
    trpc.event.getById.queryOptions({ eventId, clubId }),
  );

  if (eventQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="h-[28rem] animate-pulse rounded-2xl border bg-muted/40" />
      </main>
    );
  }

  if (eventQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <Link
          href="/clubs"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to clubs
        </Link>
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="font-semibold">Event unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {eventQuery.error.message}
          </p>
        </div>
      </main>
    );
  }

  const event = eventQuery.data;
  const canManage = event.isFounder || event.isManager;
  const canChangeImage = event.isFounder || event.isMember;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/clubs/${event.club.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to {event.club.name}
      </Link>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative h-56 bg-gradient-to-br from-primary/70 via-primary/30 to-secondary sm:h-80">
          {event.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.thumbnail}
              alt=""
              className="size-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 sm:bottom-6 sm:left-6">
            <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {event.eventType === "PAID"
                ? `Paid · ${event.price.toFixed(2)}`
                : "Free event"}
            </span>
            <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {event.isUpcoming ? "Upcoming" : "Started"}
            </span>
          </div>
          {canChangeImage && (
            <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
              <ImageUploadButton
                target="event-thumbnail"
                resourceId={event.id}
                label="Change image"
                variant="secondary"
              />
            </div>
          )}
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {event.club.name}
            </p>
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-5xl">
                {event.name}
              </h1>

              {canManage && (
                <EventManagementActions event={event} clubId={event.club.id} />
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} aria-hidden="true" />
                {formatDate(event.date)}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} aria-hidden="true" />
                  {event.location}
                </span>
              )}
            </div>
            {event.description ? (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-sm font-semibold">About this event</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {event.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Attendance
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {event.attendeeCount}
                  {event.attendeeLimit === null ? (
                    ""
                  ) : (
                    <span className="text-base text-muted-foreground">
                      {" "}
                      / {event.attendeeLimit}
                    </span>
                  )}
                </p>
              </div>
              <UsersRound
                className="mt-1 text-muted-foreground"
                aria-hidden="true"
              />
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
          </aside>
        </div>
        {canManage && (
          <div className="flex justify-between gap-3 border-t p-5 sm:p-8">
            <div className="flex flex-wrap gap-3">
              {event.eventType === "PAID" && (
                <Link
                  href={`/clubs/${event.club.id}/events/${event.id}/requests`}
                  className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Manage ticket requests
                </Link>
              )}
              <Link
                href={`/clubs/${event.club.id}/events/${event.id}/attendees`}
                className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent gap-2"
              >
                <Tickets /> View ticket holders
              </Link>
              <Link
                href={`/clubs/${event.club.id}/events/${event.id}/check-in`}
                className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent gap-2"
              >
                <ScanLine /> Open check-in scanner
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
