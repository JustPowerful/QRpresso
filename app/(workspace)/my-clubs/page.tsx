import type { Metadata } from "next";
import { MyClubs } from "@/components/clubs/my-clubs";

export const metadata: Metadata = { title: "My clubs | QRpresso" };

export default function MyClubsPage() {
  return <MyClubs />;
}
