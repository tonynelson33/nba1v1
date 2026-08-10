export type TeamColor = {
  abbr: string;
  primary: string;
  secondary: string;
};

export const TEAM_COLORS: Record<string, TeamColor> = {
  ATL: { abbr: "ATL", primary: "#E03A3E", secondary: "#26282A" },
  BOS: { abbr: "BOS", primary: "#007A33", secondary: "#BA9653" },
  BKN: { abbr: "BKN", primary: "#000000", secondary: "#FFFFFF" },
  CHA: { abbr: "CHA", primary: "#1D1160", secondary: "#00788C" },
  CHI: { abbr: "CHI", primary: "#CE1141", secondary: "#000000" },
  CLE: { abbr: "CLE", primary: "#860038", secondary: "#FDBB30" },
  DAL: { abbr: "DAL", primary: "#00538C", secondary: "#B8C4CA" },
  DEN: { abbr: "DEN", primary: "#0E2240", secondary: "#FEC524" },
  DET: { abbr: "DET", primary: "#C8102E", secondary: "#1D42BA" },
  GSW: { abbr: "GSW", primary: "#1D428A", secondary: "#FFC72C" },
  HOU: { abbr: "HOU", primary: "#CE1141", secondary: "#000000" },
  IND: { abbr: "IND", primary: "#002D62", secondary: "#FDBB30" },
  LAC: { abbr: "LAC", primary: "#C8102E", secondary: "#1D428A" },
  LAL: { abbr: "LAL", primary: "#552583", secondary: "#FDB927" },
  MEM: { abbr: "MEM", primary: "#5D76A9", secondary: "#12173F" },
  MIA: { abbr: "MIA", primary: "#98002E", secondary: "#F9A01B" },
  MIL: { abbr: "MIL", primary: "#00471B", secondary: "#EEE1C6" },
  MIN: { abbr: "MIN", primary: "#0C2340", secondary: "#236192" },
  NOP: { abbr: "NOP", primary: "#0C2340", secondary: "#C8102E" },
  NYK: { abbr: "NYK", primary: "#006BB6", secondary: "#F58426" },
  OKC: { abbr: "OKC", primary: "#007AC1", secondary: "#EF3B24" },
  ORL: { abbr: "ORL", primary: "#0077C0", secondary: "#C4CED4" },
  PHI: { abbr: "PHI", primary: "#006BB6", secondary: "#ED174C" },
  PHX: { abbr: "PHX", primary: "#1D1160", secondary: "#E56020" },
  POR: { abbr: "POR", primary: "#E03A3E", secondary: "#000000" },
  SAC: { abbr: "SAC", primary: "#5A2D81", secondary: "#63727A" },
  SAS: { abbr: "SAS", primary: "#C4CED4", secondary: "#000000" },
  TOR: { abbr: "TOR", primary: "#CE1141", secondary: "#000000" },
  UTA: { abbr: "UTA", primary: "#002B5C", secondary: "#F9A01B" },
  WAS: { abbr: "WAS", primary: "#002B5C", secondary: "#E31837" },
};

export function teamColorFor(abbr: string): TeamColor {
  return TEAM_COLORS[abbr] ?? { abbr, primary: "#3A3A3A", secondary: "#C9A227" };
}
