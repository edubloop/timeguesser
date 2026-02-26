# TimeGuesser Future Roadmap

This document tracks ideas that are intentionally out of scope for the current release and can be revisited after core gameplay quality and deterministic pipeline stability are solid.

## LLM / AI Track (Deferred)

- LLM-powered hint commentary layered on top of deterministic hint tiers
- LLM/vision ingestion quality gate and reusable clue extraction
- Provider adapter hardening for AI calls (timeouts/retries/telemetry)

## Gameplay / Content Expansion

- Multiplayer / async challenges ("guess my vacation photos")
- Leaderboards
- Difficulty settings affecting photo selection and scoring curves
- Themed rounds (decades, continents, personal events)
- More photo sources (Google Street View historical imagery, Unsplash)
- Exponential scoring curve option (tighter rewards for being close)
- Month+Year precision mode as a difficulty option

## Platform Expansion

- Web version (same codebase via Expo Web)

## Player Records and Score History (Initial Thoughts)

### User stories

- As a player, I want to see my all-time top game scores so I can track personal bests.
- As a player, I want to see my recent games and whether I am improving over time.
- As a player, I want personal bests split by mode/source (public, personal, mixed).
- As a player, I want to see best no-hint runs separately from hinted runs.

### Candidate metrics

- All-time best game score
- Best round score
- Average score (last 10 games)
- Average distance error and year error (last 10 games)
- Streak count above score thresholds (e.g., 30k+, 35k+)
- Best no-hint game score

### Suggested UX progression

1. Add a compact "Career Stats" card on the Results screen (best score, games played, last-10 average).
2. Add a dedicated History screen with recent game list and simple trend line.
3. Add optional mode/source filters for PBs and trends.

### Storage direction

- Start local-first with AsyncStorage persistence.
- Store immutable per-game summaries with timestamp, source mode, total score, and per-round aggregate stats.
- Add optional cloud backup/sync later once account model exists.
