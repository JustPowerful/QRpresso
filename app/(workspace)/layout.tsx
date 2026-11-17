import { Suspense, type ReactNode } from "react";

import { WorkspaceContent } from "./_components/workspace-content";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <WorkspaceContent>{children}</WorkspaceContent>
    </Suspense>
  );
}
