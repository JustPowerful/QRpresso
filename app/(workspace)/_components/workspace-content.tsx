// A wrapper for caching

import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserNavbar } from "@/components/clubs/user-navbar";
import { auth } from "@/lib/auth";

export async function WorkspaceContent({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <UserNavbar userName={session.user.name} userEmail={session.user.email} />
      {children}
    </>
  );
}
