import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, UsersRound } from "lucide-react";

type EventCardData = {
  id: string;
  name: string;
  description: string | null;
  date: Date | string;
  location: string | null;
  thumbnail: string | null;
  eventType: "FREE" | "PAID";
  price: number;
  attendeeCount: number;
  attendeeLimit: number | null;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EventCard({ clubId, event }: { clubId: string; event: EventCardData }) {
  const href = `/clubs/${clubId}/events/${event.id}`;
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative h-40 bg-gradient-to-br from-primary/70 via-primary/30 to-secondary">
          {event.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.thumbnail} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <span className="absolute bottom-3 left-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {event.eventType === "PAID" ? `Paid · ${event.price.toFixed(2)}` : "Free event"}
          </span>
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarDays size={14} aria-hidden="true" /> {formatDate(event.date)}
          </div>
          <h3 className="truncate text-lg font-semibold tracking-tight group-hover:text-primary">{event.name}</h3>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
            {event.description || "Open the event to see the full details."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {event.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{event.location}</span>}
            <span className="inline-flex items-center gap-1.5"><UsersRound size={14} aria-hidden="true" />{event.attendeeLimit === null ? `${event.attendeeCount} attending` : `${event.attendeeCount} / ${event.attendeeLimit} spots`}</span>
          </div>
        </div>
      </Link>
      <div className="flex justify-end border-t px-5 py-3">
        <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          Event details <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
