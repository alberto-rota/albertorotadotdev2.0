import type { Metadata } from "next";
import { GravityGame } from "@/components/game/GravityGame";

export const metadata: Metadata = {
  title: "Gravity Well — Alberto Rota",
  description:
    "A minimalist 3D puzzle: bend the terrain with your cursor and let gravity roll the sphere from A to B.",
};

export default function GamePage() {
  return <GravityGame />;
}
