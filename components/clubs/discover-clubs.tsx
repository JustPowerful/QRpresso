"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClubCard } from "@/components/clubs/club-card";
import { useTRPC } from "@/trpc/client";

export function DiscoverClubs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const clubs = useQuery(
    trpc.club.paginateClubs.queryOptions({ page, limit: 30, query: search }),
  );
  const joinedClubs = useQuery(trpc.club.joinedClubs.queryOptions());
  const joinedIds = new Set(joinedClubs.data?.map((club) => club.id) ?? []);
  const joinClub = useMutation(
    trpc.club.join.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your community starts here</p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">Discover clubs</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Find a group that shares your interests, or create a new space for your community.</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search clubs…"
            aria-label="Search clubs"
            className="pl-10"
          />
        </div>
      </div>

      {joinClub.error && <p role="alert" className="mb-5 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{joinClub.error.message}</p>}

      {clubs.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading clubs">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl border bg-muted/40" />)}
        </div>
      ) : clubs.isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="font-medium">We couldn’t load clubs right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : clubs.data.clubs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Search size={20} /></div>
          <h2 className="text-lg font-semibold">No clubs found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another search, or start one of your own.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">{clubs.data.total} {clubs.data.total === 1 ? "club" : "clubs"}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.data.clubs.map((club) => {
              const isJoined = joinedIds.has(club.id);
              return (
                <ClubCard
                  key={club.id}
                  club={club}
                  subtitle="Community"
                  footer={
                    <Button
                      type="button"
                      variant={isJoined ? "outline" : "default"}
                      size="sm"
                      disabled={isJoined || joinClub.isPending || joinedClubs.isPending}
                      onClick={() => joinClub.mutate({ clubId: club.id })}
                    >
                      {isJoined ? "Joined" : joinClub.isPending ? "Joining…" : "Join club"}
                    </Button>
                  }
                />
              );
            })}
          </div>
          {clubs.data.totalPages > 1 && (
            <nav aria-label="Club result pages" className="mt-7 flex items-center justify-center gap-4">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {clubs.data.page} of {clubs.data.totalPages}</span>
              <Button type="button" variant="outline" size="sm" disabled={page >= clubs.data.totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
