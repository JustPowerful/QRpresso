"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

type ImageTarget = "club-profile" | "club-cover" | "event-thumbnail";

export function ImageUploadButton({
  target,
  resourceId,
  label,
  variant = "outline",
}: {
  target: ImageTarget;
  resourceId: string;
  label: string;
  variant?: "outline" | "secondary";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.set("target", target);
    formData.set("resourceId", resourceId);
    formData.set("file", file);
    try {
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Image upload failed.");
      await queryClient.invalidateQueries();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        aria-label={label}
        onChange={handleChange}
      />
      <Button type="button" variant={variant} size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <ImagePlus aria-hidden="true" /> {busy ? "Uploading…" : label}
      </Button>
      {error && <span role="alert" className="max-w-56 text-xs text-destructive">{error}</span>}
    </span>
  );
}
