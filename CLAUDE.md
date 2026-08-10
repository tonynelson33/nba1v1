@AGENTS.md

# NBA1v1 — King of the Court

A single-page Next.js app: a 32-player NBA 1-on-1 bracket generator. Users pick one player
per NBA team (+ 2 wild cards for any player in the league), the app auto-seeds all 32 by
height (weight as tiebreak), and renders an interactive single-elimination bracket split into
4 labeled pods (Bigs / Forwards / Wings / Guards) that converge on a champion.

Live: https://nba1v1.vercel.app · Vercel project `nba1v1` under team `tonynelson33-2004s-projects`.

## Stack
Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + React 19. No backend, no
database — everything is client-side state that resets on refresh (deliberate v1 scope).

## Data pipeline
Source of truth is `C:\Users\admin\Downloads\1 on 1 Tourney.xlsx` (the user's original
spreadsheet mockup — 3 tabs: `1 on 1 Tourney` roster/bracket, `Basic Game Rules`, `All Players`
pulled from nba.com/players). **Never hand-edit `src/data/*.json` for content changes** — edit
`scripts/parse-spreadsheet.mjs` and re-run it:

```bash
node scripts/parse-spreadsheet.mjs
```

This regenerates:
- `src/data/allPlayers.json` — **minified array of tuples** `[id, name, teamAbbr, position, heightIn, weightLb]`, not objects. Kept compact (~33KB vs ~130KB) because it ships to the client and because early on this file's size made manual deploy-payload assembly impractical. `src/lib/players.ts#hydratePlayers` expands tuples back into full `Player` objects (and derives `heightLabel`) at runtime — never add `heightLabel` or `teamName` back into the stored tuple.
- `src/data/teams.json` — 30 teams, each with `rosterIds: string[]` (player IDs only, resolved against `allPlayers` — don't duplicate full player objects here) and a `defaultPickId`.
- `src/data/defaultWildcards.json` — the 2 default wild-card player IDs.
- `src/data/rules.json` — parsed from the `Basic Game Rules` sheet. One known source typo ("An 7-second") is auto-corrected via `TEXT_FIXES` in the parse script — add future corrections there, not by hand-editing the JSON.

Team full names/rosters key off the **team's official ID** (abbr), not display order — `teams.json` is already alphabetical, which `RosterPicker` relies on for its column-major layout.

## Bracket structure (this trips people up — read before touching `lib/seeding.ts` or `components/Bracket.tsx`)
- Seeding: `seedPlayers()` sorts all 32 picked players by height desc, weight desc, name asc — seeds 1-32.
- Pods are just seed ranges, not real positions: seeds 1-8 = "Bigs", 9-16 = "Forwards", 17-24 = "Wings", 25-32 = "Guards".
- `deriveBracket()` pairs **sequentially** every round (seed1 v seed2, not seed1 v seed16). This is a deliberate choice matching the source spreadsheet, not a bug.
- Because pairing is sequential, each pod's 8 seeds stay self-contained through 3 rounds (Round of 32 → Round of 16 → Pod Final), and the Pod Final winner is exactly the pod champion. `components/Bracket.tsx` renders this explicitly as 4 colored `<Region>` blocks (Bigs=sky, Forwards=emerald, Wings=violet, Guards=rose) so this structure is visible, not implied.
- Bigs+Forwards pod champs meet in "Semifinal · Bigs v Forwards" (left), Wings+Guards meet on the right; those two winners meet in the Final.
- Prize copy (flavor from the original spreadsheet): $500,000 to each of the 4 pod champions (shown on the Pod Final column, `badgeMode="winner"`), $2,000,000 to the overall champion — shown **only** in the "King of the Court" banner, not inside the Finals matchup card itself (a user correction; don't move it back).
- `deriveBracket(seeded, winners)` is a pure function re-run on every render from the full 32-player list + a `{matchupId: winnerId}` map. Changing a roster pick doesn't need special-case invalidation — matchups whose stored winner no longer matches either seed slot just silently revert to undecided. Don't add manual reset-on-pick logic; it's unnecessary and the derivation already handles it correctly.

## Layout gotchas already hit once — don't reintroduce them
- **Never wrap the bracket in `overflow-x-auto` / `min-w-[...]` as its own scroll box.** It was built that way originally and had two bugs: `justify-center` inside an auto-scroll container made the start-side overflow permanently unreachable (classic CSS gotcha — scroll containers only reliably let you scroll toward the *end* overflow), and it created a confusing double-scrollbar UX (page + box). The bracket is now allowed to overflow the page itself, so the whole page scrolls sideways as one unit (mobile users pinch-zoom to shrink it — also intentional, don't add a mobile-specific narrow layout).
- **Don't put a `bg-*` Tailwind class directly on `<body>`.** It happened once (`bg-zinc-950` in `layout.tsx`) and silently overrode the gradient background defined in `globals.css`'s `body { background: ... }` rule, because a class selector beats an element selector regardless of source order. Set the base background only in `globals.css`.
- Tailwind v4's default palette generates CSS in modern color spaces (`oklch`/`lab`). This broke `html2canvas`'s color parser (`Attempting to parse an unsupported color function "lab"`) — that's why this project uses **`html2canvas-pro`** (a fork with modern-CSS-color support), not `html2canvas` or `html-to-image`. `html-to-image` was tried first and abandoned: it hangs indefinitely on `img.decode()` for `foreignObject`-based SVGs in some browser engines, with no user-facing error — a known upstream limitation, not fixable via its options.
- `ShareImageButton` passes explicit `width`/`height` (`node.scrollWidth`/`scrollHeight`) to `html2canvas`. Without it, capture silently crops to the target element's `offsetWidth`, which is smaller than its true content because of the overflow behavior above — don't remove those options.

## Dev environment notes (Windows, this machine specifically)
- Node.js is installed at `C:\Program Files\nodejs\` via winget, but **not on PATH for tool-spawned shells** — every PowerShell/Bash command needs `$env:Path += ";C:\Program Files\nodejs"` prepended, or use full paths. This is a per-process PATH issue, not a broken install.
- `.claude/launch.json` (repo root, one level up from this project) has two configs: `nba1v1` (dev server) and `nba1v1-prod` (production build via `next start` — needed at least once to properly test `html2canvas`, since `next dev`'s unminified/heavier build made an early diagnosis harder to trust).
- No `package-lock.json` in Vercel deploys done via the `deploy_to_vercel` MCP tool (files are assembled inline, not via git) — Vercel just runs a fresh `npm install`. Keep in mind version drift is possible if a dependency ships a breaking minor release.
- Favicon was deliberately skipped (the generated `.ico` is a large binary blob, not worth the token cost to inline into a manual deploy payload). Add one later if desired.

## Deployment
No git repo — deploys go straight through the `deploy_to_vercel` MCP tool (team ID
`team_PAR4L0JjYudA0RQhdZ7bU6Yd`, project `nba1v1`), which takes an inline file list, not a git
push. When redeploying after code changes, you must re-read and re-inline **every** changed
file into that call — there's no incremental diff mechanism. `src/data/allPlayers.json` and
`teams.json` rarely change; the components do. Skip `package-lock.json`, `scripts/`,
`node_modules/`, and the markdown docs — they're not needed at runtime.

## What's intentionally out of scope (don't build unless asked)
- Accounts, login, server-saved brackets, shareable-link/URL state.
- 2K ratings auto-default, simulations/probabilities, a custom 1v1-only rating.
- Automated periodic NBA.com roster re-scrape (current data is a static snapshot from the
  user's spreadsheet as of setup time).
