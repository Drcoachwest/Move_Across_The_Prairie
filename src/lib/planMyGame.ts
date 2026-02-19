import { generateDraftVariants, normalizeUnit } from '@/lib/lessonSuggestions';

export type PlannedLesson = {
  title: string;
  objectives: string;
  mainActivity: string;
  warmUp?: string;
  assessment?: string;
  closure?: string;
  equipment?: string;
  modifications?: string;
  notes?: string;
  unit: string;
  skillFocus?: string;
  progressionLevel?: string;
  teacherLookFors?: string;
  commonMistakes?: string;
  coachingLanguage?: string;
};

export type PlanMyGameInput = {
  gradeGroup: 'K-2' | '3-5';
  durationMinutes: number;
  unit: string;
  skillFocus?: string;
  lessonDepth: 'quick' | 'high';
  game: string;
  description?: string;
  equipment?: string[];
  space?: 'Small' | 'Medium' | 'Large' | '';
  notes?: string;
  seed?: number;
};

const DEFAULT_GAME_TITLE = 'Custom Activity';

const createSeedFromString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildObjectives = (gameLabel: string, skillFocus: string, gradeGroup: 'K-2' | '3-5') => {
  const skillText = skillFocus ? skillFocus.toLowerCase() : 'key movement';
  const safetyFocus =
    gradeGroup === 'K-2'
      ? 'using safe space awareness and control.'
      : 'using safe space awareness, control, and decision-making.';
  return `Students will demonstrate ${skillText} skills while participating in ${gameLabel}, ${safetyFocus}`;
};

const buildMainActivity = (
  gameLabel: string,
  description: string | undefined,
  draftMainActivity: string,
  gradeGroup: 'K-2' | '3-5',
  equipment: string | undefined,
  space: PlanMyGameInput['space'],
  notes: string | undefined
) => {
  const safetyLine =
    gradeGroup === 'K-2'
      ? 'Use clear boundaries, a stop signal, and short rounds. Emphasize personal space bubbles and eyes up.'
      : 'Add pathways/levels or simple choices. Include light competition while keeping control and spacing.';

  const lines = [
    `Game: ${gameLabel}.`,
    description?.trim() ? `Idea: ${description.trim()}` : null,
    `Setup: Establish boundaries, review rules, and model the key cues before play begins.`,
    `Play: Run multiple short rounds with quick resets and feedback between rounds.`,
    `Safety/Skill Focus: ${safetyLine}`,
    `Unit Connection: ${draftMainActivity}`,
    equipment?.trim() ? `Equipment: ${equipment.trim()}` : null,
    space ? `Space: ${space}` : null,
    notes?.trim() ? `Constraints: ${notes.trim()}` : null,
  ];

  return lines.filter(Boolean).join('\n');
};

const resolveProgressionLevel = (unit: string, gradeGroup: 'K-2' | '3-5', draftLevel: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === normalizeUnit('Spatial Awareness') && !draftLevel.trim()) {
    return gradeGroup === 'K-2' ? 'Intro' : 'Development';
  }
  return draftLevel;
};

const formatEquipment = (equipment: string[] | undefined) => {
  if (!equipment || equipment.length === 0) return '';
  if (equipment.includes('None')) return '';
  return equipment.join(', ');
};

const resolveGameLabel = (game: string, description?: string) => {
  if (game !== 'Other') return game;
  if (description?.trim()) return DEFAULT_GAME_TITLE;
  return 'Movement Exploration';
};

export const generatePlanMyGameLesson = (input: PlanMyGameInput): PlannedLesson => {
  const seedValue =
    input.seed ??
    createSeedFromString(
      [
        input.gradeGroup,
        input.durationMinutes,
        input.unit,
        input.skillFocus || '',
        input.lessonDepth,
        input.game,
        input.description || '',
        input.equipment?.join(',') || '',
        input.space || '',
        input.notes || '',
      ].join('|')
    );

  const draftResult = generateDraftVariants(
    {
      band: 'ELEMENTARY',
      gradeGroup: input.gradeGroup,
      unit: input.unit,
      durationMinutes: input.durationMinutes,
    },
    1,
    seedValue
  );

  const draft = draftResult.variants[0];
  const gameLabel = resolveGameLabel(input.game, input.description);
  const equipmentText = formatEquipment(input.equipment);
  const skillFocus = input.skillFocus?.trim() || draft.skillFocus;
  const objectives = buildObjectives(gameLabel, skillFocus, input.gradeGroup);
  const mainActivity = buildMainActivity(
    gameLabel,
    input.description,
    draft.mainActivity,
    input.gradeGroup,
    equipmentText,
    input.space,
    input.notes
  );
  const title = `${gameLabel} - ${input.unit}`;

  const baseLesson: PlannedLesson = {
    title,
    objectives,
    mainActivity,
    unit: input.unit,
  };

  if (input.lessonDepth === 'quick') {
    return baseLesson;
  }

  return {
    ...baseLesson,
    warmUp: draft.warmUp,
    assessment: draft.assessment,
    closure: draft.closure,
    equipment: equipmentText || '',
    modifications: draft.modifications,
    notes: input.notes?.trim() || draft.notes || '',
    skillFocus,
    progressionLevel: resolveProgressionLevel(input.unit, input.gradeGroup, draft.progressionLevel),
    teacherLookFors: draft.teacherLookFors,
    commonMistakes: draft.commonMistakes,
    coachingLanguage: draft.coachingLanguage,
  };
};
