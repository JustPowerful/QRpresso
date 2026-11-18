"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Compass, LogOut, UserRound, UsersRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CreateClubDialog } from "@/components/clubs/create-club-dialog";
import logo from "@/assets/images/black_qrpresso.png";

type UserNavbarProps = { userName: string; userEmail: string };

export function UserNavbar({ userName, userEmail }: UserNavbarProps) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isDiscoverActive = pathname.startsWith("/clubs");
  const isMyClubsActive = pathname.startsWith("/my-clubs");

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const navLinkClass = (active: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
      active
        ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
        : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 shadow-[0_4px_18px_-16px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.25rem] items-center justify-between gap-3 sm:h-[4.75rem]">
          <Link
            href="/clubs"
            aria-label="QRpresso home"
            className="group flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image src={logo} alt="" width={34} height={34} priority />
            <span className="text-[15px] font-semibold tracking-tight sm:text-base">
              QRpresso
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden flex-1 justify-center sm:flex"
          >
            <div className="flex items-center gap-1 rounded-full bg-muted/75 p-1">
              <Link
                href="/clubs"
                aria-current={isDiscoverActive ? "page" : undefined}
                className={navLinkClass(isDiscoverActive)}
              >
                <Compass size={16} aria-hidden="true" />
                Discover
              </Link>
              <Link
                href="/my-clubs"
                aria-current={isMyClubsActive ? "page" : undefined}
                className={navLinkClass(isMyClubsActive)}
              >
                <UsersRound size={16} aria-hidden="true" />
                My clubs
              </Link>
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <CreateClubDialog />
            <span
              className="hidden h-8 w-px bg-border sm:block"
              aria-hidden="true"
            />
            <div
              className="flex min-w-0 items-center gap-2"
              title={`${userName} · ${userEmail}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground ring-1 ring-border/70 sm:size-10">
                <UserRound size={17} aria-hidden="true" />
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium md:block lg:max-w-40">
                {userName}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              disabled={signingOut}
              aria-label={signingOut ? "Signing out" : "Log out"}
              title={signingOut ? "Signing out" : "Log out"}
              className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-10"
            >
              <LogOut size={17} aria-hidden="true" />
            </Button>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="-mx-4 flex h-12 items-stretch border-t border-border/60 px-4 sm:hidden"
        >
          <div className="flex w-full items-stretch">
            <Link
              href="/clubs"
              aria-current={isDiscoverActive ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${isDiscoverActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Compass size={16} aria-hidden="true" />
              Discover
            </Link>
            <Link
              href="/my-clubs"
              aria-current={isMyClubsActive ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${isMyClubsActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <UsersRound size={16} aria-hidden="true" />
              My clubs
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
