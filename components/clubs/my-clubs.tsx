"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, UsersRound } from "lucide-react";
import { useTRPC } from "@/trpc/client";

export function MyClubs() {
  const trpc = useTRPC();
  const clubs = useQuery(trpc.club.joinedClubs.queryOptions());

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-9">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your communities</p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">My clubs</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">The clubs you’ve created and joined, all in one place.</p>
      </div>

      {clubs.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading your clubs">
          {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl border bg-muted/40" />)}
        </div>
      ) : clubs.isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="font-medium">We couldn’t load your clubs right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : clubs.data.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><UsersRound size={20} /></div>
          <h2 className="text-lg font-semibold">You haven’t joined a club yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Explore clubs and find your people.</p>
          <Link href="/clubs" className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-none bg-primary px-5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/80">
            Discover clubs <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.data.map((club) => (
            <article key={club.id} className="flex min-h-48 flex-col rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                {club.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.profileImage} alt="" className="size-11 rounded-lg border object-cover" />
                ) : (
                  <div className="grid size-11 place-items-center rounded-lg bg-secondary text-secondary-foreground"><UsersRound size={19} aria-hidden="true" /></div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{club.name}</h2>
                  <p className="text-xs text-muted-foreground">Member</p>
                </div>
              </div>
              <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                {club.description || "A community for people who want to connect and share ideas."}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
