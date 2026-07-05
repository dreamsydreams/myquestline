# Questline — Phase Roadmap & Progress Log

This file exists so work can resume cleanly in a new session if needed.
If you're picking this up fresh: upload this file + the Questline Bible
books to Claude, and say "continue from Phase X per this roadmap."

Stack: React + TypeScript + Vite + Tailwind v4, deployed to Netlify as a
static site with Netlify Functions available for later serverless needs.
Zero paid services used anywhere.

---

## ✅ PHASE 1 — App Shell (DONE)

**Bible refs:** Book VI Ch.2 (the Camp), Book I Ch.9 (language system)

**Built:**
- `src/constants/language.ts` — single source of truth for every in-world
  term (Dashboard→Camp, Settings→Backpack, etc.) plus Book III Ch.5's
  banned-phrase table. All other files must import terms from here.
- `src/screens/Camp.tsx` — home screen. Shows current Chapter + today's
  Missions only, per Book VI Ch.2's "never a wall of stats" rule. Has a
  distinct new-player state (routes to Intake) that is NOT the same as the
  Book IX Ch.3 empty-camp state (that one's Phase 5, for players *with*
  history but no active campaign).
- `src/components/Navigation.tsx` — nav using only in-world terms.
- `src/components/DevTestPanel.tsx` — dev-only test harness, visually
  distinct from real UI on purpose (not player-facing).

**Design decisions locked in (all in `src/index.css`):**
- Palette: "Midnight Ember" — near-black base (`#14121a`), warm amber
  accent (`#e8a355`) for earned/CTA elements. Chosen over a cooler
  "Slate & Copper" alternative because Book I/II's Relics-and-Lore framing
  is explicitly firelight-coded.
- Five Attribute colors already defined as theme tokens, ready for Phase 4:
  `--color-attr-discipline` (blue), `-craft` (amber), `-confidence`
  (coral), `-network` (violet), `-resilience` (green).
- Fonts: **Cinzel** (display — Chapter titles, Boss Battle names,
  Celebration moments) + **Manrope** (body — everything else, for
  accessibility/legibility per Book VI Ch.7). Loaded via Google Fonts in
  `index.html`.
- Micro-interactions (Book VI Ch.4): small "pop" animation on mission
  check-off, tactile press feedback (`active:scale-95`) on all buttons.
  Explicitly calibrated small/routine — the big Chapter Completion
  animation is deliberately saved for Phase 5, not built early.

---

## ✅ PHASE 2 — Intake (DONE)

**Bible refs:** Book II Ch.2 (Intake), Book VIII Ch.2/3 (minimal safety stub)

**Built:**
- `src/screens/Intake.tsx` — real conversational flow: objective → time
  availability → experience → constraint → confirmation. Each question
  references the previous answer. Confirmation step is a hard gate —
  Book II Ch.2 forbids generating anything without restating the objective
  back for a real "yes" first.
- `src/safety/crisisDetection.ts` — **flagged decision:** the build
  sequence puts full Safety at Phase 6, but Book VIII itself says minimal
  protection must exist from day one on any real free-text surface. This
  is a keyword-based stub, explicitly documented as NOT the real detection
  system — Phase 6 replaces it properly.
- `src/components/CrisisResponse.tsx` — Book VIII Ch.3 protocol: drops all
  game framing/fonts, responds as a plain human, surfaces real crisis
  resources (988, Crisis Text Line, findahelpline.com for international),
  never forces the player back into the flow that triggered it.
- `src/components/ThinkingScreen.tsx` — shared brief-pause component using
  the loading language from `constants/language.ts`.

**Known limitation (stated honestly, not hidden):** "Let me start over" on
the confirm step wipes all answers and restarts from question one — no
per-field editing yet.

---

## ✅ PHASE 3 — Campaign Data Model + Generation Engine (DONE)

**Bible refs:** Book II Ch.1 (hierarchy), Ch.3 (branching paths), Ch.4
(Boss Battles/Enemies), Ch.5 (attributes/XP), Ch.7 (pacing), Ch.9
(generation pipeline), Book IV Ch.3 (honest MVP evidence rules)

**Built:**
- `src/types/campaign.ts` — full five-layer model: Objective → Campaign →
  Chapter → Quest → Mission, plus BossBattle and Enemy. Chapters carry a
  `pacingPhase` (spark/plateau/final-ascent, Book II Ch.7) separate from
  their player-facing identity name (Book II Ch.1).
- `src/engine/campaignGenerationEngine.ts` — the actual Ch.9 pipeline as a
  `GenerationEngine` interface + `StubGenerationEngine` implementation.
  **Key decision, flagged clearly in code comments:** Book II Ch.3's own
  example text uses a fabricated statistic ("84 technology founders") —
  Book IV Ch.3 explicitly names that *exact* style as the thing never to
  fake at MVP stage. So the stub keeps Ch.3's presentation format (path
  cards, Evidence Strength labels) but never invents numbers. Evidence
  Strength is honestly qualitative until real data exists.
  When there's API budget: swap the one exported `campaignGenerationEngine`
  constant for a `LiveGenerationEngine` implementing the same interface —
  nothing else in the app needs to change.
- `src/screens/PathSelection.tsx` — Book II Ch.3/Ch.9-step-4 path picker.
  Never fewer than 2 paths, never a single "best" ranking number, Personal
  Fit always shown as "unknown yet" until a path is actually chosen.

**Known limitation:** chapter/quest/mission content is hand-templated per
path family (filmmaker, "build wealth" reuse the Bible's own worked
examples; everything else gets an honest generic fallback) — not yet
dynamically generated from real evidence retrieval, since that requires
either a real AI call or a real curated case-study dataset, neither of
which exist yet.

**Update (personalization pass, still zero-cost, still no AI):** the old
static `GENERIC_PATHS` fallback array is gone. Every objective outside the
two curated domains now goes through `buildArchetypePaths` +
`buildArchetypeChapterTemplates`, which extract the player's own objective
wording (`extractActionPhrase`) and weave it — along with their stated
experience, constraint, and time availability — into path names, chapter
essences, quest titles, and mission titles via string interpolation.
**This is word-weaving, not reasoning.** It guarantees no two players with
different objectives/constraints see identical, obviously-templated text.
It does NOT give the engine real domain expertise for arbitrary goals — a
"become a beekeeper" objective still gets the same Spark/Plateau/Final
Ascent structure as anything else, just with "become a beekeeper" and the
player's real constraint threaded through it. Closing that remaining gap
for real still requires either a live AI call or a real curated
case-study dataset — same two options as before, still deliberately
deferred, same reasoning as above.

**Update (curated-path gap closed):** the six remaining curated path ids
(documentary, narrative, festival-circuit, investor, creator, operator)
now have hand-authored chapter content in `CURATED_CHAPTER_TEMPLATES`,
matching the depth of the original `freelance-editing`/`builder` entries.
All eight curated path cards across both domains now have real chapters
behind them — none fall through to the word-weaving logic anymore. That
logic is now reserved solely for objectives outside the two curated
domains, exactly as originally intended. Verified by running all eight
paths end-to-end and confirming distinct, non-generic chapter/quest/boss
content for each.

---

## ✅ PHASE 4 — Character Sheet / Attributes System (DONE)

**Bible refs:** Book II Ch.5 (XP, Attributes & Leveling), Book VI Ch.3
(Character Sheet screen design)

**Built:**
- `src/engine/attributeTracking.ts` — the real computation layer. Walks a
  full `Campaign` object (all chapters, not just the active one) to
  produce per-attribute XP totals and a growth-event log. Boss Battle
  defeats feed Confidence specifically (Book II Ch.5), at a flat, honestly
  calibrated amount — never inflated for excitement.
- `src/screens/CharacterSheet.tsx` — five attributes, each with its own
  icon + color (using the tokens defined back in Phase 1), a numeric XP
  label alongside every bar (never color-only, per Book VI Ch.7), and a
  small per-attribute growth sparkline.
- Real callback generation (Book VI Ch.3's explicit requirement): surfaces
  a specific sentence like "Your Confidence grew most during Chapter 1:
  The Apprentice — right when you faced the Boss Battle: The Blank
  Timeline" — built from real data in the campaign, never invented.
- Added a Boss Battle section to the Camp screen itself (Book II Ch.4) —
  this didn't actually exist yet after Phase 3, which meant Boss Battles
  could never actually be defeated. Fixed as part of this phase since
  Confidence growth is meaningless without it.
- Refactored `App.tsx` so a full `Campaign` object (not just a single
  Chapter) is the real source of truth — needed so the Character Sheet can
  see growth across chapters, not just the currently active one.

**Known limitation, stated honestly:** all of this is in-memory only.
"Growth over time" is real within a session but resets on page refresh —
there's no backend yet (Supabase/Firebase, allowed by the project's
zero-budget constraints, hasn't been wired up). Real persistence is future
work, not solved in Phase 4.

---

## ✅ PHASE 5 — Chapter Completion Ceremony + Empty Camp State (DONE)

**Bible refs:** Book I Ch.10 (celebration), Book III Ch.7 (ceremony
voice), Book IX Ch.3 (full implementation spec — used exactly, not
improvised)

**Built:**
- `src/screens/ChapterCompletion.tsx` — the actual Chapter Completion
  ceremony. Full-screen, distinct animation (`animate-ceremony-rise` /
  `animate-ceremony-glow` in `src/index.css`) deliberately bigger and
  slower than Phase 1's small `mission-pop`. Every line is built from real
  data for that specific Chapter (its own essence, its actual Boss Battle
  if any, real attribute XP earned) — no bare "Congratulations!" or
  templated cheer, per Book III Ch.5's banned-phrase table.
- Chapter-completion detection wired into `App.tsx`
  (`isChapterFullyComplete` / `applyChapterUpdate`): a Chapter is done when
  every Mission is complete and its Boss Battle (if any) is defeated.
  Fires the ceremony the instant that becomes true, then either advances
  to the next Chapter or, if it was the last one, retires the campaign
  into history.
- Also fixed while wiring this: `Quest.isComplete` is now actually
  recomputed from its Missions (`withRecomputedQuestCompletion`) — this
  field existed in the Phase 3 data model but nothing ever set it.
- `src/screens/Camp.tsx`'s new `BetweenCampaignsCamp` — Book IX Ch.3's
  Empty Camp State, copy and button labels used verbatim from the Bible's
  own implementation spec. Triggers on `PlayerCampState: 'between-campaigns'`
  (`currentCampaign === null` AND `campaignHistory.length > 0`), calm tone,
  no urgency styling, references the most recently completed campaign by
  name, and offers only the two spec'd buttons — nothing auto-generated.
- "Open Your Archive" routes to an honest placeholder (`TERMS.archive`
  added to `language.ts`, reuses `ComingSoon`) — Book IX Ch.2's real
  Archive is still deliberately deferred, not silently built early just
  because the button needed somewhere to go.

**Persistence fix (was Phase 4's stated limitation):**
- `src/lib/persistence.ts` — real localStorage-backed persistence.
  `currentCampaign`, `currentChapterIndex`, and `campaignHistory` now
  survive a page refresh or closed tab. Still zero paid services, still
  no backend account system.
- Honest limitation stated plainly in that file: this is single-device,
  single-browser storage. It won't follow a player to a new phone or
  browser — that needs a real account + backend, a future phase, not
  solved here. Also won't survive the player clearing site data, same as
  any local-only app.

**Dev panel additions (not player-facing):**
- "finish current chapter now" — instantly completes the active Chapter
  to test the ceremony without manually checking off every Mission.
- "simulate whole campaign done" — retires the mock campaign into history
  immediately, to test the Empty Camp State without playing through two
  full Chapters first.
- "reset all" now also clears the persisted localStorage save, not just
  in-memory state.

---

## ✅ PHASE 6 — Safety Layer (Full Build) (DONE)

**Bible refs:** Book VIII, all chapters

**Built:**
- `src/safety/crisisDetection.ts` — replaces the Phase 2 flat keyword
  stub. **Key decision, flagged clearly in code comments:** Book VIII
  Ch.2's Future Questions ask whether detection should be keyword-based,
  model-based, or hybrid. The honest answer at this project's stage is
  still pattern-based, not model-based — a real classifier means sending
  player text to an LLM API, which is a genuine per-call cost and would
  quietly violate this project's "zero paid services" constraint if added
  without a deliberate decision to change that constraint first. What did
  improve: word-boundary regex (no more accidental substring false
  positives), three categories matching Ch.2's own language (self-harm/
  suicide, hopelessness, abuse-or-acute-crisis) instead of one flat
  suicide-only list, and full-text scanning so a disclosure embedded
  inside a goal-shaped sentence still gets caught. `detectCrisisSignal` is
  the one function every caller uses, so a future Netlify Function-backed
  model classifier could swap in behind the same return shape later.
- `src/safety/harmfulObjectiveDetection.ts` — new module for Book VIII
  Ch.4, genuinely separate from crisis detection: this is about which
  stated Objectives are eligible for a real Campaign at all (harm-to-
  another-person, illegal/violent framing, self-destructive "no matter
  what" framing), not about the player's immediate wellbeing. Explicitly
  documented as a heuristic starting policy, not the "maintained, concrete
  policy" Ch.4 says this ultimately needs — Ch.4's own edge case ("become
  the best in my industry even if it means outcompeting people I know")
  is exactly the kind of thing a static regex list can't fully resolve.
- `src/components/ObjectiveDeclineResponse.tsx` — Ch.4's prescribed tone,
  deliberately different from the crisis protocol: an honest redirection
  in a still-warm voice, not a cold refusal and not a full drop of game
  framing (that's specifically reserved for Ch.3's crisis protocol).
  Offers a real path to try a different Objective, never a way to push
  the declined one through relabeled.
- Intake wiring: the Ch.4 check now runs on the Objective at submission
  *and* again at the Ch.2 confirm-step hard gate, right before a real
  Campaign would get built — cheap defense in depth per Ch.8's "standing
  constraint" framing, not just a single early pass trusted forever.
- `src/safety/safetyLog.ts` — Ch.7's logging/escalation design. Honestly
  scoped: at this project's actual current stage (solo builder, static
  site, no backend), the "clear, if manual, process for a human to
  review flagged edge cases" Ch.7 asks for genuinely is a person opening
  the Dev Test Panel's new "view safety log" button and reading entries —
  documented in code as the honest minimum for exactly one person
  building this alone, and explicitly NOT sufficient once there's a real
  user base or more than one person involved (that's Ch.7's own escalation
  point, not solved here). **Privacy decision:** the log stores category +
  Intake step + timestamp only, never the player's raw disclosed text —
  reviewing categories/frequencies is enough to catch systemic detection
  gaps without retaining sensitive content in an unencrypted, access-
  control-free, single-device localStorage log.
- `src/safety/regionHint.ts` + updated `CrisisResponse.tsx` — re-reviewed
  the previously-flagged US-centric resource list. Uses a best-effort,
  zero-cost, browser-timezone-based guess (`Intl.DateTimeFormat`) to
  surface a possibly more relevant local helpline line. Explicitly NOT
  real geolocation — stated plainly in code — and designed so a wrong
  guess never hides a resource: the US default and the international
  findahelpline.com directory are always shown regardless of the guess.
- `src/components/SafetyLogViewer.tsx` + three new Dev Test Panel buttons
  — preview the crisis response and objective-decline screens directly,
  and view/clear the local safety log, all without needing to type a real
  trigger phrase into Intake each time.
- Free-text surface audit (the roadmap's "extend the gate to Phases 4-5"
  item): checked every screen added since Phase 2 — Character Sheet,
  Chapter Completion, PathSelection, ComingSoon. None added a new
  free-text input surface, so there was nothing to extend the gate to.
  Recorded here so this doesn't need re-auditing from scratch if a future
  phase adds one — the next free-text field anywhere in the app should
  run through `detectCrisisSignal` (and, if it's a stated goal,
  `detectHarmfulObjective`) the same way Intake does.

**Cleanup:** removed `src/lib/safetyGate.ts`, a duplicate safety module
from an earlier session that was never actually wired into anything
(Intake only ever imported from `src/safety/crisisDetection.ts`). Its
ideas were folded into the real modules above rather than left as dead,
confusing parallel code.

**Known limitations (stated honestly, not hidden):**
- Detection is still pattern-based, not model-based — see the design
  decision above. Real false negatives and false positives will happen;
  Ch.2's own rule (ambiguity defaults to treating it as a real disclosure)
  is followed, but that doesn't make the underlying patterns complete.
- The harmful-objective policy is a heuristic starting point, not the
  maintained policy Ch.4 asks for — needs real human review and iteration
  before this is trustworthy at scale.
- The safety log is local-only, unencrypted, single-browser, with zero
  access control — adequate for exactly one solo builder reviewing their
  own test data, not for any real user base. That's Ch.7's own escalation
  trigger for when the team grows, not a gap this phase pretends to close.
- The region hint is a timezone guess, not real geolocation, and will be
  wrong for travelers, VPN users, and shared devices — by design it only
  ever adds a possibly-relevant line, never removes a resource.
- Book VIII Ch.5 (life advice vs. licensed practice) and Ch.6 (age/
  vulnerability) are not addressed by this phase — they weren't in this
  phase's original scope per the roadmap, and are worth their own
  deliberate pass rather than folding in unannounced here.

---

## After Phase 6

That's the full originally-scoped MVP. Anything from Book IX (veteran
players, the Archive, the social layer decision) is explicitly *not* in
the original build sequence — worth a deliberate conversation before
picking it up, not an assumed Phase 7.

---

## PATCH — Real-Player Feedback Pass (post-Phase 6)

Not a numbered phase — a fix pass from actual usage of the deployed app,
not a new Bible chapter. Recorded here for the same reason every other
phase is: so a fresh session can see what changed and why.

**Fixed bugs (not design choices):**
- **Today was empty for every Chapter after the first.** `Chapter
  .missionsToday` was a value generated once, at campaign-creation time,
  and the generation engine only ever filled it in for Chapter 1
  (`index === 0 ? ... : []`). Nothing recomputed it as the player advanced
  — Chapter 2 onward silently showed a blank Today section forever. Fixed
  by deleting `missionsToday` as stored data entirely and computing it
  live from `Chapter.quests` (new `src/engine/missionsToday.ts`) —there's
  now only one source of truth, so this class of staleness bug can't
  recur. Camp now also shows an honest empty state ("Nothing left to
  check off — the Boss Battle is what's left") instead of a blank section
  once a Chapter's Quests are actually all done.
- **Voice input cut off mid-sentence.** `useSpeechToText` had
  `continuous = false`, which tells the browser to stop the instant it
  detects any pause in speech — a normal breath or thinking pause got
  treated as "done talking." Fixed with `continuous = true` +
  auto-restart on the browser's own early `onend` (a known Chrome quirk),
  plus an explicit, visible 60-second max-duration countdown so any real
  cutoff is predictable instead of a silent surprise.
- **Long objectives were unreadable.** `PathSelection.tsx` rendered the
  full objective as a single giant Cinzel `h1` — Cinzel's letterforms
  read as all-caps at any length, and a multi-paragraph objective in that
  treatment was genuinely hard to read (a real player didn't finish
  reading their own text back). Fixed: normal-weight sentence-case card
  with a 220-character preview and an explicit "Show full objective"
  toggle. The same raw-objective-embedded-in-a-sentence risk existed in
  the new relevance text below and in JourneyReveal — both now truncate
  long objective phrases before interpolating them into a sentence.

**New, on top of Phase 6:**
- **Boss Battle is now gated.** "Face It" was clickable at any time, even
  with the Chapter's Missions untouched — a player could defeat a Boss
  Battle representing progress they hadn't actually made. Now disabled
  until every Mission in the Chapter is complete, with a visible reason
  when it's not yet available.
- **"Why this matters."** Real feedback: Missions and the Boss Battle
  read as arbitrary checkboxes with no visible tie back to the objective
  the player actually typed. `campaignGenerationEngine.ts` now generates
  a short relevance sentence for the active Quest and for the Boss Battle
  (`Mission.whyItMatters` / `BossBattle.whyItMatters`), shown once under
  Today (not repeated per-row) and under the Boss Battle description.
  Same zero-AI template-interpolation approach as the rest of the engine
  — it doesn't add real reasoning about why a specific task matters, but
  it does guarantee every Mission and Boss Battle visibly names the
  player's own goal instead of floating with no stated connection at all.
- **`src/screens/JourneyReveal.tsx`** — new screen between choosing a
  Path and landing in Camp. Two beats, advanced with an explicit tap:
  "This is you" (the chosen Path, Attributes starting at zero) and "This
  is your path laid out" (every Chapter as a node on a trail, tap to
  preview, Chapter 1 unlocked and the rest visibly ahead — nothing
  hidden, since the full Campaign already exists at generation time).
  Ends on "Begin Chapter 1," which is the only thing that actually lands
  the player in live Camp gameplay.
- **A way back to Camp, always.** There was previously no exit from
  Intake or Path Selection short of closing the tab. Both screens (and
  JourneyReveal) now carry a small "← Camp" link at all times.

**Known limitations, stated honestly:**
- `whyItMatters` text is shared across every Mission in the same Quest
  (they're generated together) — real per-Mission specificity would need
  actual reasoning about the task, which this zero-AI engine still can't
  do.
- JourneyReveal's Path Map shows Chapters 2+ as locked/greyed but doesn't
  yet let the player preview a locked Chapter's Missions or Boss Battle
  detail beyond the one-line essence — deliberate, to avoid spoiling the
  Boss Battle's framing before the player actually reaches it, but worth
  a real design decision later rather than an assumed default.
- The voice-input max duration (60s) is a single fixed constant, not
  configurable per field — fine for Intake's short answers, would need
  revisiting if a much longer free-text surface is ever added.

---

## PATCH — Avatar, Backpack, and Map (post-Phase 6)

Direct player feedback: "do they get an avatar?" (JourneyReveal's "This is
you" beat was a placeholder compass emoji, not a real character) and "why
are Map and Backpack empty?" (both were `ComingSoon` stubs since Phase 1,
never actually scoped by any phase). Not a Bible-mandated phase — a real
design gap closed based on what was asked for directly.

**Avatar (Book VI's zero-art-budget constraint applies here too):**
- `src/types/avatar.ts` + `src/components/AvatarSVG.tsx` — a simple,
  fully customizable SVG stick figure (skin tone, hair style/color, outfit
  color, accessory). No illustrated character, no external image assets —
  same honest-MVP calibration as the rest of the engine: a real, working
  customization system at the scale actually buildable with zero art
  budget, not a fake version dressed up bigger than it is.
- Persists independently of any Campaign (`playerProfile` in
  `lib/persistence.ts`, version bumped to 2). Shown in three places: the
  Backpack's new Gear tab (where it's customized), the Character Sheet
  header, and JourneyReveal's "This is you" beat (replacing the compass
  emoji directly).

**Backpack** (`src/screens/Backpack.tsx`) — three tabs:
- **Gear** — the avatar customizer described above.
- **Relics** (`src/engine/relics.ts`, Book II Ch.6) — real achievements
  derived from actual campaign data: one relic per defeated Boss Battle,
  one per completed Chapter, and a visually distinct "legendary" tier for
  full Campaign completions (answering Ch.6's own Future Question about a
  legendary tier). Never fabricates trivial relics — no login-streak
  badges, nothing not tied to something that actually happened.
- **Settings** — genuinely minimal, honest about what this project
  actually has to configure: an explanation of the local-only save, and a
  real "Reset all progress" control with respectful, honest confirmation
  copy (not the banned-phrase table's guilt-trap "Are you sure?" pattern).

**Map** (`src/screens/Map.tsx`) — the persistent, live version of the
trail JourneyReveal shows once at Campaign start. Same visual language
(done/current/locked stops, tap to preview), but reachable any time from
the nav and always reflecting real current progress, including a
completed-trail view when browsing the most recent finished Campaign from
the Empty Camp State.

**Known limitation, stated honestly and flagged directly to the user:**
the player asked for "visual branches" on the Map. The actual data model
(Book II Ch.3) has a Path chosen once, at generation time — there is no
mid-Campaign branching to visualize for real. This renders the true
linear trail being walked, not an invented branching tree. If branching
paths are ever added to the underlying generation engine, `Map.tsx` is
where a real branch visualization would go — not before, and not faked
in the meantime.

---

## PATCH — Re-Forging and Abandon Quest (post-Phase 6)

Direct player question: once you've started a Campaign, is there any way
back — to go home, to change course, to walk back to an earlier point on
the trail, to start over somewhere else? Answer at the time: navigation
and autosave both already worked, but there was genuinely no way to leave
a Campaign once begun short of finishing it. "Abandon Quest" existed as a
defined term in `constants/language.ts` (Book I Ch.9) but wasn't wired to
anything. Not a Bible-mandated phase — a real product gap, closed on
request.

**Re-Forging** (`src/screens/ReForge.tsx`, Book II Ch.8) — "the path
bends; it does not break." Reachable from the Backpack's Settings tab
while a Campaign is active. A single form, pre-filled from the Campaign's
own `sourceIntake` (new required field on `Campaign` — every generated
Campaign now keeps the Intake answers that produced it, so Re-Forging
never asks a player to redo Intake from a blank slate). Submitting shows
an explicit, honest before/after: exactly which Chapters stay untouched
versus which reshape around the update, before anything is applied.

**The concrete rule this project uses** for Ch.8's own open Future
Question ("how much of a Chapter needs to be regenerated versus adjusted
in place?"): every Chapter at or before the one currently in progress is
left completely untouched — same Missions, same completion state, same
earned XP. Only Chapters strictly after the current one, not yet started,
get regenerated. This is deliberately conservative: it guarantees zero
XP/Attribute/Relic loss with no exceptions, at the honest cost that a
mid-Chapter circumstance change won't reshape that specific Chapter until
the next one. `engine/campaignGenerationEngine.ts`'s new
`reforgeCampaign` re-runs the same zero-AI personalization pipeline
Phase 3+ already uses — no new fabrication risk introduced.

Re-Forge's new free-text fields (Objective, experience, constraint) run
through the exact same Book VIII safety gate as Intake — `detectCrisisSignal`
and `detectHarmfulObjective`, logged the same way. Every free-text surface
in this app gets this gate; this was a new one, so it was wired in, not
assumed safe by default.

**Abandon Quest** (`src/screens/AbandonQuest.tsx`, Book I Ch.9 term, Book
IX Ch.2 framing) — deliberately NOT a single "Are you sure you want to
quit?" dialog, which Book III Ch.5's own banned-phrase table names
explicitly as a guilt-trap dark pattern. Two real screens instead:

1. **Reflect** — shows real numbers (Chapters finished, XP earned, Relics
   collected, computed live from the actual Campaign, nothing fabricated)
   so the choice is informed, not blind. Three genuine options: sit with
   it longer (back to Camp, nothing happens), Re-Forge instead, or
   proceed.
2. **Confirm** — states plainly what actually happens: nothing deleted,
   XP/Attributes/Relics untouched, the Campaign moves to history honestly
   marked as abandoned rather than completed (`Campaign.abandonedAt`, a
   field kept strictly separate from `completedAt` — Book IX Ch.2 wants a
   future Archive able to tell "finished" and "let go" apart, and Book I's
   no-guilt promise means an abandoned Campaign is never quietly
   relabeled as a success).

The Empty Camp State (Book IX Ch.3) now checks which of the two happened:
an abandoned Campaign gets its own honest copy ("You set that one down —
and that's alright") rather than reusing the completed-Campaign "real
summit" language the original spec was written for.

**Where the entry points live:** both are in the Backpack's Settings tab,
under a new "This Campaign" section shown only while a Campaign is
active. The existing "Reset all progress" control now explicitly
clarifies how it differs from Abandon Quest (Reset wipes the entire save,
including history and Relics; Abandon retires only the current Campaign
and keeps everything else).

**Known limitation, stated honestly:** true mid-Chapter Re-Forging (
reshaping the Missions still ahead of you within the Chapter you're
currently on, not just future Chapters) isn't built — it would require
reconciling a mix of old and new Mission objects inside one Chapter,
which is real design work, not something to improvise silently inside
this patch.

---

## PATCH — Re-Forge Reveal + Abandon copy fix (post-Phase 6)

Follow-up review of the Re-Forging/Abandon patch above, done via close code
reading rather than a live browser session (no network access in that
session to install deps / run a dev server or Playwright — noted here so a
future session doesn't assume this was visually verified when it wasn't).

**Fixed:**
- **Abandon Quest's reflect screen read oddly at zero progress.** A
  Campaign abandoned minutes after starting showed "0 Chapters finished,
  0 XP earned, 0 Relics collected... All of it is genuinely yours" — the
  wording was written for a Campaign with real progress and didn't hold up
  at zero. `AbandonQuest.tsx` now branches: when Chapters/XP/Relics are all
  zero, it shows honest zero-case copy instead of stretching the
  real-progress phrasing to cover nothing.
- **Re-Forging a future Chapter happened silently.** A Re-Forge that
  actually regenerated Chapters ahead used to drop the player straight back
  into Camp with no moment marking that the trail had changed — a real gap
  given how much weight this project puts on ceremony (ChapterCompletion,
  JourneyReveal already exist for exactly this reason). New
  `src/screens/ReForgeReveal.tsx` sits between confirming a Re-Forge and
  landing in Camp: shows the trail with reshaped Chapters marked distinctly
  from untouched ones, reusing the same `animate-ceremony-rise/-glow`
  vocabulary already established rather than inventing a new one. Handles
  the "already on the last Chapter" case with its own short message instead
  of an empty trail. `App.tsx`'s `handleReForgeSubmit` now routes to
  `'reforge-reveal'` instead of `'camp'` directly.

**Checked, no change made:** whether the Re-Forge confirm screen's "nothing
left to reshape" copy (last-Chapter branch) holds up visually — it's a
plain wrapping paragraph in the same box as the normal case, not a
special layout path, so there's no code-level reason to expect a visual
break. Not confirmed by eye in a real browser.

**Explicitly left as an open decision, not resolved here:** whether
Re-Forge should ever be allowed to touch the Chapter currently in progress
instead of always protecting it. Always-protect is safer (never yanks
progress out from under active work) but less flexible (no way to reshape
a Chapter you're mid-way through and now want changed). This is the same
tradeoff already named in this file's "true mid-Chapter Re-Forging" known
limitation above — restating it here as a live decision for a human to
make, not something a future session should default one way on its own.

**Dev panel additions (not player-facing):**
- "re-forge on final chapter" — loads `MOCK_CAMPAIGN` (already on its last
  Chapter) straight into the Re-Forge form, to reach the "nothing left to
  reshape" confirm branch in one click.
- "abandon w/ zero stats" — new `FRESH_CAMPAIGN` fixture
  (`src/data/mockPlayerState.ts`), a Campaign with nothing completed and
  zero XP/Relics, loaded straight into Abandon Quest's reflect screen.

**Still needs doing:** an actual visual pass in a real browser (or at
minimum `tsc -b` / `npm run build`) once there's network access to install
dependencies — nothing in this patch has been confirmed by anything other
than reading the code.

---

