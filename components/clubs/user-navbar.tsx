"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CreateClubDialog } from "@/components/clubs/create-club-dialog";

// logo
import logo from "@/assets/images/black_qrpresso.png";
import Image from "next/image";

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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-5">
          <Link
            href="/clubs"
            className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight"
          >
            <Image src={logo} alt="QRpresso" width={35} height={34} />
            <span className="hidden sm:inline">QRpresso</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
            <Link
              href="/clubs"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Discover
            </Link>
            <Link
              href="/my-clubs"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              My clubs
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <CreateClubDialog />
            <div className="flex items-center border-l pl-2 sm:gap-2 sm:pl-3">
              <span
                className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground sm:size-8"
                title={userEmail}
              >
                <UserRound size={17} aria-hidden="true" />
              </span>
              <span className="hidden max-w-32 truncate text-sm font-medium md:block">
                {userName}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={signOut}
              disabled={signingOut}
              aria-label={signingOut ? "Signing out" : "Log out"}
              className="size-9 gap-2 px-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <LogOut aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">
                {signingOut ? "Signing out…" : "Log out"}
              </span>
            </Button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="-mx-4 flex h-11 items-center border-t px-2 sm:hidden">
          <Link
            href="/clubs"
            className="flex h-full flex-1 items-center justify-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Discover
          </Link>
          <Link
            href="/my-clubs"
            className="flex h-full flex-1 items-center justify-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            My clubs
          </Link>
        </nav>
      </div>
    </header>
  );
}
