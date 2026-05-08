# TraceVault Feature Roadmap & Status

This file tracks the status of all major features.
Last updated: April 2026

---

## ✅ Completed Features

### Backend Foundation & Authentication
- [x] User Registration
- [x] User Login
- [x] JWT Authentication
- [x] Protected Routes
- [x] Password Hashing
- [x] Environment-based Secrets
- [x] Token Expiration Management

### Project Management
- [x] Create Project
- [x] List Projects with enriched cards
- [x] Stats row (entries, last sealed, pivotal)
- [x] Template breakdown bars
- [x] Tags derived from entries
- [x] Update Project
- [x] Delete Project
- [x] Sort + filter bar

### Engineering Entry System
- [x] Create Entry (6 structured templates)
- [x] Structured JSON storage per template
- [x] Template type + impact selection
- [x] Tags on entries
- [x] Entry visibility (public/private)
- [x] Snippet shown on feed cards

### Community Feed & Interactivity
- [x] For You tab
- [x] From Your Stack tab
- [x] Trending sidebar (Today/Week/Month)
- [x] Insight Strength + Momentum on trending
- [x] Single column + sidebar layout
- [x] Feed cards (all fields)
- [x] Reactions with counts
- [x] Vault it button
- [x] Share button (copy link)
- [x] Search bar

### Collections & Vault
- [x] Create Collection (modal)
- [x] List Collections on /projects page
- [x] Compact collection row
- [x] Private/Public visibility badge
- [x] Entry preview titles in row
- [x] Vault it button on feed cards
- [x] Vaulted ✓ state (amber color)
- [x] /vault page exists
- [x] Vaulted entries display
- [x] Search your vault

### User System & Profiles
- [x] User Dashboard
- [x] User Project Ownership
- [x] Public profile route /u/username
- [x] Avatar initials fallback
- [x] Stats cards (projects, reflections, month)
- [x] Quick action cards
- [x] Recent reflections list
- [x] Identity header (name, username, joined)
- [x] Stack tags derived from entries
- [x] Share Profile + Edit Profile buttons
- [x] Volume / Impact / Streak stat cards
- [x] Activity heatmap (52 week grid)
- [x] Recent / Most Reacted / By Template tabs

---

## 🚧 Partially Done — Fix These First

### Auth & Security
- [ ] Logout — in sidebar but needs verification
- [ ] Refresh token handling
- [ ] Rate limiting on auth endpoints
- [x] CORS issue (dev/prod origin) — fixed

### User System & Dashboard
- [ ] Streak calculation bug — shows 0 incorrectly
- [ ] Username editing — auto-generated ugly username
- [ ] Bio field on profile — missing from identity header
- [ ] Avatar image upload
- [ ] Profile visibility toggle (public/private)
- [ ] Edit Profile page — name, bio, username, timezone
- [ ] Settings page — notifications, preferences
- [ ] Streak shown in dashboard header
      "🔥 4 day streak · Welcome back Syed"
- [ ] Streak nudge card — conditional, only shows
      if streak active + no entry today
- [ ] Impact + top reaction on recent list items
- [ ] "Review growth" links to /u/username
- [ ] Replace "This Month" stat card with Streak

### Entry System
- [ ] Entry detail page /reflections/:id
      → Most critical missing piece
      → Full structured fields rendered per template
      → Confidence badge where applicable
      → Reactions + Vault + Share on page
      → Edit button (owner only)
      → Add to collection button
- [ ] Edit Entry — pre-filled template form
- [ ] Delete Entry (with confirmation)
- [ ] List entries within project detail page
- [ ] Entry migration (old markdown → structured fields)

### Collections
- [ ] Collection detail page /collections/:id
      → Header with name, description, count
      → Entry list (template dot, title, project, impact, date)
      → Remove entry (hover X button)
      → Empty state
- [ ] Add Entry modal — search across all entries,
      toggle add/remove
- [ ] Add to collection from entry action bar
      (popover showing all collections)
- [ ] Edit collection (name, description)
- [ ] Delete collection (with confirmation)
- [ ] Public collections visible on profile

### Tagging & Filtering
- [ ] Clicking tag → filters feed instantly
- [ ] Popular tags in sidebar → clickable
- [ ] Tag appears in URL: /feed?tag=react
- [ ] Tag autocomplete when adding to entry

### Feed Enhancements
- [ ] 😅 Felt this reaction — appears missing
- [ ] LinkedIn-style reaction picker
      (hover to open, multiple selections,
      per-reaction active colors, emoji not icons)
- [ ] Filter panel (slide in from right)
      template type, impact, confidence, tag filters
- [ ] Popular tags section in sidebar (clickable)
- [ ] Your Stack section in sidebar (quiet reminder)
- [ ] Trending card enriched
      (reactions + template type per item,
       rank numbers styled by position)
- [ ] Infinite scroll / load more
- [ ] New entries banner "X new — click to load"
- [ ] Skeleton loading states
- [ ] Empty states per tab
- [ ] Card click → opens entry detail page

### Vault
- [ ] Vault page header "/VAULT · Your saved reflections"
- [ ] Sort vault (Recent, Oldest, By Template, By Impact)
- [ ] Filter vault by template type
- [ ] Empty vault state
- [ ] Remove from vault (unvault)
- [ ] Vault count badge on sidebar icon

### Profile Completion
- [ ] Entry list rendering below tabs (tabs exist, content missing)
- [ ] Private entry placeholders 🔒
- [ ] Projects showcase section
- [ ] Engineering breakdown section
      (template distribution bars + confidence breakdown)
- [ ] Bio field rendered in header
- [ ] OG meta tags for link unfurling on Discord/LinkedIn
- [ ] Private profile state for visitors
- [ ] 404 page for unknown username

---

## ⏳ Planned Features

### Detailed Views
- [ ] Project detail page /projects/:id
      → Header with name + stats
      → Template filter tabs (ALL, BUG AUTOPSY, etc.)
      → Entry cards filtered by tab
      → + Seal Entry (pre-selects this project)
      → Search within project
- [ ] Project empty state (zero projects)
- [ ] Filter returns no results state

### History Page
- [ ] /history route — personal chronological entry log
      All entries across all projects, private view
      Different from profile (public) and feed (community)
- [ ] Timeline layout — vertical line, month groupings
      ● Template type · Title · Impact · Reactions · Date
- [ ] Filter by project, template type, date range
- [ ] Export entries as JSON or Markdown
- [ ] "On this day" — entries from same date last year

### Stack Memory
- [ ] /stack page — technology tiles
      Derived from project tech stack + entry tags
      Shows: tech name, entry count, project count
- [ ] Technology detail page /stack/:tech
      Section 1: Your experiences (entries tagged with tech)
      Section 2: Official docs (hardcoded top 30 techs)
      Section 3: Your resources (saved URLs)
- [ ] Add resource URL per technology (links only, no upload)
- [ ] Static official docs JSON map (top 30 technologies)
- [ ] Stack Memory in sidebar navigation

### Notes System (JSONB PostgreSQL)
- [ ] Entry annotations — private notes on sealed entries
      Quick textarea below entry content
      "Add a follow-up thought without editing the sealed entry"
- [ ] Project scratchpad — unstructured quick notes per project
      "TODO: check Prisma version before upgrading"
- [ ] Text highlighting on entries
      Select text → highlight → saved to vault with source link
      Like Kindle highlights for engineering knowledge
- [ ] Full notes page — Tiptap editor
      Block types: paragraph, heading, code, highlight,
      checklist, divider, quote/callout
      Linked to project or entry optionally
      JSONB storage in PostgreSQL
      Private by default

### Search
- [ ] Global search Cmd+K command palette
      Searches entries, projects, collections simultaneously
      Groups results by type
- [ ] Feed search working (title, tags, author)
- [ ] Vault search working
- [ ] Full text search on structured entry fields
- [ ] pgvector semantic search (after ACE AI setup)

### Profile Polish
- [ ] Username clean setup flow
      First visit → prompted if auto-generated username
- [ ] Profile completeness indicator
      "Your profile is 60% complete"
      Shows what's missing (bio, avatar, etc.)

### Mobile (React Native)
- [ ] Responsive web layout (all pages)
- [ ] Mobile sidebar (hamburger menu)
- [ ] React Native app — iOS + Android
- [ ] Bottom nav: Feed, Vault, + Quick Seal, Profile, Stack
- [ ] Quick Seal — simplified entry (title + template + one field)
      Full entry completable later on web
- [ ] Push notifications
      "🔥 Your streak is at risk"
      "💡 Your entry got 5 reactions"
- [ ] Offline support — read vaulted entries offline,
      draft entries offline + sync when connected
- [ ] Touch-friendly reaction picker (bottom sheet)

---

## 🚀 New Features — Expansion Layer

### ACE AI — Engineering Assistant
Not a coding assistant. A project-aware companion
that knows your entries, notes, and codebase.

Three modes:
- [ ] Mode 1 — Memory Mode
      Answers from your TraceVault entries + notes
      "What did I learn about JWT last month?"
- [ ] Mode 2 — Codebase Mode
      Reads connected GitHub repo for structure questions
      "Where does feed personalization logic live?"
- [ ] Mode 3 — Combined Mode
      Connects past experiences WITH current codebase
      "I had a Prisma bug before — does my current
       schema have similar patterns?"

Technical requirements:
- [ ] pgvector extension on PostgreSQL
      Store embeddings for entries + notes
      Semantic similarity search on query
- [ ] GitHub OAuth (read-only access)
- [ ] Repo file tree fetching + caching
- [ ] On-demand file content fetching
- [ ] Context window builder (entries + notes + code)
- [ ] Streaming response to frontend
- [ ] ACE AI chat interface
      Floating panel or dedicated /ace page

### Desktop Overlay App (Tauri)
Floating translucent overlay — works on top of
VSCode, terminal, browser, Figma. No window switching.

- [ ] Tauri desktop app (Mac + Windows + Linux)
      Uses existing React components
      Calls same TraceVault API
- [ ] System tray icon + global keyboard shortcut
      Default: Cmd+Shift+T (configurable)
- [ ] Translucent blurred window effect
- [ ] Three overlay modes:
      Quick Seal — template + one key field, seal instantly
      Quick Note — textarea, syncs to project scratchpad
      ACE AI Chat — ask questions, streamed response
- [ ] Always on top option
- [ ] Auto-hide after sealing entry

### Cross-Platform Posting
When you seal an entry, auto-format and post
to connected developer platforms.

- [ ] Dev.to integration (API key, free)
      Auto-formats entry as technical article
      Structured fields → markdown sections
- [ ] Hashnode integration (GraphQL API key, free)
      Same formatting as Dev.to
- [ ] Discord webhook integration (free)
      Short snippet + link to full entry
- [ ] Post prompt appears after sealing
      "Share this to your connected platforms?"
      Checkboxes for each connected platform
- [ ] Platform formatter per entry type
      Bug Autopsy → debugging story format
      Design Decision → architecture post format
      Lesson Learned → tip/thread format
- [ ] Share Draft Generator (for LinkedIn/X)
      Can't auto-post (expensive API / approval needed)
      Instead: generates pre-formatted copy-paste text
      LinkedIn version, Twitter thread version
      One click to copy each version

### Developer Presence Dashboard
One place to see your activity across all platforms.
Read-only aggregation — no posting from here.

- [ ] /presence page
- [ ] GitHub activity (public API, no auth needed)
      Last commit, contribution count
- [ ] Dev.to activity (API key)
      Last post, article count, reaction count
- [ ] Hashnode activity (GraphQL)
      Last post, follower count
- [ ] TraceVault activity
      Entries sealed, streak, reactions received
- [ ] Staleness indicators
      "You haven't posted on LinkedIn in 3 months"
      "Your Dev.to last article was 45 days ago"
- [ ] Cross-platform consistency nudge
      Shows where you're active vs inactive

### Widget System
TraceVault features embeddable anywhere.

- [ ] Widget SDK (widget.js — vanilla JS, ~15KB)
      Injected via single script tag
      Sandboxed iframe on widgets.tracevault.io
      postMessage cross-origin communication
- [ ] Entry Embed Widget
      Read-only entry card — embeddable in blog posts,
      GitHub READMEs, Notion pages
      Live reaction counts
      <tracevault-entry id="abc123" />
- [ ] Stack Memory Widget
      Shows your tech stack + entry counts
      Embeddable on portfolio sites
- [ ] Seal Entry Widget (requires auth token)
      Floating button on any webpage
      Opens entry form in popup
      Engineer seals entry without leaving current page
- [ ] Notes Widget (requires auth token)
      Floating notepad
      Syncs to TraceVault project scratchpad

### AI Content Repurposing (Post-Revenue)
ACE AI turns your accumulated entries into
content for other platforms.

- [ ] "Turn your entries into an article"
      Engineer has 8 React entries
      ACE AI synthesizes into Dev.to article
      Engineer reviews + edits + one-click post
- [ ] Multi-entry synthesis
      Find common theme across entries
      Generate structured content around it
- [ ] Entry improvement suggestions
      "This Bug Autopsy is missing a root cause
       — want help writing one?"

---

## 🔮 Future Ecosystem

### TraceVault CLI
- [ ] npm install -g tracevault-cli
- [ ] tracevault seal "bug description" — quick entry from terminal
- [ ] tracevault note "quick thought" — project scratchpad
- [ ] tracevault ask "question" — ACE AI from terminal
- [ ] tracevault sync — sync local drafts

### TraceVault for Teams
- [ ] Shared project knowledge bases
- [ ] Team feed (entries from teammates only)
- [ ] Shared collections
- [ ] Team stack memory
- [ ] Role-based access (viewer, contributor, admin)

### TraceVault for Designers
- [ ] Same concept, design-specific templates:
      Design Decision, UX Tradeoff,
      Component Pattern, User Research Note
- [ ] Figma plugin integration
- [ ] Design system knowledge base

### Public API
- [ ] REST API with API key auth
- [ ] Endpoints for entries, projects, collections
- [ ] Webhook support (on entry sealed, etc.)
- [ ] Lets engineers build their own integrations

---

## 🗑️ Removed from Roadmap

These were in the original roadmap but have been
removed — either premature, too complex, or low value
at current stage:

- ~~Bulk Markdown Import~~ — overengineered, nobody asks for this
- ~~Terminal Error Capture~~ — needs user base first
- ~~Git Commit Integration~~ — premature
- ~~VSCode Extension~~ — build after CLI and user base exist
- ~~Collaborative Collections~~ — premature, no teams feature yet

---

## 📋 Priority Build Order

### Sprint 1 — Make content readable (this week)
```
1. Entry detail page /reflections/:id  ← most critical
2. Fix streak calculation bug
3. Profile entry list rendering (tabs have no content)
4. Username clean setup + bio field
```

### Sprint 2 — Complete half-built features
```
5. Collection detail page /collections/:id
6. Project detail page /projects/:id
7. Add to collection from entry action bar
8. 😅 Felt this reaction + LinkedIn picker fix
```

### Sprint 3 — Polish existing features
```
9.  Feed filter panel working
10. Popular tags clickable
11. Trending card enriched
12. Vault page header + sort + empty state
13. Profile sections (projects showcase + breakdown)
14. OG meta tags on profile
```

### Sprint 4 — New value features
```
15. History page with timeline layout
16. Dashboard streak improvements
17. Notes system (entry annotations first)
18. Stack Memory MVP
```

### Sprint 5 — Search + Discovery
```
19. Global search Cmd+K command palette
20. Full text search on entry fields
21. Tag filtering throughout (feed, vault, history)
22. Mobile responsive audit
```

### Sprint 6 — Expansion (after first users)
```
23. Dev.to + Hashnode + Discord cross-posting
24. Developer presence dashboard /presence
25. Notes full system (Tiptap editor)
26. React Native mobile app
```

### Sprint 7 — Intelligence (after revenue)
```
27. pgvector setup + entry embeddings
28. ACE AI Mode 1 (memory mode)
29. GitHub OAuth + codebase reading
30. ACE AI Mode 2 (codebase mode)
31. Desktop overlay app (Tauri)
32. Widget SDK
```