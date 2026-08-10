import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const SRC = "C:/Users/admin/Downloads/1 on 1 Tourney.xlsx";
const OUT_DIR = path.join(process.cwd(), "src", "data");

fs.mkdirSync(OUT_DIR, { recursive: true });

function slug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cellAt(sheet, r, c) {
  const ref = XLSX.utils.encode_cell({ r, c });
  const cell = sheet[ref];
  return cell ? cell.v : undefined;
}

const wb = XLSX.readFile(SRC);

// ---------- All Players sheet: full player pool + team name lookup ----------
const apSheet = wb.Sheets["All Players"];
const apRange = XLSX.utils.decode_range(apSheet["!ref"]);

// P:Q columns hold a 30-row team-name -> abbreviation lookup table alongside the player list.
const teamNames = [];
for (let r = apRange.s.r + 1; r <= apRange.e.r; r++) {
  const fullName = cellAt(apSheet, r, 15); // P
  const abbr = cellAt(apSheet, r, 16); // Q
  if (!fullName || !abbr) continue;
  teamNames.push({ fullName: String(fullName).trim(), abbr: String(abbr).trim() });
}

// Compact tuple form to keep the shipped JSON small: [id, name, teamAbbr, position, heightIn, weightLb].
// heightLabel and teamName are derived at runtime (see src/lib/players.ts) rather than duplicated here.
const allPlayers = [];
const allPlayersByTeamName = new Map(); // teamName -> full player objects, used only to build teams.json below

for (let r = apRange.s.r + 1; r <= apRange.e.r; r++) {
  const name = cellAt(apSheet, r, 0); // A
  if (!name) continue;
  const teamAbbr = cellAt(apSheet, r, 1); // B
  const position = cellAt(apSheet, r, 3); // D
  const heightIn = cellAt(apSheet, r, 10); // K
  const weightLb = cellAt(apSheet, r, 12); // M
  const teamName = cellAt(apSheet, r, 13); // N
  if (!teamAbbr || !teamName || heightIn == null || weightLb == null) continue;

  const player = {
    id: `${slug(String(name))}-${String(teamAbbr).toLowerCase()}`,
    name: String(name).trim(),
    teamAbbr: String(teamAbbr).trim(),
    position: position ? String(position).trim() : "",
    heightIn: Number(heightIn),
    weightLb: Number(weightLb),
  };

  allPlayers.push([player.id, player.name, player.teamAbbr, player.position, player.heightIn, player.weightLb]);

  const key = String(teamName).trim();
  if (!allPlayersByTeamName.has(key)) allPlayersByTeamName.set(key, []);
  allPlayersByTeamName.get(key).push(player);
}

// ---------- 1 on 1 Tourney sheet: default picks (team rows + wild cards) ----------
const tSheet = wb.Sheets["1 on 1 Tourney"];
const tRange = XLSX.utils.decode_range(tSheet["!ref"]);

const teamDefaultPicks = []; // { teamName, defaultPickName }
const wildcardDefaultNames = [];

for (let r = tRange.s.r; r <= tRange.e.r; r++) {
  const teamCell = cellAt(tSheet, r, 1); // B
  const pickCell = cellAt(tSheet, r, 2); // C
  if (!teamCell || !pickCell) continue;
  const teamLabel = String(teamCell).trim();
  if (teamLabel === "Team") continue; // header row
  if (teamLabel === "Wild Card") {
    wildcardDefaultNames.push(String(pickCell).trim());
  } else {
    teamDefaultPicks.push({ teamName: teamLabel, defaultPickName: String(pickCell).trim() });
  }
}

// ---------- Assemble teams.json: 30 teams, each with its roster + default pick ----------
const teams = teamNames.map(({ fullName, abbr }) => {
  const roster = (allPlayersByTeamName.get(fullName) || []).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const defaultEntry = teamDefaultPicks.find((t) => t.teamName === fullName);
  const defaultPick = defaultEntry
    ? roster.find((p) => p.name === defaultEntry.defaultPickName)
    : undefined;

  return {
    teamName: fullName,
    abbr,
    rosterIds: roster.map((p) => p.id),
    defaultPickId: defaultPick ? defaultPick.id : roster[0]?.id ?? null,
  };
});

// ---------- Default wild card picks (any player in the full pool) ----------
const allPlayersFlat = [...allPlayersByTeamName.values()].flat();
const defaultWildcards = wildcardDefaultNames
  .map((name) => allPlayersFlat.find((p) => p.name === name))
  .filter(Boolean)
  .map((p) => p.id);

// ---------- Basic Game Rules sheet ----------
const rSheet = wb.Sheets["Basic Game Rules"];
const rRange = XLSX.utils.decode_range(rSheet["!ref"]);

const headerLike = (text) => text.endsWith(":") || ["Scoring", "Fouls", "Other"].includes(text);

// Fixes typos present in the source spreadsheet text.
const TEXT_FIXES = [[/^An 7-second/, "A 7-second"]];
const applyTextFixes = (text) =>
  TEXT_FIXES.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text);

let rulesTitle = "";
const rulesSections = [];
let currentSection = null;

for (let r = rRange.s.r; r <= rRange.e.r; r++) {
  const raw = cellAt(rSheet, r, 0); // A
  if (raw == null || String(raw).trim() === "") continue;
  const text = applyTextFixes(String(raw).trim());

  if (r === rRange.s.r) {
    rulesTitle = text;
    continue;
  }

  if (headerLike(text)) {
    currentSection = { heading: text.replace(/:$/, ""), items: [] };
    rulesSections.push(currentSection);
  } else if (currentSection) {
    currentSection.items.push(text);
  }
}

const rules = { title: rulesTitle, sections: rulesSections };

// ---------- Write output ----------
// allPlayers.json is minified (one array per line via no top-level pretty-print) to keep the
// shipped payload small — it's machine-generated and not meant to be hand-edited.
fs.writeFileSync(path.join(OUT_DIR, "allPlayers.json"), JSON.stringify(allPlayers));
fs.writeFileSync(path.join(OUT_DIR, "teams.json"), JSON.stringify(teams, null, 2));
fs.writeFileSync(
  path.join(OUT_DIR, "defaultWildcards.json"),
  JSON.stringify(defaultWildcards, null, 2)
);
fs.writeFileSync(path.join(OUT_DIR, "rules.json"), JSON.stringify(rules, null, 2));

console.log(`Players: ${allPlayers.length}`);
console.log(`Teams: ${teams.length}`);
console.log(`Teams missing a resolved default pick: ${teams.filter((t) => !t.defaultPickId).length}`);
console.log(`Default wild cards resolved: ${defaultWildcards.length} / ${wildcardDefaultNames.length}`);
console.log(`Rules sections: ${rules.sections.length}`);
