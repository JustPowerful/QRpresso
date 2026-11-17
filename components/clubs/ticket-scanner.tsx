"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { AlertTriangle, ArrowLeft, CheckCircle2, QrCode, ScanLine } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

type CheckInResult = {
  status: "checked_in" | "already_checked_in" | "not_found" | "wrong_event";
  name?: string;
  checkedInAt?: Date | string;
};

export function TicketScanner({ clubId, eventId }: { clubId: string; eventId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScannedRef = useRef("");
  const eventQuery = useQuery(trpc.event.getById.queryOptions({ eventId, clubId }));
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const checkIn = useMutation(trpc.ticket.checkIn.mutationOptions({
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries();
    },
  }));

  useEffect(() => () => controlsRef.current?.stop(), []);

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  const startScanner = async () => {
    if (!videoRef.current || isStarting || isScanning) return;
    setCameraError(null);
    setResult(null);
    checkIn.reset();
    setIsStarting(true);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (decoded) => {
        if (!decoded) return;
        const scannedText = decoded.getText().trim();
        if (!scannedText || lastScannedRef.current === scannedText) return;
        lastScannedRef.current = scannedText;
        window.setTimeout(() => {
          if (lastScannedRef.current === scannedText) lastScannedRef.current = "";
        }, 2500);
        stopScanner();
        if (!scannedText.startsWith("AIHUB-TICKET:")) {
          setResult({ status: "not_found" });
          return;
        }
        const ticketId = scannedText.slice("AIHUB-TICKET:".length);
        checkIn.mutate({ eventId, ticketId });
      });
      setIsScanning(true);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Could not access the camera. Check browser permissions and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  if (eventQuery.isPending) return <main className="mx-auto max-w-3xl px-4 py-12"><div className="h-80 animate-pulse rounded-2xl border bg-muted/40" /></main>;
  if (eventQuery.isError) return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl border bg-card p-6 text-sm">{eventQuery.error.message}</p></main>;

  const event = eventQuery.data;
  if (!event.isFounder && !event.isManager) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><Link href={`/clubs/${clubId}/events/${eventId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} /> Back to event</Link><p role="alert" className="mt-6 rounded-xl border bg-card p-6">Only club founders and managers can check in tickets.</p></main>;
  }

  const hasWarning = result?.status === "not_found" || result?.status === "wrong_event" || result?.status === "already_checked_in";
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={`/clubs/${clubId}/events/${eventId}/attendees`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} aria-hidden="true" /> Back to ticket holders</Link>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Event check-in</p>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">{event.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scan a ticket QR code to validate it and check in its holder.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} className="size-full object-cover" muted playsInline aria-label="Ticket QR code camera view" />
          {isScanning && <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]"><ScanLine className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white" /></div>}
          {!isScanning && <div className="absolute inset-0 grid place-items-center bg-muted/30 text-muted-foreground"><div className="text-center"><QrCode className="mx-auto mb-3 size-10" /><p className="text-sm">Camera is off</p></div></div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Allow camera access when your browser asks.</p>
          {isScanning ? <Button type="button" variant="outline" onClick={stopScanner}>Stop scanner</Button> : <Button type="button" onClick={startScanner} disabled={isStarting}>{isStarting ? "Starting camera…" : "Start scanner"}</Button>}
        </div>
      </section>

      {cameraError && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{cameraError}</p>}
      {checkIn.error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Could not check in this ticket: {checkIn.error.message}</p>}
      {result && (
        <div role={hasWarning ? "alert" : "status"} className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${hasWarning ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200" : "border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200"}`}>
          {hasWarning ? <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-semibold">{result.status === "checked_in" ? "Ticket checked in" : result.status === "already_checked_in" ? "Ticket was already checked in" : result.status === "wrong_event" ? "Ticket belongs to another event" : "Ticket not found"}</p>
            {result.name && <p className="mt-1 text-sm">{result.name}</p>}
            {(result.status === "not_found" || result.status === "wrong_event") && <p className="mt-1 text-sm">Do not admit the holder. Verify the ticket with the event organizer.</p>}
            {result.status === "already_checked_in" && result.checkedInAt && <p className="mt-1 text-sm">Recorded {new Date(result.checkedInAt).toLocaleString()}</p>}
          </div>
        </div>
      )}
      <div className="mt-5 text-center"><Link href={`/clubs/${clubId}/events/${eventId}/attendees`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">Open full attendee list</Link></div>
    </main>
  );
}
