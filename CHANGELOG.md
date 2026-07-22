# Changelog

## [1.0.2] - 2026-07-22

### Fixed
- **Cache hit rate always 100%**: `cacheMissTokens` was incorrectly set to `cache_creation_input_tokens` (cache write tokens, always ~0 on hit), causing hit rate to show 100%. Now correctly uses actual `input_tokens` for miss count.
- OpenAI path: parse `prompt_tokens_details.cached_tokens` for cache hits instead of the non-existent `prompt_cache_hit_tokens` field.

## [0.1.5] - 2026-07-03

### Added
- System message support in Session Monitor with collapsible UI (默认折叠)
- Cleanup endpoint for stale sessions: `POST /api/sessions/cleanup-stale`
- Cleanup scripts for stuck sessions (`scripts/cleanup-db.ts`, `scripts/cleanup-sessions.ts`)

### Fixed
- **Session auto-redirect bug**: UI no longer forcefully switches to "live" sessions when user manually selects a different session
- Added `userSelectedSession` tracking to prevent unwanted auto-switching behavior
- Cleaned up sessions stuck in "live" state that caused infinite thinking display

### Changed
- Auto-follow logic now only activates on initial load or when user hasn't made a manual selection
- System messages now display in a purple-tinted collapsible block for better visual distinction

## Features

### System Message Display
System messages (role: "system") are now displayed in the session monitor with:
- Collapsed by default to save space
- Purple-tinted styling for visual distinction
- Click to expand/collapse
- Preview of first 100 characters when collapsed
- Markdown rendering support when expanded

### Session Cleanup
To clean up sessions stuck in "live" state:

**Option 1: When server is running**
```bash
bun scripts/cleanup-sessions.ts
```

**Option 2: Direct database access (server offline)**
```bash
bun scripts/cleanup-db.ts
# Or with custom DB path:
DB_PATH=~/.pulse/pulse.db bun scripts/cleanup-db.ts
```

**Option 3: Via API**
```bash
curl -X POST http://localhost:3000/api/sessions/cleanup-stale \
  -H "Authorization: Bearer YOUR_TOKEN"
```
