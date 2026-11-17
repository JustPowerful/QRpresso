"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  cancelled: "Canceled",
  rejected: "Rejected",
};

export function TicketRequests({ clubId, eventId }: { clubId: string; eventId: string }) {
  const [search, setSearch] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const requests = useQuery(trpc.ticket.requests.queryOptions({ eventId, query: search }));
  const refresh = () => queryClient.invalidateQueries();
  const markPaid = useMutation(trpc.ticket.markPaid.mutationOptions({ onSuccess: refresh, onError: refresh }));
  const cancelRequest = useMutation(trpc.ticket.cancelRequest.mutationOptions({ onSuccess: refresh }));
  const error = markPaid.error ?? cancelRequest.error;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={`/clubs/${clubId}/events/${eventId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} aria-hidden="true" /> Back to event</Link>
      {requests.isPending ? (
        <div className="h-56 animate-pulse rounded-xl border bg-muted/40" aria-label="Loading ticket requests" />
      ) : requests.isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="font-semibold">Ticket requests unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{requests.error.message}</p>
        </div>
      ) : (
        <>
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Event management</p>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">{requests.data.event.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Review requests and grant tickets after receiving payment.</p>
              <p className="mt-1 text-sm font-medium">Ticket price: {requests.data.event.price.toFixed(2)}</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email…" aria-label="Search ticket requests by user name or email" className="pl-10" />
            </div>
          </div>

          {error && <p role="alert" className="mb-5 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error.message}</p>}

          {requests.data.requests.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
              <h2 className="font-semibold">No ticket requests found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Requests will appear here when attendees ask for a ticket.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <ul className="divide-y">
                {requests.data.requests.map((request) => {
                  const isActive = request.status === "pending" || request.status === "approved";
                  return (
                    <li key={request.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{request.user.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{request.user.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Requested {new Date(request.requestedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <span className="w-fit rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{statusLabels[request.status] ?? request.status}</span>
                        {isActive && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={markPaid.isPending || cancelRequest.isPending || requests.data.event.price <= 0}
                              onClick={() => {
                                markPaid.reset();
                                markPaid.mutate({ requestId: request.id });
                              }}
                            >
                              {markPaid.isPending ? "Granting…" : "Mark paid & grant ticket"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={markPaid.isPending || cancelRequest.isPending}
                              onClick={() => {
                                cancelRequest.reset();
                                cancelRequest.mutate({ requestId: request.id });
                              }}
                            >
                              {cancelRequest.isPending ? "Canceling…" : "Cancel request"}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
