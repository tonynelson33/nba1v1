import { BracketApp } from "@/components/BracketApp";
import teams from "@/data/teams.json";
import allPlayersRaw from "@/data/allPlayers.json";
import defaultWildcards from "@/data/defaultWildcards.json";
import ratingsMeta from "@/data/ratingsMeta.json";
import type { PlayerTuple, Team } from "@/lib/types";

export default function Home() {
  return (
    <BracketApp
      teams={teams as Team[]}
      allPlayersRaw={allPlayersRaw as PlayerTuple[]}
      defaultWildcards={defaultWildcards as string[]}
      ratingsAsOf={ratingsMeta.asOf}
    />
  );
}
