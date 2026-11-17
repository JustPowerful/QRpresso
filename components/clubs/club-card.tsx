import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";

type ClubCardData = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  profileImage: string | null;
  coverImage: string | null;
};

export function ClubCard({
  club,
  subtitle,
  footer,
}: {
  club: ClubCardData;
  subtitle: string;
  footer?: ReactNode;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-28 bg-gradient-to-br from-primary/70 via-primary/30 to-secondary">
        {club.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.coverImage} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
        <div className="absolute -bottom-7 left-5 grid size-16 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-md">
          {club.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.profileImage} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-secondary text-secondary-foreground"><UsersRound size={22} aria-hidden="true" /></div>
          )}
        </div>
      </div>

      <div className="flex min-h-52 flex-col px-5 pb-5 pt-10">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{subtitle}</p>
          <h2 className="truncate text-lg font-semibold tracking-tight">
            <Link href={`/clubs/${club.id}`} className="decoration-primary/50 underline-offset-4 transition-colors group-hover:underline">{club.name}</Link>
          </h2>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
          {club.description || "A community for people who want to connect and share ideas."}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs text-muted-foreground">Created {new Date(club.createdAt).toLocaleDateString()}</span>
          {footer ?? (
            <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open club <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
