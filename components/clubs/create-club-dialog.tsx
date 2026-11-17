"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
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

export function CreateClubDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const createClub = useMutation(
    trpc.club.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        setOpen(false);
        router.push(`/my-clubs`);
        router.refresh();
        setError("");
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createClub.mutate({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <Plus aria-hidden="true" />
        Create club
      </Button>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Create a club</DialogTitle>
                <DialogDescription>Start a place for your community to meet and grow.</DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="club-name" className="text-sm font-medium">Club name</label>
                <Input id="club-name" name="name" minLength={2} maxLength={100} placeholder="e.g. Design Circle" required autoFocus />
              </div>
              <div className="space-y-2">
                <label htmlFor="club-description" className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                <textarea
                  id="club-description"
                  name="description"
                  rows={4}
                  maxLength={1000}
                  placeholder="What is this club about?"
                  className="w-full resize-y rounded-md border border-input bg-background px-3.5 py-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createClub.isPending}>
                  {createClub.isPending ? "Creating…" : "Create club"}
                </Button>
              </div>
            </form>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}
