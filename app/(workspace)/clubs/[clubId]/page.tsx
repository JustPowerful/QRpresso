import type { Metadata } from "next";
import { ClubDetail } from "@/components/clubs/club-detail";

export const metadata: Metadata = { title: "Club | AI Hub" };

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubDetail clubId={clubId} />;
}
