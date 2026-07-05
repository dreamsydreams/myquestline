import type { IntakeAnswers } from '../types/intake';
import type {
  Campaign,
  Chapter,
  EvidencePath,
  Mission,
  Quest,
  BossBattle,
  AttributeKey,
} from '../types/campaign';

/**
 * Source: Book II, Chapter 9 — "The Campaign Generation Engine"
 *
 * This file is the whole pipeline described in Ch.9, steps 2-8:
 *   2. Evidence Retrieval
 *   3. Path Generation
 *   5. Personal Fit Scoring (once a path is chosen)
 *   6. Structural Generation (Chapters -> Quests -> Missions -> Boss Battles)
 *   7. Pacing Pass (Spark / Plateau / Final Ascent)
 *   8. Reward Mapping (XP + Attributes)
 *
 * Step 1 (Intake) already happened by the time this is called. Step 4
 * (Player Selection) and step 9 (Delivery) live in the UI layer, not here.
 *
 * ============================================================================
 * WHY THIS IS AN INTERFACE, NOT JUST A FUNCTION:
 * Zero budget right now means no real AI calls. `StubGenerationEngine` below
 * is realistic template + word-weaving logic standing in for the real thing.
 * When there's budget for the Claude API, a `LiveGenerationEngine` class
 * implementing the exact same `GenerationEngine` interface can be dropped
 * in — swap one constant in this file, and nothing elsewhere in the app
 * needs to change.
 * ============================================================================
 *
 * HONEST MVP CALIBRATION (Book IV, Ch.3 — this is the important part):
 * Book II Ch.3's own example format shows evidence like "Based on analysis
 * of 84 technology founders..." — Book IV Ch.3 explicitly names that exact
 * style of claim ("a fabricated '84 founders' claim with nothing behind it")
 * as the thing to never do at MVP stage. So this stub keeps Book II Ch.3's
 * *presentation format* (path cards, qualitative Evidence Strength) but
 * never invents a specific number. Evidence strength here is an honest,
 * qualitative placeholder — not yet backed by a real curated case-study
 * set, which is real future work, not something to fake now.
 *
 * PERSONALIZATION LAYER (added this pass, still zero-cost, still no AI):
 * The two curated domains (filmmaker, "build wealth") keep reusing the
 * Bible's own worked examples unchanged — that content is already real.
 * Everywhere else, instead of one fixed "honest generic fallback," the
 * engine now extracts the player's own objective phrasing plus their
 * intake answers (experience, constraint, time availability) and weaves
 * them directly into path names, chapter essences, quest titles, and
 * mission titles via templated interpolation ("mail-merge," not
 * reasoning). This does NOT give the engine real domain expertise for
 * arbitrary goals — it still has no idea what a good first step in, say,
 * beekeeping actually is. What it does do: guarantee no two players with
 * different objectives/constraints see identical, obviously-templated
 * text. That's a real, honest improvement over a static fallback; it is
 * not the same thing as the live AI generation this project would need
 * for genuine per-domain reasoning, and the code should never be read as
 * claiming otherwise.
 *
 * RE-FORGING (Book II, Ch.8, added this pass): `reforgeCampaign` re-runs
 * the same path-and-chapter generation used above, but only for Chapters
 * the player hasn't reached yet — see that method's own doc comment for
 * the exact, concrete rule used to guarantee zero XP/progress loss.
 */

export interface GenerationEngine {
  generatePaths(intake: IntakeAnswers): Promise<EvidencePath[]>;
  buildCampaign(intake: IntakeAnswers, chosenPath: EvidencePath): Promise<Campaign>;
  /**
   * Source: Book II, Chapter 8 — "Re-Forging: When Life Changes."
   * Re-enters the pipeline at steps 5-6 (Personal Fit + Structural
   * Generation) using updated Intake answers, WITHOUT discarding what's
   * already been built or earned. See the implementation below for the
   * exact, concrete rule this project uses to satisfy Ch.8's own open
   * Future Question about how much of a Chapter gets regenerated.
   */
  reforgeCampaign(
    campaign: Campaign,
    updatedIntake: IntakeAnswers,
    currentChapterIndex: number
  ): Promise<Campaign>;
}

// ---------------------------------------------------------------------------
// Path templates. Filmmaker and "build wealth" paths reuse the Bible's own
// worked examples (Book II Ch.3) directly — untouched by this pass.
// Everything else is now generated per-player by buildArchetypePaths below,
// not pulled from a fixed array.
// ---------------------------------------------------------------------------

type PathTemplate = Omit<EvidencePath, 'personalFit'>;

const FILMMAKER_PATHS: PathTemplate[] = [
  {
    id: 'documentary',
    name: 'The Documentarian',
    evidenceStrength: 'moderate',
    description:
      'Grounded in real stories — building a portfolio through nonfiction work first, then expanding from there.',
  },
  {
    id: 'narrative',
    name: 'The Narrative Path',
    evidenceStrength: 'moderate',
    description:
      'Scripted storytelling — shorts first, then features, built around craft and finding the right collaborators.',
  },
  {
    id: 'freelance-editing',
    name: 'The Freelance-Editing-First Path',
    evidenceStrength: 'strong',
    description:
      'Paid editing work builds income and industry relationships while your own films get made on the side.',
  },
  {
    id: 'festival-circuit',
    name: 'The Festival Circuit',
    evidenceStrength: 'emerging',
    description:
      'Built around festival submissions and recognition as the primary route to opportunity — higher variance, real upside.',
  },
];

const WEALTH_PATHS: PathTemplate[] = [
  {
    id: 'builder',
    name: 'The Builder',
    evidenceStrength: 'strong',
    description: 'Starting and growing your own business or product from the ground up.',
  },
  {
    id: 'investor',
    name: 'The Investor',
    evidenceStrength: 'strong',
    description: 'Building wealth primarily through capital allocation rather than operating a business day to day.',
  },
  {
    id: 'creator',
    name: 'The Creator',
    evidenceStrength: 'moderate',
    description: 'Building an audience and owning creative work as the core economic engine.',
  },
  {
    id: 'operator',
    name: 'The Operator',
    evidenceStrength: 'moderate',
    description: 'Rising through operating roles inside growing companies rather than founding one yourself.',
  },
];

// ---------------------------------------------------------------------------
// Word-weaving helpers. Deliberately simple string heuristics, not NLP —
// flagged honestly rather than dressed up as smarter than they are.
// ---------------------------------------------------------------------------

const FILLER_PREFIXES: RegExp[] = [
  /^i want to\s+/i,
  /^i wanna\s+/i,
  /^i'd like to\s+/i,
  /^i would like to\s+/i,
  /^i need to\s+/i,
  /^i am trying to\s+/i,
  /^i'm trying to\s+/i,
  /^my goal is to\s+/i,
  /^my goal is\s+/i,
  /^my objective is to\s+/i,
  /^my objective is\s+/i,
  /^help me\s+/i,
];

/** Strips conversational filler ("I want to...") so what's left reads
 * naturally after "Path to..." regardless of whether the player typed a
 * verb phrase ("become a better speaker") or a bare noun phrase
 * ("public speaking") — both work grammatically after "Path to". */
function extractActionPhrase(objective: string): string {
  let phrase = objective.trim();
  for (const pattern of FILLER_PREFIXES) {
    phrase = phrase.replace(pattern, '');
  }
  phrase = phrase.replace(/[.!?]+$/, '').trim();
  return phrase.length > 0 ? phrase : objective.trim();
}

function titleCase(phrase: string): string {
  const smallWords = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'with', 'at', 'by']);
  return phrase
    .split(' ')
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i !== 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function lowerFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Prepares a player's free-text intake answer (experience/constraint) for
 * embedding mid-sentence: strips trailing punctuation so it doesn't collide
 * with the sentence being built around it, and — unlike lowerFirst — leaves
 * a leading pronoun "I" capitalized ("I get anxious..." not "i get
 * anxious..."), since lowercasing that specifically reads as a typo rather
 * than natural sentence flow. */
function cleanClauseForEmbedding(text: string): string {
  const clean = text.trim().replace(/[.!?]+$/, '');
  if (/^I(\s|'|$)/.test(clean)) {
    return clean;
  }
  return lowerFirst(clean);
}

function matchesKeywords(objective: string, keywords: string[]): boolean {
  const lower = objective.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/**
 * UX-FIX: a real player reported that Missions and Boss Battles read as
 * arbitrary checkboxes with no visible tie back to the goal they actually
 * typed in — a genuine gap, not a misunderstanding. Same zero-AI, template-
 * interpolation approach already used elsewhere in this file: these don't
 * add real reasoning about *why* a specific task matters (this engine
 * still can't do that), but they do guarantee every Mission and Boss
 * Battle visibly names the player's own objective, in their own words,
 * rather than floating with no stated connection to it at all.
 */
/** Same long-objective concern driving the PathSelection/JourneyReveal
 * fixes above: `extractActionPhrase` can return something several
 * sentences long if that's what the player typed, and relevance text
 * embeds it more than once per Chapter. Capped here so "why this matters"
 * stays a short, readable sentence instead of ballooning right back into
 * the same overload problem this pass exists to fix. */
function truncatePhrase(phrase: string, max = 60): string {
  return phrase.length > max ? `${phrase.slice(0, max).trim()}…` : phrase;
}

function buildMissionRelevance(questTitle: string, objective: string): string {
  const actionPhrase = truncatePhrase(extractActionPhrase(objective));
  return `Part of "${questTitle}" — real progress here is what actually moves you toward ${lowerFirst(actionPhrase)}.`;
}

function buildBossRelevance(chapterNumber: number, objective: string): string {
  const actionPhrase = truncatePhrase(extractActionPhrase(objective));
  return `This is Chapter ${chapterNumber}'s real test. Clearing it is what proves you're actually becoming someone who can pull off ${lowerFirst(actionPhrase)} — not just checking boxes.`;
}

// ---------------------------------------------------------------------------
// Archetype paths — replace the old static GENERIC_PATHS. Same three
// honest achievement styles (Steady / Bold / Guided), now built per-player
// from their actual objective wording and intake answers.
// ---------------------------------------------------------------------------

interface Archetype {
  id: string;
  label: string;
  descriptionTemplate: (actionPhrase: string) => string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'steady-builder',
    label: 'Steady',
    descriptionTemplate: (a) =>
      `A consistent, incremental route to ${a} — small real progress every week rather than big swings.`,
  },
  {
    id: 'bold-leap',
    label: 'Bold',
    descriptionTemplate: (a) =>
      `A faster, higher-variance route to ${a} — bigger moves, sooner, with more risk along the way.`,
  },
  {
    id: 'guided-collaboration',
    label: 'Guided',
    descriptionTemplate: (a) =>
      `Leaning on other people — mentors, communities, collaborators — as the main engine behind ${a}.`,
  },
];

function buildArchetypePaths(intake: IntakeAnswers): PathTemplate[] {
  const actionPhrase = extractActionPhrase(intake.objective);
  return ARCHETYPES.map((arch) => {
    let description = arch.descriptionTemplate(actionPhrase);
    if (intake.experience.trim().length > 0) {
      description += ' Built on what you already have going for you, not from zero.';
    }
    return {
      id: arch.id,
      name: `The ${arch.label} Path to ${titleCase(actionPhrase)}`,
      evidenceStrength: 'not-yet-available',
      description,
    };
  });
}

function selectPathTemplates(intake: IntakeAnswers): PathTemplate[] {
  const { objective } = intake;
  if (matchesKeywords(objective, ['film', 'filmmak', 'director', 'movie'])) {
    return FILMMAKER_PATHS;
  }
  if (matchesKeywords(objective, ['million', 'wealth', 'rich', 'business'])) {
    return WEALTH_PATHS;
  }
  return buildArchetypePaths(intake);
}

// ---------------------------------------------------------------------------
// Structural generation: chosen path -> 3 chapters (Spark / Plateau /
// Final Ascent per Book II Ch.7), each with quests, missions, and one Boss
// Battle at the chapter's real turning point (Book II Ch.4).
// ---------------------------------------------------------------------------

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function makeMission(title: string, attribute: AttributeKey, xp: number, whyItMatters?: string): Mission {
  return { id: nextId('mission'), title, isComplete: false, attribute, xp, whyItMatters };
}

function makeQuest(title: string, missions: Mission[]): Quest {
  return { id: nextId('quest'), title, missions, isComplete: false };
}

function makeBoss(name: string, description: string, whyItMatters?: string): BossBattle {
  return { id: nextId('boss'), name, description, isDefeated: false, whyItMatters };
}

interface PhaseTemplate {
  name: string;
  essence: string;
  questTitle: string;
  missionTitles: [string, string];
  boss: { name: string; description: string };
}

/** Hand-templated per curated path family (Phase 3, unchanged by this pass).
 * A real generation engine (once there's API budget) would produce this
 * dynamically from Evidence Retrieval + the player's actual intake answers,
 * not a fixed lookup table. This is an honest stand-in, not a disguised
 * final version. */
const CURATED_CHAPTER_TEMPLATES: Record<string, PhaseTemplate[]> = {
  'freelance-editing': [
    {
      name: 'The Apprentice',
      essence: 'Learning the actual craft well enough that people will pay for it.',
      questTitle: 'Build a portfolio worth showing',
      missionTitles: ['Edit 10 minutes of practice footage', 'Cut a 60-second reel from raw clips'],
      boss: { name: 'The Blank Timeline', description: 'The fear of starting when nothing exists yet.' },
    },
    {
      name: 'The Craftsman',
      essence: 'Building the actual skill, one honest rep at a time.',
      questTitle: 'Land your first paying client',
      missionTitles: ['Send three cold outreach messages', "Write tomorrow's shot list"],
      boss: { name: 'First Paying Client', description: 'The jump from practicing to being trusted with real work.' },
    },
    {
      name: 'The Independent',
      essence: 'Making your own work stand entirely on its own merit.',
      questTitle: 'Finish your own project',
      missionTitles: ['Shoot the opening scene', 'Lock the first act edit'],
      boss: { name: 'Imposter Syndrome at the Finish Line', description: 'Believing the finished work is actually good enough to share.' },
    },
  ],
  builder: [
    {
      name: 'The Founder',
      essence: 'Turning a raw idea into something that actually exists.',
      questTitle: 'Validate the idea with real people',
      missionTitles: ['Talk to 3 potential customers', 'Write down the core problem in one sentence'],
      boss: { name: 'The Blank Page', description: 'The fear that keeps an idea from ever becoming real.' },
    },
    {
      name: 'The Operator',
      essence: 'Doing the unglamorous work that makes a business actually run.',
      questTitle: 'Get your first real customer',
      missionTitles: ['Reach out to 5 leads', 'Fix the biggest complaint from feedback'],
      boss: { name: 'The Plateau', description: 'The stretch where nothing feels like it is moving.' },
    },
    {
      name: 'The Scaler',
      essence: 'Making the business work without you doing everything yourself.',
      questTitle: 'Build something that runs without you',
      missionTitles: ['Document your core process', 'Hand off one task fully'],
      boss: { name: 'Letting Go of Control', description: 'Trusting the business to work without your hands on every part.' },
    },
  ],
  documentary: [
    {
      name: 'The Observer',
      essence: 'Learning to find and follow a real story worth telling.',
      questTitle: 'Find your first real subject',
      missionTitles: [
        'Spend a day filming without a shot list, just observing',
        'Identify the one relationship or moment your story actually turns on',
      ],
      boss: {
        name: 'The Fear of Intruding',
        description: "The discomfort of pointing a camera at someone else's real life and asking them to trust you with it.",
      },
    },
    {
      name: 'The Chronicler',
      essence: "Staying with a story long enough for it to actually reveal itself.",
      questTitle: "Shoot through the story's hardest stretch",
      missionTitles: [
        'Keep filming on a day when nothing seems to be happening',
        "Go back to a subject after they've said no once",
      ],
      boss: {
        name: 'The Access Wall',
        description: 'The moment a subject, location, or institution shuts the door, and the film has to find another way in.',
      },
    },
    {
      name: 'The Editor of Truth',
      essence: 'Shaping real footage into something honest and complete.',
      questTitle: "Cut the film that's actually there, not the one you imagined",
      missionTitles: [
        'Watch all your footage back and write down what story it actually tells',
        'Cut a rough assembly, even an ugly one',
      ],
      boss: {
        name: 'Betraying the Subject',
        description: "The fear of shaping someone's real life into a story that isn't fully fair to them.",
      },
    },
  ],
  narrative: [
    {
      name: 'The Writer',
      essence: 'Turning a scattered idea into an actual script someone could shoot.',
      questTitle: 'Finish a script worth shooting',
      missionTitles: ['Write a one-page treatment for your short', 'Finish the first full draft, even a bad one'],
      boss: {
        name: 'The First Draft',
        description: "The fear that finishing something imperfect means admitting it isn't good yet.",
      },
    },
    {
      name: 'The Director',
      essence: 'Turning words on a page into decisions made with real people and a limited budget.',
      questTitle: 'Get your short actually cast and crewed',
      missionTitles: ['Reach out to five actors or collaborators', 'Lock a shot list for your first shoot day'],
      boss: {
        name: 'The Empty Set',
        description: "Standing on location the morning of the shoot with everything still able to fall apart.",
      },
    },
    {
      name: 'The Finisher',
      essence: "Carrying a film across the actual finish line, past the point where it's more fun to start something new.",
      questTitle: 'Finish the edit and get it in front of real eyes',
      missionTitles: ['Lock picture on the edit', 'Screen the finished film for at least one real audience'],
      boss: {
        name: 'Letting It Be Seen',
        description: 'The fear of the exact moment strangers get to react to something you made.',
      },
    },
  ],
  'festival-circuit': [
    {
      name: 'The Contender',
      essence: 'Making something specifically built to stand out in a room full of other submissions.',
      questTitle: 'Build a film worth submitting',
      missionTitles: [
        "Research 10 festivals that actually fit your film's scale and genre",
        'Finish a submission-ready cut',
      ],
      boss: {
        name: 'The Submit Button',
        description: 'The fear of putting a finished thing in front of strangers who get to say no.',
      },
    },
    {
      name: 'The Waiter',
      essence: "Living with a decision that's entirely out of your hands.",
      questTitle: 'Handle rejection without losing momentum',
      missionTitles: [
        'Submit to your first batch of festivals',
        'Start the next project instead of just waiting on this one',
      ],
      boss: {
        name: 'The Form Rejection Email',
        description: "The specific sting of an impersonal 'not this time,' and what it does and doesn't mean.",
      },
    },
    {
      name: 'The Name in the Program',
      essence: 'Turning one real acceptance into an actual opportunity, not just a line on a résumé.',
      questTitle: 'Make your first acceptance count',
      missionTitles: [
        "Prepare a real pitch or reel for the people you'll meet there",
        'Follow up with every real connection made at the festival',
      ],
      boss: {
        name: 'The Room Full of People Who Matter',
        description: 'Actually talking to industry people in person instead of just hoping to be noticed.',
      },
    },
  ],
  investor: [
    {
      name: 'The Student of Money',
      essence: 'Learning to actually understand where money can go before putting any of it at risk.',
      questTitle: 'Build real investing literacy before risking real money',
      missionTitles: [
        "Read one full company's actual financial filings, not just headlines",
        'Paper-trade one real thesis for a month before committing capital',
      ],
      boss: {
        name: 'The Urge to Skip Homework',
        description: 'The pull to act on a hot tip instead of doing the unglamorous research first.',
      },
    },
    {
      name: 'The Allocator',
      essence: 'Actually putting real capital at risk, on purpose, according to a plan.',
      questTitle: 'Make your first deliberate, sized investment',
      missionTitles: [
        'Write down your actual thesis before you buy, not after',
        "Set a real position size you can live with if you're wrong",
      ],
      boss: {
        name: 'The First Real Loss',
        description: 'The moment a real position moves against you and you have to decide whether to stick to the plan.',
      },
    },
    {
      name: 'The Compounder',
      essence: 'Staying disciplined long enough for time and compounding to actually do the work.',
      questTitle: 'Hold through a cycle instead of reacting to every swing',
      missionTitles: [
        "Review your portfolio against your original thesis, not the day's headlines",
        'Rebalance once, deliberately, instead of constantly',
      ],
      boss: {
        name: 'The Urge to Check Every Day',
        description: 'The compulsion to watch a long-term position like it is a live scoreboard.',
      },
    },
  ],
  creator: [
    {
      name: 'The Voice',
      essence: 'Figuring out what you actually have to say before worrying about who is listening.',
      questTitle: 'Publish consistently before you have an audience',
      missionTitles: [
        'Publish one real piece of work publicly, even to no one',
        'Do it again the following week, on schedule',
      ],
      boss: {
        name: 'Shouting Into the Void',
        description: 'The specific discouragement of making real work that gets zero visible response.',
      },
    },
    {
      name: 'The Builder of an Audience',
      essence: 'Turning scattered attention into people who actually come back.',
      questTitle: 'Find the handful of people who become real repeat viewers',
      missionTitles: [
        'Respond personally to every real comment or message for a month',
        'Double down on the one piece of work that actually got a real reaction',
      ],
      boss: {
        name: "The Algorithm's Silence",
        description: "The frustration of doing genuinely good work that the platform simply doesn't show anyone.",
      },
    },
    {
      name: 'The Owner',
      essence: "Turning an audience into something that's actually yours, not just rented from a platform.",
      questTitle: 'Build one thing your audience actually pays for or owns a piece of',
      missionTitles: [
        'Launch one real product, service, or offer to your existing audience',
        'Move at least part of your audience onto something you actually own, like an email list',
      ],
      boss: {
        name: 'The Platform Could Vanish Tomorrow',
        description: "Facing how much of what you've built depends on a platform you don't control.",
      },
    },
  ],
  operator: [
    {
      name: 'The Contributor',
      essence: 'Becoming genuinely excellent at the actual job in front of you, not the job you want next.',
      questTitle: "Become the person your team can't easily replace",
      missionTitles: [
        'Identify the one skill gap most limiting your current impact and close it',
        'Take ownership of one real problem nobody else wanted',
      ],
      boss: {
        name: 'The Comfortable Plateau',
        description: 'The pull to stay exactly good enough instead of pushing into what is actually uncomfortable to learn.',
      },
    },
    {
      name: 'The Multiplier',
      essence: "Making the people and systems around you better, not just your own output.",
      questTitle: "Get promoted into real responsibility for other people's work",
      missionTitles: [
        'Mentor or unblock a teammate on something outside your own job',
        'Ask directly for the scope you actually want, instead of waiting to be noticed',
      ],
      boss: {
        name: 'The Fear of Asking',
        description: 'The discomfort of stating plainly what you want instead of hoping it is noticed and rewarded on its own.',
      },
    },
    {
      name: 'The Executive',
      essence: 'Being trusted with decisions that actually shape the direction of the company, not just its execution.',
      questTitle: 'Earn a seat where real strategic decisions get made',
      missionTitles: [
        'Make one real recommendation that changes a decision above your current level',
        'Build the case for your next real title, on paper, before asking for it',
      ],
      boss: {
        name: 'Owning a Decision That Might Be Wrong',
        description: 'The weight of a real call that could fail publicly, with your name on it.',
      },
    },
  ],
};

/** Per-archetype flavor words — the only thing that varies the wording
 * between the three generated paths for the same objective, so choosing
 * Steady vs. Bold vs. Guided actually reads differently, not just the
 * path-card description. */
const ARCHETYPE_FLAVOR: Record<string, { verb: string; bossFlavor: string }> = {
  'steady-builder': { verb: 'one honest step at a time', bossFlavor: 'the fear of' },
  'bold-leap': { verb: 'in a few bigger moves', bossFlavor: 'the risk of' },
  'guided-collaboration': { verb: 'with real people alongside you', bossFlavor: 'the discomfort of' },
};

/** Word-weaving generation for every objective outside the two curated
 * domains. Not real generation — no reasoning about what a good first step
 * in the player's specific domain actually is. What it guarantees: the
 * player's own objective phrasing, experience, constraint, and time
 * availability are all actually present in the text, so two players never
 * see identical chapters even though the underlying structure is shared. */
function buildArchetypeChapterTemplates(archetypeId: string, intake: IntakeAnswers): PhaseTemplate[] {
  const actionPhrase = extractActionPhrase(intake.objective);
  const experienceClause = intake.experience.trim()
    ? ` building on ${cleanClauseForEmbedding(intake.experience)}`
    : '';
  const constraintClause = intake.constraint.trim()
    ? ` even with ${cleanClauseForEmbedding(intake.constraint)}`
    : '';
  const pace =
    intake.timeAvailability === 'main-thing'
      ? 'in real, focused blocks'
      : intake.timeAvailability === 'alongside'
        ? 'in the pockets of time you actually have'
        : 'at whatever pace turns out to be sustainable';

  const f = ARCHETYPE_FLAVOR[archetypeId] ?? ARCHETYPE_FLAVOR['steady-builder'];

  return [
    {
      name: 'The Spark',
      essence: `Turning ${actionPhrase} from an idea into real motion, ${f.verb}.`,
      questTitle: `Take the first real steps toward ${actionPhrase}`,
      missionTitles: [
        `Define exactly what "done" looks like for your first stretch${experienceClause}`,
        `Take one concrete action today, ${pace}`,
      ],
      boss: {
        name: 'The Blank Page',
        description: `${f.bossFlavor} starting on ${actionPhrase} when nothing exists yet${constraintClause}.`,
      },
    },
    {
      name: 'The Plateau',
      essence: `The stretch where progress on ${actionPhrase} feels invisible, but isn't.`,
      questTitle: `Keep going on ${actionPhrase} when it stops feeling exciting`,
      missionTitles: [
        `Do the unglamorous version of the work today${constraintClause}`,
        'Check in on what has actually changed since you started',
      ],
      boss: {
        name: 'The Plateau',
        description: 'The point where most people quit — not because they failed, but because it got quiet.',
      },
    },
    {
      name: 'The Final Ascent',
      essence: `${titleCase(actionPhrase)} becomes visible again.`,
      questTitle: `Finish what you started with ${actionPhrase}`,
      missionTitles: ['Close the last open loop', `Do the part of ${actionPhrase} you have been putting off`],
      boss: {
        name: 'The Last Doubt',
        description: `The fear that shows up right before ${actionPhrase} is actually real.`,
      },
    },
  ];
}

function buildChaptersForPath(pathId: string, intake: IntakeAnswers): Chapter[] {
  const chosen = CURATED_CHAPTER_TEMPLATES[pathId] ?? buildArchetypeChapterTemplates(pathId, intake);
  const phases: Array<Chapter['pacingPhase']> = ['spark', 'plateau', 'final-ascent'];
  const attributesByPhase: AttributeKey[] = ['discipline', 'resilience', 'confidence'];

  return chosen.map((tpl, index) => {
    const chapterNumber = index + 1;
    const relevance = buildMissionRelevance(tpl.questTitle, intake.objective);
    return {
      id: nextId('chapter'),
      chapterNumber,
      name: tpl.name,
      essence: tpl.essence,
      pacingPhase: phases[index],
      isComplete: false,
      quests: [
        makeQuest(tpl.questTitle, [
          makeMission(tpl.missionTitles[0], 'craft', 10, relevance),
          makeMission(tpl.missionTitles[1], attributesByPhase[index], 15, relevance),
        ]),
      ],
      bossBattle: makeBoss(tpl.boss.name, tpl.boss.description, buildBossRelevance(chapterNumber, intake.objective)),
    };
  });
}

/** Book II Ch.9 step 5 — Personal Fit Scoring. Deliberately simple, honestly
 * heuristic: real scoring needs actual evidence data this stub doesn't have.
 * Flagging this clearly rather than dressing it up as more rigorous than it is. */
function computeHeuristicPersonalFit(intake: IntakeAnswers): number {
  let score = 60;
  if (intake.timeAvailability === 'main-thing') score += 15;
  if (intake.timeAvailability === 'alongside') score += 5;
  if (intake.experience.trim().length > 0) score += 15;
  return Math.min(score, 95);
}

class StubGenerationEngine implements GenerationEngine {
  async generatePaths(intake: IntakeAnswers): Promise<EvidencePath[]> {
    const templates = selectPathTemplates(intake);
    return templates.map((t) => ({ ...t, personalFit: null }));
  }

  async buildCampaign(intake: IntakeAnswers, chosenPath: EvidencePath): Promise<Campaign> {
    const chapters = buildChaptersForPath(chosenPath.id, intake);

    // Curated path names ("The Freelance-Editing-First Path") stay short
    // nouns, so "X's Ascent" reads fine. Archetype path names now embed the
    // full action phrase ("The Steady Path to Become a Better Speaker"), so
    // appending "'s Ascent" there would misplace the possessive. Give
    // archetype campaigns their own title shape instead.
    const isArchetypePath = ARCHETYPE_FLAVOR[chosenPath.id] !== undefined;
    const title = isArchetypePath
      ? `${titleCase(extractActionPhrase(intake.objective))}: The ${
          ARCHETYPES.find((a) => a.id === chosenPath.id)?.label ?? 'Steady'
        } Ascent`
      : `${chosenPath.name}'s Ascent`;

    return {
      id: nextId('campaign'),
      title,
      objective: intake.objective,
      sourceIntake: intake,
      chosenPath: { ...chosenPath, personalFit: computeHeuristicPersonalFit(intake) },
      chapters,
    };
  }

  /**
   * Book II Ch.8 — Re-Forging. Concrete rule this project uses, since the
   * Bible itself leaves "how much of a Chapter gets regenerated" as an
   * open Future Question:
   *
   * Every Chapter at or before `currentChapterIndex` (everything already
   * completed, PLUS the one currently in progress) is kept completely
   * untouched — same missions, same completion state, same earned XP.
   * Only Chapters strictly AFTER the current one, which the player hasn't
   * started yet, get regenerated using the updated Intake answers.
   *
   * This is a deliberately conservative reading of "nothing already
   * earned is lost" (Ch.8's own "Things We Will Never Do"): rather than
   * trying to partially regenerate an in-progress Chapter and reconcile
   * which of its Missions still "count," the in-progress Chapter is
   * simply left alone. The trade-off, stated honestly: if a player's
   * circumstances change mid-Chapter, that specific Chapter won't reflect
   * the change until the next one — only the Campaign's future shape
   * does. A more surgical version (reshaping the remaining incomplete
   * Missions within the current Chapter too) is possible later, but would
   * need real design work to reconcile mixed old/new Mission sets — not
   * something to improvise silently here.
   */
  async reforgeCampaign(
    campaign: Campaign,
    updatedIntake: IntakeAnswers,
    currentChapterIndex: number
  ): Promise<Campaign> {
    const regenerateFromIndex = currentChapterIndex + 1;
    let chapters = campaign.chapters;

    if (regenerateFromIndex < campaign.chapters.length) {
      const freshChapters = buildChaptersForPath(campaign.chosenPath.id, updatedIntake);
      chapters = campaign.chapters.map((chapter, index) =>
        index < regenerateFromIndex ? chapter : freshChapters[index]
      );
    }
    // If the player is already in the final Chapter, there's honestly
    // nothing structurally ahead left to reshape — the Objective and
    // Personal Fit still update below, but `chapters` stays as-is rather
    // than pretending to regenerate something that doesn't exist yet.

    return {
      ...campaign,
      objective: updatedIntake.objective,
      sourceIntake: updatedIntake,
      chosenPath: { ...campaign.chosenPath, personalFit: computeHeuristicPersonalFit(updatedIntake) },
      chapters,
      reforgedAt: new Date().toISOString(),
    };
  }
}

/**
 * The one line to change when real AI budget exists: swap this export for
 * `new LiveGenerationEngine()` implementing the same `GenerationEngine`
 * interface. Nothing else in the app imports the stub directly.
 */
export const campaignGenerationEngine: GenerationEngine = new StubGenerationEngine();
