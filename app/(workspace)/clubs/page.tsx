import type { Metadata } from "next";
import { DiscoverClubs } from "@/components/clubs/discover-clubs";

export const metadata: Metadata = { title: "Discover clubs | AI Hub" };

export default function ClubsPage() {
  return <DiscoverClubs />;
}
