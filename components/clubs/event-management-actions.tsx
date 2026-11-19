"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

type EventDetails = {
  id: string;
  name: string;
  description: string | null;
  date: Date | string;
  location: string | null;
  eventType: "FREE" | "PAID";
  price: number;
  attendeeLimit: number | null;
};

function toLocalDateTime(value: Date | string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventManagementActions({
  event,
  clubId,
}: {
  event: EventDetails;
  clubId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [eventType, setEventType] = useState(event.eventType);
  const [error, setError] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const refresh = () => queryClient.invalidateQueries();

  const updateEvent = useMutation(
    trpc.event.update.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setEditOpen(false);
        setError("");
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );
  const deleteEvent = useMutation(
    trpc.event.delete.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setDeleteOpen(false);
        setError("");
        router.push(`/clubs/${clubId}`);
        router.refresh();
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );

  function handleUpdate(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    const values = new FormData(eventSubmit.currentTarget);
    const attendeeLimit = String(values.get("attendeeLimit") ?? "");
    updateEvent.reset();
    updateEvent.mutate({
      eventId: event.id,
      name: String(values.get("name") ?? "").trim(),
      description: String(values.get("description") ?? "").trim() || undefined,
      date: String(values.get("date") ?? ""),
      location: String(values.get("location") ?? "").trim() || undefined,
      eventType,
      price: eventType === "PAID" ? Number(values.get("price")) : 0,
      attendeeLimit: attendeeLimit ? Number(attendeeLimit) : undefined,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError("");
            setEditOpen(true);
          }}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <DialogTitle>Edit event</DialogTitle>
                  <DialogDescription>
                    Update the event details and ticket price.
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close dialog"
                  onClick={() => setEditOpen(false)}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
              <form className="space-y-4" onSubmit={handleUpdate}>
                <div className="space-y-2">
                  <label
                    htmlFor={`event-name-${event.id}`}
                    className="text-sm font-medium"
                  >
                    Event name
                  </label>
                  <Input
                    id={`event-name-${event.id}`}
                    name="name"
                    defaultValue={event.name}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor={`event-date-${event.id}`}
                      className="text-sm font-medium"
                    >
                      Date and time
                    </label>
                    <Input
                      id={`event-date-${event.id}`}
                      name="date"
                      type="datetime-local"
                      defaultValue={toLocalDateTime(event.date)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`event-location-${event.id}`}
                      className="text-sm font-medium"
                    >
                      Location{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <Input
                      id={`event-location-${event.id}`}
                      name="location"
                      defaultValue={event.location ?? ""}
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor={`event-type-${event.id}`}
                      className="text-sm font-medium"
                    >
                      Event type
                    </label>
                    <select
                      id={`event-type-${event.id}`}
                      value={eventType}
                      onChange={(change) =>
                        setEventType(change.target.value as "FREE" | "PAID")
                      }
                      className="h-11 w-full rounded-md border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                    >
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  {eventType === "PAID" && (
                    <div className="space-y-2">
                      <label
                        htmlFor={`event-price-${event.id}`}
                        className="text-sm font-medium"
                      >
                        Ticket price
                      </label>
                      <Input
                        id={`event-price-${event.id}`}
                        name="price"
                        type="number"
                        min="0.01"
                        max="10000000"
                        step="0.01"
                        defaultValue={event.price > 0 ? event.price : ""}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor={`event-limit-${event.id}`}
                      className="text-sm font-medium"
                    >
                      Attendee limit{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <Input
                      id={`event-limit-${event.id}`}
                      name="attendeeLimit"
                      type="number"
                      min={1}
                      max={100000}
                      defaultValue={event.attendeeLimit ?? ""}
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`event-description-${event.id}`}
                    className="text-sm font-medium"
                  >
                    Description{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id={`event-description-${event.id}`}
                    name="description"
                    rows={3}
                    maxLength={2000}
                    defaultValue={event.description ?? ""}
                    className="w-full resize-y rounded-md border border-input bg-background px-3.5 py-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                </div>
                {(error || updateEvent.error) && (
                  <p role="alert" className="text-sm text-destructive">
                    {error || updateEvent.error?.message}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateEvent.isPending}>
                    {updateEvent.isPending ? "Saving…" : "Update event"}
                  </Button>
                </div>
              </form>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            setError("");
            setDeleteOpen(true);
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup>
              <DialogTitle>Delete “{event.name}”?</DialogTitle>
              <DialogDescription>
                This permanently deletes the event and its ticket requests and
                tickets.
              </DialogDescription>
              {(error || deleteEvent.error) && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {error || deleteEvent.error?.message}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Keep event
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteEvent.isPending}
                  onClick={() => {
                    deleteEvent.reset();
                    deleteEvent.mutate({ eventId: event.id });
                  }}
                >
                  {deleteEvent.isPending ? "Deleting…" : "Delete event"}
                </Button>
              </div>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
