import fs from "fs";
import path from "path";

// Refreshes allPlayers.json / teams.json / defaultWildcards.json.
//
// Roster membership, position, height, and weight come from nba.com/players (matches the
// project's existing bio-data convention exactly). The 2K API's own height/weight are NOT
// used — they reflect in-game (sometimes exaggerated) listings, not real bio measurements,
// and this project's seeding depends on real height/weight. 2K overall rating is stored per
// player (null when unrated/unmatched) and drives both the default pick per team + the 2
// default wild cards, and the rating badges shown in the UI.
//
// nba.com/players has bot-protection that blocks plain fetch() (see CLAUDE.md), so its data
// must be captured fresh via a real browser each time and saved as a JSON input file:
//   [[name, teamAbbr, position, "6-8", "220"], ...]
// (exactly window.__NEXT_DATA__.props.pageProps.players, filtered to ROSTER_STATUS === 1 with
// non-null HEIGHT/WEIGHT/POSITION, mapped to [name, TEAM_ABBREVIATION, POSITION, HEIGHT, WEIGHT]).
//
// Usage:
//   NBA2K_API_KEY=your_key node scripts/refresh-rosters-from-2k.mjs path/to/nba-com-players.json
//
// Writes to scripts/.roster-refresh-scratch/ for review — copy into src/data/ manually once the
// printed validation summary looks right.

const API_KEY = process.env.NBA2K_API_KEY;
if (!API_KEY) {
  console.error("Missing NBA2K_API_KEY environment variable.");
  process.exit(1);
}

const nbaComInputPath = process.argv[2];
if (!nbaComInputPath) {
  console.error("Usage: node scripts/refresh-rosters-from-2k.mjs path/to/nba-com-players.json");
  process.exit(1);
}

const BASE = "https://api.nba2kapi.com/api/players";
const OUT_DIR = path.join(process.cwd(), "scripts", ".roster-refresh-scratch");

function slug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Normalizes a name for cross-source matching: strips accents/periods/commas and common
// generational suffixes so "Nikola Jokić" == "Nikola Jokic" and "A.J. Lawson" == "AJ Lawson".
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/, "")
    .trim();
}

function parseNbaComHeightIn(heightStr) {
  const m = /^(\d+)-(\d+)$/.exec(String(heightStr).trim());
  if (!m) return null;
  return Number(m[1]) * 12 + Number(m[2]);
}

async function fetchPage(cursor, limit = 100) {
  let url = `${BASE}?teamType=curr&sort=overall:desc&limit=${limit}`;
  if (cursor) url += `&cursor=${cursor}`;
  const res = await fetch(url, { headers: { "X-API-Key": API_KEY } });
  const data = await res.json();
  if (!data.success) throw new Error(`API error: ${JSON.stringify(data)}`);
  return data;
}

async function fetchAllCurrent2kPlayers() {
  let all = [];
  let cursor = null;
  while (true) {
    const data = await fetchPage(cursor);
    all = all.concat(data.data);
    const meta = data.meta.pagination;
    if (!meta.hasMore) break;
    cursor = meta.nextCursor;
    await new Promise((r) => setTimeout(r, 150));
  }
  return all;
}

async function main() {
  const nbaComRaw = JSON.parse(fs.readFileSync(nbaComInputPath, "utf8"));
  console.log(`Loaded ${nbaComRaw.length} nba.com players from ${nbaComInputPath}`);

  const twoK = (await fetchAllCurrent2kPlayers()).filter((p) => p.team !== "Free Agency");
  console.log(`Fetched ${twoK.length} rostered 2K players.`);

  // Index 2K overall ratings by normalized name + team, and separately by name alone as a
  // fallback for cases where the two sources disagree on team (recent trade, etc.).
  const byNameAndTeam = new Map();
  const byNameOnly = new Map(); // name -> [{teamAbbr-ish label, overall}], only used if team match fails
  for (const p of twoK) {
    const key = normalizeName(p.name);
    if (!byNameOnly.has(key)) byNameOnly.set(key, []);
    byNameOnly.get(key).push(p);
  }

  const TEAM_NAME_TO_ABBR = {
    "Atlanta Hawks": "ATL", "Brooklyn Nets": "BKN", "Boston Celtics": "BOS",
    "Charlotte Hornets": "CHA", "Chicago Bulls": "CHI", "Cleveland Cavaliers": "CLE",
    "Dallas Mavericks": "DAL", "Denver Nuggets": "DEN", "Detroit Pistons": "DET",
    "Golden State Warriors": "GSW", "Houston Rockets": "HOU", "Indiana Pacers": "IND",
    "Los Angeles Clippers": "LAC", "Los Angeles Lakers": "LAL", "Memphis Grizzlies": "MEM",
    "Miami Heat": "MIA", "Milwaukee Bucks": "MIL", "Minnesota Timberwolves": "MIN",
    "New Orleans Pelicans": "NOP", "New York Knicks": "NYK", "Oklahoma City Thunder": "OKC",
    "Orlando Magic": "ORL", "Philadelphia 76ers": "PHI", "Phoenix Suns": "PHX",
    "Portland Trail Blazers": "POR", "Sacramento Kings": "SAC", "San Antonio Spurs": "SAS",
    "Toronto Raptors": "TOR", "Utah Jazz": "UTA", "Washington Wizards": "WAS",
  };
  for (const p of twoK) {
    const abbr = TEAM_NAME_TO_ABBR[p.team];
    if (!abbr) continue;
    byNameAndTeam.set(`${normalizeName(p.name)}|${abbr}`, p.overall);
  }

  const stats = { matchedByNameAndTeam: 0, matchedByNameOnly: 0, unrated: 0, badHeight: 0 };
  const players = []; // { id, name, teamAbbr, position, heightIn, weightLb, overall|null }

  for (const [name, teamAbbr, position, heightStr, weightStr] of nbaComRaw) {
    const heightIn = parseNbaComHeightIn(heightStr);
    if (heightIn == null) {
      stats.badHeight++;
      console.warn(`Unparseable height "${heightStr}" for ${name}`);
      continue;
    }
    const weightLb = Number(weightStr);

    const key = normalizeName(name);
    let overall = byNameAndTeam.get(`${key}|${teamAbbr}`);
    if (overall != null) {
      stats.matchedByNameAndTeam++;
    } else {
      const candidates = byNameOnly.get(key) || [];
      if (candidates.length === 1) {
        overall = candidates[0].overall;
        stats.matchedByNameOnly++;
        console.warn(
          `Team mismatch for ${name}: nba.com has ${teamAbbr}, 2K has ${candidates[0].team} — used 2K rating anyway.`
        );
      } else {
        overall = null;
        stats.unrated++;
        if (candidates.length > 1) {
          console.warn(`Ambiguous 2K match for ${name} (${candidates.length} candidates) — left unrated.`);
        }
      }
    }

    players.push({
      id: `${slug(name)}-${teamAbbr.toLowerCase()}`,
      name,
      teamAbbr,
      position,
      heightIn,
      weightLb,
      overall,
    });
  }

  const idCounts = new Map();
  for (const p of players) idCounts.set(p.id, (idCounts.get(p.id) || 0) + 1);
  const dupes = [...idCounts.entries()].filter(([, c]) => c > 1);
  if (dupes.length) {
    console.warn(`Duplicate ids detected (kept as-is, review before copying in): ${dupes.map(([id]) => id).join(", ")}`);
  }

  players.sort((a, b) => a.id.localeCompare(b.id));
  const allPlayers = players.map((p) => [
    p.id,
    p.name,
    p.teamAbbr,
    p.position,
    p.heightIn,
    p.weightLb,
    p.overall,
  ]);

  // ---------- teams.json: 30 teams, default pick = highest-rated player on that roster ----------
  const byTeam = new Map();
  for (const p of players) {
    if (!byTeam.has(p.teamAbbr)) byTeam.set(p.teamAbbr, []);
    byTeam.get(p.teamAbbr).push(p);
  }

  const fallbackAbbrs = [];
  const teams = Object.entries(TEAM_NAME_TO_ABBR).map(([teamName, abbr]) => {
    const roster = (byTeam.get(abbr) || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    const rated = roster.filter((p) => p.overall != null);
    const bestPick = rated.length
      ? rated.slice().sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name))[0]
      : null;
    if (!bestPick && roster.length > 0) fallbackAbbrs.push(abbr);
    return {
      teamName,
      abbr,
      rosterIds: roster.map((p) => p.id),
      defaultPickId: bestPick ? bestPick.id : roster[0]?.id ?? null,
    };
  });

  // ---------- defaultWildcards.json: top 2 rated overall league-wide, excluding the 30 default picks ----------
  const defaultPickIds = new Set(teams.map((t) => t.defaultPickId).filter(Boolean));
  const wildcards = players
    .filter((p) => p.overall != null && !defaultPickIds.has(p.id))
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((p) => p.id);

  // ---------- Write scratch output ----------
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "allPlayers.json"), JSON.stringify(allPlayers));
  fs.writeFileSync(path.join(OUT_DIR, "teams.json"), JSON.stringify(teams, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "defaultWildcards.json"), JSON.stringify(wildcards, null, 2));

  // ---------- Validation summary ----------
  const rosterSizes = teams.map((t) => t.rosterIds.length);
  console.log("\n--- Validation summary ---");
  console.log(`Players kept: ${players.length} (bad height skipped: ${stats.badHeight})`);
  console.log(
    `Ratings: matched by name+team ${stats.matchedByNameAndTeam}, matched by name only ${stats.matchedByNameOnly}, unrated ${stats.unrated}`
  );
  console.log(`Teams: ${teams.length} / 30`);
  console.log(`Roster sizes: min ${Math.min(...rosterSizes)}, max ${Math.max(...rosterSizes)}`);
  console.log(`Default picks resolved: ${teams.filter((t) => t.defaultPickId).length} / 30`);
  if (fallbackAbbrs.length) {
    console.log(`Teams with NO rated players (fell back to roster[0] alphabetically): ${fallbackAbbrs.join(", ")}`);
  }
  console.log(`Default wild cards resolved: ${wildcards.length} / 2`);
  console.log("\nDefault picks (team: player, overall):");
  for (const t of teams) {
    const p = players.find((pl) => pl.id === t.defaultPickId);
    console.log(`  ${t.abbr}: ${p ? `${p.name} (${p.overall ?? "unrated, fallback"})` : "MISSING"}`);
  }
  console.log("\nDefault wild cards:");
  for (const id of wildcards) {
    const p = players.find((pl) => pl.id === id);
    console.log(`  ${p ? `${p.name} (${p.overall})` : id}`);
  }
  console.log(`\nWrote scratch output to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
