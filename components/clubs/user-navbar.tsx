"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CreateClubDialog } from "@/components/clubs/create-club-dialog";

type UserNavbarProps = { userName: string; userEmail: string };

export function UserNavbar({ userName, userEmail }: UserNavbarProps) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/clubs" className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">a</span>
            <span>AI Hub</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link href="/clubs" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Discover</Link>
            <Link href="/my-clubs" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">My clubs</Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <CreateClubDialog />
          <div className="hidden items-center gap-2 border-l pl-3 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground" title={userEmail}>
              <UserRound size={17} aria-hidden="true" />
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium md:block">{userName}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={signOut} disabled={signingOut} className="gap-2">
            <LogOut aria-hidden="true" />
            <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Log out"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
