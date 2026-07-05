import type { Campaign } from '../types/campaign';

/**
 * Mock data only — stands in for a real generated Campaign so the dev panel
 * can jump straight into testing without retyping Intake every time.
 */
export const MOCK_CAMPAIGN: Campaign = {
  id: 'mock-campaign',
  title: "The Freelance-Editing-First Path's Ascent",
  objective: 'I want to become a filmmaker',
  sourceIntake: {
    objective: 'I want to become a filmmaker',
    timeAvailability: 'alongside',
    experience: 'Some short films made on my phone',
    constraint: '',
  },
  chosenPath: {
    id: 'freelance-editing',
    name: 'The Freelance-Editing-First Path',
    evidenceStrength: 'strong',
    personalFit: 78,
    description:
      'Paid editing work builds income and industry relationships while your own films get made on the side.',
  },
  chapters: [
    {
      id: 'chapter-1',
      chapterNumber: 1,
      name: 'The Apprentice',
      essence: 'Learning the actual craft well enough that people will pay for it.',
      pacingPhase: 'spark',
      isComplete: true,
      quests: [
        {
          id: 'quest-0',
          title: 'Build a portfolio worth showing',
          isComplete: true,
          missions: [
            { id: 'p1', title: 'Edit 10 minutes of practice footage', isComplete: true, attribute: 'craft', xp: 10, howTo: 'Pick any raw clip you already have and just start cutting — 10 minutes edited is the goal, not a masterpiece.' },
            { id: 'p2', title: 'Cut a 60-second reel from raw clips', isComplete: true, attribute: 'discipline', xp: 15, howTo: 'Assemble your best moments into one continuous 60-second clip — that file is the actual portfolio piece.' },
          ],
        },
      ],
      bossBattle: {
        id: 'boss-0',
        name: 'The Blank Timeline',
        description: 'The fear of starting when nothing exists yet.',
        isDefeated: true,
        pacing: 'quick',
      },
    },
    {
      id: 'chapter-2',
      chapterNumber: 2,
      name: 'The Craftsman',
      essence: 'Building the actual skill, one honest rep at a time.',
      pacingPhase: 'plateau',
      isComplete: false,
      quests: [
        {
          id: 'quest-1',
          title: 'Land your first paying client',
          isComplete: false,
          missions: [
            { id: 'm1', title: 'Send three cold outreach messages', isComplete: false, attribute: 'network', xp: 10, whyItMatters: 'Part of "Land your first paying client" — real progress here is what actually moves you toward becoming a filmmaker.', howTo: 'Find 3 people or small businesses who post raw video and message them directly offering a free sample edit. A reply or a "yes" counts as sent+verifiable, not a booked job.' },
            { id: 'm2', title: 'Edit 10 minutes of raw footage', isComplete: true, attribute: 'craft', xp: 10, whyItMatters: 'Part of "Land your first paying client" — real progress here is what actually moves you toward becoming a filmmaker.', howTo: 'Pick any raw clip you already have and just start cutting — 10 minutes edited is the goal, not a masterpiece.' },
            { id: 'm3', title: "Write tomorrow's shot list", isComplete: false, attribute: 'discipline', xp: 15, whyItMatters: 'Part of "Land your first paying client" — real progress here is what actually moves you toward becoming a filmmaker.', howTo: 'Look at tomorrow\'s actual shoot or edit session and write down, in order, the shots or sequences you plan to get through.' },
          ],
        },
      ],
      bossBattle: {
        id: 'boss-1',
        name: 'First Paying Client',
        description: 'The jump from practicing to being trusted with real work.',
        isDefeated: false,
        whyItMatters: "This is Chapter 2's real test. Clearing it is what proves you're actually becoming someone who can pull off becoming a filmmaker — not just checking boxes.",
        pacing: 'sustained',
      },
    },
  ],
};

/**
 * Dev-only fixture: a Campaign generated seconds ago, nothing touched yet.
 * Exists to test the Abandon Quest reflect screen's zero-stat copy path
 * (0 Chapters, 0 XP, 0 Relics) without manually abandoning a real campaign
 * the instant it's created.
 */
export const FRESH_CAMPAIGN: Campaign = {
  id: 'fresh-campaign',
  title: "The Freelance-Editing-First Path's Ascent",
  objective: 'I want to become a filmmaker',
  sourceIntake: {
    objective: 'I want to become a filmmaker',
    timeAvailability: 'alongside',
    experience: 'Some short films made on my phone',
    constraint: '',
  },
  chosenPath: {
    id: 'freelance-editing',
    name: 'The Freelance-Editing-First Path',
    evidenceStrength: 'strong',
    personalFit: 78,
    description:
      'Paid editing work builds income and industry relationships while your own films get made on the side.',
  },
  chapters: [
    {
      id: 'fresh-chapter-1',
      chapterNumber: 1,
      name: 'The Apprentice',
      essence: 'Learning the actual craft well enough that people will pay for it.',
      pacingPhase: 'spark',
      isComplete: false,
      quests: [
        {
          id: 'fresh-quest-0',
          title: 'Build a portfolio worth showing',
          isComplete: false,
          missions: [
            { id: 'fp1', title: 'Edit 10 minutes of practice footage', isComplete: false, attribute: 'craft', xp: 10 },
            { id: 'fp2', title: 'Cut a 60-second reel from raw clips', isComplete: false, attribute: 'discipline', xp: 15 },
          ],
        },
      ],
      bossBattle: {
        id: 'fresh-boss-0',
        name: 'The Blank Timeline',
        description: 'The fear of starting when nothing exists yet.',
        isDefeated: false,
        pacing: 'quick',
      },
    },
    {
      id: 'fresh-chapter-2',
      chapterNumber: 2,
      name: 'The Craftsman',
      essence: 'Building the actual skill, one honest rep at a time.',
      pacingPhase: 'plateau',
      isComplete: false,
      quests: [
        {
          id: 'fresh-quest-1',
          title: 'Land your first paying client',
          isComplete: false,
          missions: [
            { id: 'fm1', title: 'Send three cold outreach messages', isComplete: false, attribute: 'network', xp: 10 },
          ],
        },
      ],
      bossBattle: {
        id: 'fresh-boss-1',
        name: 'First Paying Client',
        description: 'The jump from practicing to being trusted with real work.',
        isDefeated: false,
        pacing: 'sustained',
      },
    },
  ],
};
