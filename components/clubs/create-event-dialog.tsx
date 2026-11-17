"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
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

export function CreateEventDialog({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [eventType, setEventType] = useState<"FREE" | "PAID">("FREE");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createEvent = useMutation(
    trpc.event.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        setOpen(false);
        setError("");
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const attendeeLimit = String(values.get("attendeeLimit") ?? "");
    createEvent.mutate({
      clubId,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus aria-hidden="true" /> Create event
      </Button>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Create an event</DialogTitle>
                <DialogDescription>Share the details so members know when and where to meet.</DialogDescription>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close dialog" onClick={() => setOpen(false)}>
                <X aria-hidden="true" />
              </Button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="event-name" className="text-sm font-medium">Event name</label>
                <Input id="event-name" name="name" placeholder="e.g. Monthly meetup" minLength={2} maxLength={120} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="event-date" className="text-sm font-medium">Date and time</label>
                  <Input id="event-date" name="date" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="event-location" className="text-sm font-medium">Location <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <Input id="event-location" name="location" placeholder="Online or a venue" maxLength={200} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="event-type" className="text-sm font-medium">Event type</label>
                  <select id="event-type" name="eventType" value={eventType} onChange={(event) => setEventType(event.target.value as "FREE" | "PAID")} className="h-11 w-full rounded-md border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/20">
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                {eventType === "PAID" && (
                  <div className="space-y-2">
                    <label htmlFor="event-price" className="text-sm font-medium">Ticket price</label>
                    <Input id="event-price" name="price" type="number" min="0.01" max="10000000" step="0.01" inputMode="decimal" placeholder="25.00" required />
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="attendee-limit" className="text-sm font-medium">Attendee limit <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <Input id="attendee-limit" name="attendeeLimit" type="number" min={1} max={100000} placeholder="No limit" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="event-description" className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                <textarea id="event-description" name="description" rows={3} maxLength={2000} placeholder="What should members know?" className="w-full resize-y rounded-md border border-input bg-background px-3.5 py-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createEvent.isPending}>{createEvent.isPending ? "Creating…" : "Create event"}</Button>
              </div>
            </form>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}
