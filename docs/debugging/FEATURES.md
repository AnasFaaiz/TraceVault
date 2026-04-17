## 🔐 AUTHENTICATION & SECURITY
Status: Mostly complete

- [x] User Registration
- [x] User Login  
- [x] JWT Authentication
- [x] Protected Routes
- [x] Password Hashing
- [x] Environment-based Secrets
- [x] Token Expiration Management
- [ ] Logout (in sidebar but needs verification)
- [ ] Refresh token handling
- [ ] Rate limiting on auth endpoints

## 👤 USER SYSTEM
Status: Partially built

- [x] User Dashboard
- [x] User Project Ownership
- [x] Public profile route /u/username
- [x] Avatar initials fallback
- [ ] Username editing (clean username setup)
- [ ] Bio field on profile
- [ ] Avatar image upload
- [ ] Profile visibility toggle (public/private)
- [ ] Edit Profile page — name, bio, username,
      timezone (needed for streak calculation)
- [ ] Settings page — notifications, preferences

## 📊 DASHBOARD
Status: Built, needs improvements

- [x] Stats cards (projects, reflections, month)
- [x] Quick action cards
- [x] Recent reflections list
- [ ] Streak shown in header
      "🔥 4 day streak · Welcome back Syed"
- [ ] Streak nudge card (conditional — only shows
      if streak active + no entry today)
      "Keep your streak alive → + New reflection"
- [ ] Impact + top reaction on recent list items
- [ ] "Review growth" links to /u/username
- [ ] Replace "This Month" stat with Streak stat
- [ ] Streak calculation fixed

## 📂 PROJECT MANAGEMENT
Status: Well built, missing detail page

- [x] Create Project
- [x] List Projects with enriched cards
- [x] Stats row (entries, last sealed, pivotal)
- [x] Template breakdown bars
- [x] Tags derived from entries
- [x] Update Project
- [x] Delete Project
- [x] Sort + filter bar
- [ ] Project detail page /projects/:id
      - Header with project name + stats
      - Template filter tabs across top
        (ALL, BUG AUTOPSY, DESIGN DECISION...)
      - Entry cards filtered by selected tab
      - "+ Seal Entry" button pre-selects project
      - Search within project entries
- [ ] Project empty state (zero projects)
- [ ] Filter returns no results state

## 📦 COLLECTIONS
Status: List built, detail page missing

- [x] Create Collection (modal)
- [x] List Collections on /projects page
- [x] Compact collection row
- [x] Private/Public visibility badge
- [x] Entry preview titles in row
- [ ] Collection detail page /collections/:id
      - Header (name, description, entry count)
      - Visibility toggle button
      - Entry list (template dot, title, 
        project name, impact, date)
      - Remove entry from collection (hover X)
      - Empty collection state
- [ ] Add Entry modal (search across all entries,
      toggle add/remove)
- [ ] Add to collection from entry action bar
      (popover showing all collections)
- [ ] Edit collection (name, description)
- [ ] Delete collection (with confirmation)
- [ ] Public collections visible on profile

## 📝 ENGINEERING ENTRY SYSTEM
Status: Create works, everything else missing

- [x] Create Entry (6 structured templates)
- [x] Structured JSON storage per template
- [x] Template type + impact selection
- [x] Tags on entries
- [x] Entry visibility (public/private)
- [x] Snippet shown on feed cards
- [ ] Entry detail page /reflections/:id
      Full structured entry rendered correctly
      per template type — each field labeled
      and displayed conversationally
      Confidence badge shown where applicable
      Reactions + Vault + Share on detail page
      Edit button (owner only)
      "Add to collection" button
- [ ] Edit Entry — same template form, pre-filled
- [ ] Delete Entry (with confirmation)
- [ ] List entries within project detail page
- [ ] Entry migration (old markdown → structured)

## 🏷️ TAGGING SYSTEM
Status: Tags exist, filtering not wired

- [x] Tags on entries
- [x] Tags shown on feed cards
- [x] Tags on project cards (derived)
- [x] Tags on profile (derived from entries)
- [ ] Clicking tag → filters feed to that tag
- [ ] Popular tags in sidebar → clickable filter
- [ ] Tag appears in URL when filtered:
      /feed?tag=react
- [ ] Tag autocomplete when adding to entry

## 🌐 COMMUNITY FEED
Status: Well built, several gaps

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
- [ ] 😅 Felt this reaction — appears missing
- [ ] LinkedIn-style reaction picker
      (hover to open, multiple selections,
      per-reaction active colors)
- [ ] Filter panel (slide in from right)
      - Template type multi-select
      - Impact level pills
      - Confidence filter
      - Tag search + select
      - Active filter count on button
      - Filters in URL params
- [ ] Popular tags section in sidebar
      (clickable, filters feed)
- [ ] Your Stack section in sidebar
      (shows your tags quietly)
- [ ] Trending card enriched
      (reactions + template type per item)
- [ ] Infinite scroll (currently loads all)
- [ ] New entries banner
      "3 new entries — click to load"
- [ ] Skeleton loading states
- [ ] Empty states per tab
- [ ] Entry detail page opens on card click

## 💾 VAULT
Status: Built, needs polish

- [x] Vault it button on feed cards
- [x] Vaulted ✓ state (amber color)
- [x] /vault page exists
- [x] Vaulted entries display
- [x] Search your vault
- [ ] Vault page header + title
      "/VAULT · Your saved reflections"
- [ ] Sort vault entries
      (Most Recent, Oldest, By Template,
       By Impact)
- [ ] Filter vault by template type
- [ ] Empty vault state
      "Your vault is empty
       Save entries from the feed
       to access them here"
- [ ] Remove from vault (unvault button)
- [ ] Vault count in sidebar icon

## 📅 HISTORY PAGE
Status: In sidebar, undefined purpose

Define History as:
Your personal chronological entry log —
all entries across all projects, private view,
timeline format. Different from profile
(public) and feed (community).

- [ ] /history page
- [ ] Timeline layout (Option A from earlier)
      Month groupings with vertical line
- [ ] Filter by project
- [ ] Filter by template type
- [ ] Filter by date range
- [ ] Export entries as JSON or Markdown
- [ ] "On this day" — entries from same date
      last year (if any exist)

## 👤 PUBLIC ENGINEERING PROFILE
Status: Partially built, key sections missing

- [x] /u/username route
- [x] Identity header (name, username, joined)
- [x] Stack tags
- [x] Share Profile + Edit Profile buttons
- [x] Volume / Impact / Streak stat cards
- [x] Activity heatmap (52 week grid)
- [x] Recent / Most Reacted / By Template tabs
- [ ] Streak calculation fixed
- [ ] Entry list actually rendering below tabs
- [ ] Private entry placeholders (🔒)
- [ ] Projects showcase section
- [ ] Engineering breakdown section
      (template bars + confidence breakdown)
- [ ] Bio field shown (currently missing)
- [ ] OG meta tags for link sharing
- [ ] Private profile state
      (visitor sees "profile is private")
- [ ] 404 for unknown username
- [ ] Public collections section (later)

## 🧠 STACK MEMORY
Status: Not started, design complete

Build after entry system + tags are solid.

- [ ] /stack page
      Technology tiles derived from:
      - Project tech stack fields
      - Entry tags
      Tile shows: tech name, entry count,
      project count
- [ ] Technology detail page /stack/:tech
      Section 1: Your experiences
        (entries tagged with this tech)
      Section 2: Official docs
        (hardcoded links for top 30 techs)
      Section 3: Your resources
        (URL links you've saved)
- [ ] Add resource URL per technology
      (no file upload — just links)
- [ ] Static official docs map
      (JSON file with top 30 techs + doc links)
- [ ] Stack Memory in sidebar navigation
- [ ] RAG integration (future — after revenue)

## 🔍 SEARCH
Status: UI exists, functionality unclear

- [ ] Global search (Cmd+K command palette)
      Searches across entries, projects,
      collections simultaneously
      Groups results by type
- [ ] Feed search working (title, tags, author)
- [ ] Vault search working
- [ ] Project search within project detail
- [ ] Full text search on entry fields
      (not just title)

## 🎨 PORTFOLIO / PROFILE EXTRAS
Status: Not started

- [ ] Username clean setup flow
      First visit to profile → prompted to
      set a clean username if auto-generated
- [ ] Profile completeness indicator
      "Your profile is 60% complete"
      Shows what's missing (bio, avatar etc.)

## 🤖 AI FEATURES (Future — after revenue)
- [ ] Paste-to-parse
      (paste messy text → AI fills template)
- [ ] RAG on Stack Memory
      (query your entries + docs)
- [ ] Entry improvement suggestions
      ("This Bug Autopsy is missing a
       root cause — want help writing one?")

## 📱 MOBILE
Status: Unknown — not tested in screenshots

- [ ] Responsive feed layout
- [ ] Mobile sidebar (hamburger menu)
- [ ] Mobile profile page
- [ ] Mobile vault page
- [ ] Touch-friendly reaction picker