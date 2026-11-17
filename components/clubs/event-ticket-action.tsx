"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

type EventTicketActionProps = {
  eventId: string;
  eventType: "FREE" | "PAID";
  price: number;
  attendeeCount: number;
  attendeeLimit: number | null;
  viewerTicketId: string | null;
  viewerTicketRequest: { id: string; status: string } | null;
  date: Date | string;
  isUpcoming: boolean;
};

export function EventTicketAction(props: EventTicketActionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries();
  const rsvp = useMutation(trpc.ticket.rsvp.mutationOptions({ onSuccess: invalidate }));
  const cancelRsvp = useMutation(
    trpc.ticket.cancelRsvp.mutationOptions({ onSuccess: invalidate }),
  );
  const request = useMutation(trpc.ticket.requestPaid.mutationOptions({ onSuccess: invalidate }));
  const error = rsvp.error ?? cancelRsvp.error ?? request.error;
  const isPending = rsvp.isPending || cancelRsvp.isPending || request.isPending;
  const isFull = props.attendeeLimit !== null && props.attendeeCount >= props.attendeeLimit;
  const isPast = !props.isUpcoming;

  let statusLabel: string | null = null;
  if (props.viewerTicketId) {
    statusLabel = props.eventType === "FREE" ? "You’re going" : "Ticket secured";
  } else if (props.eventType === "PAID" && props.viewerTicketRequest?.status === "pending") {
    statusLabel = "Request pending";
  } else if (props.eventType === "PAID" && props.viewerTicketRequest?.status === "approved") {
    statusLabel = "Request approved";
  }

  return (
    <div className="mt-5 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {props.attendeeLimit === null
            ? `${props.attendeeCount} ${props.eventType === "FREE" ? "attending" : "tickets requested or secured"}`
            : `${props.attendeeCount} / ${props.attendeeLimit} ${props.eventType === "FREE" ? "spots" : "spots requested or secured"}`}
        </p>
        {props.eventType === "FREE" && props.viewerTicketId ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">You’re going</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || isPast}
              onClick={() => {
                cancelRsvp.reset();
                cancelRsvp.mutate({ eventId: props.eventId });
              }}
            >
              {isPast ? "Event started" : cancelRsvp.isPending ? "Cancelling…" : "Cancel RSVP"}
            </Button>
          </div>
        ) : statusLabel ? (
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{statusLabel}</span>
        ) : props.eventType === "FREE" ? (
          <Button
            type="button"
            size="sm"
            disabled={isPending || isFull || isPast}
            onClick={() => {
              rsvp.reset();
              rsvp.mutate({ eventId: props.eventId });
            }}
          >
            {isPast ? "Event started" : isFull ? "Full" : isPending ? "Saving…" : "RSVP free"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={isPending || isFull || isPast || props.price <= 0}
            onClick={() => {
              request.reset();
              request.mutate({ eventId: props.eventId });
            }}
          >
            {isPast ? "Event started" : isFull ? "Full" : props.price <= 0 ? "Price not set" : isPending ? "Sending…" : props.viewerTicketRequest?.status === "rejected" ? "Request again" : "Request ticket"}
          </Button>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
