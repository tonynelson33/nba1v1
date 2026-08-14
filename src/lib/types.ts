export type Player = {
  id: string;
  name: string;
  teamAbbr: string;
  position: string;
  heightIn: number;
  heightLabel: string;
  weightLb: number;
  /** 2K overall rating, 0-99. Null when the player has no current 2K rating (unrated). */
  overall: number | null;
};

/** Compact wire format for allPlayers.json: [id, name, teamAbbr, position, heightIn, weightLb, overall]. */
export type PlayerTuple = [string, string, string, string, number, number, number | null];

export type Team = {
  teamName: string;
  abbr: string;
  rosterIds: string[];
  defaultPickId: string | null;
};

export type Pod = "Bigs" | "Forwards" | "Wings" | "Guards";

export type SeededPlayer = Player & { seed: number; pod: Pod };

export type Matchup = {
  id: string;
  a: SeededPlayer | null;
  b: SeededPlayer | null;
  winnerId: string | null;
};

export type Round = {
  name: string;
  matchups: Matchup[];
};

/** One slot in the 32-slot picker: 30 team slots + 2 wild card slots. */
export type Slot = {
  slotId: string;
  label: string;
  abbr: string | null;
  kind: "team" | "wildcard";
};
