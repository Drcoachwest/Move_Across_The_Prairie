export type UnitKey = string;

export type SkillFocusOption = {
  value: string;
  label: string;
};

const buildOptions = (items: string[]): SkillFocusOption[] =>
  items.map((item) => ({ value: item, label: item }));

const NORMALIZED_UNIT_ALIASES: Record<string, string> = {
  'spatial awareness': 'spatial awareness',
  'locomotor skills': 'locomotor skills',
  'locomotor skills i': 'locomotor skills',
  'locomotor skills ii': 'locomotor skills',
  'manipulative skills': 'manipulative skills',
  'manipulative skills i': 'manipulative skills',
  'manipulative skills ii': 'manipulative skills',
  'fitness foundations': 'fitness',
  fitness: 'fitness',
  'games and cooperation i': 'cooperation / teamwork',
  'games and cooperation ii': 'cooperation / teamwork',
  'games & cooperation i': 'cooperation / teamwork',
  'games & cooperation ii': 'cooperation / teamwork',
  'cooperation / teamwork': 'cooperation / teamwork',
};

export const normalizeUnitKey = (unit: string): string => {
  return unit
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s/]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const SKILL_FOCUS_MAP: Record<UnitKey, SkillFocusOption[]> = {
  'spatial awareness': buildOptions([
    'Personal Space (bubble)',
    'General Space Awareness',
    'Pathways (straight/curved/zigzag)',
    'Levels (low/medium/high)',
    'Speed & Direction Control',
    'Moving Safely (stop/start, freeze)',
  ]),
  'locomotor skills': buildOptions([
    'Walk/Run',
    'Skip',
    'Hop',
    'Jump & Land',
    'Gallop',
    'Slide',
  ]),
  'manipulative skills': buildOptions([
    'Throwing',
    'Catching',
    'Rolling',
    'Dribbling (hand)',
    'Kicking',
    'Striking (paddle/hand)',
  ]),
  fitness: buildOptions([
    'Cardio Endurance',
    'Muscular Strength',
    'Muscular Endurance',
    'Flexibility',
    'Circuit / Stations',
  ]),
  'cooperation / teamwork': buildOptions([
    'Sharing Space',
    'Partner Work',
    'Small Group Cooperation',
    'Communication',
  ]),
};

const GENERIC_SKILL_FOCUS = buildOptions([
  'General Focus',
  'Skill Development',
  'Game Application',
  'Other',
]);

export const getSkillFocusOptionsForUnit = (unit: string): SkillFocusOption[] => {
  if (!unit.trim()) return GENERIC_SKILL_FOCUS;
  const normalized = normalizeUnitKey(unit);
  const mappedKey = NORMALIZED_UNIT_ALIASES[normalized] || normalized;
  const options = SKILL_FOCUS_MAP[mappedKey] || GENERIC_SKILL_FOCUS;
  const hasOther = options.some((option) => option.value === 'Other');
  return hasOther ? options : [...options, { value: 'Other', label: 'Other' }];
};

export const isSkillFocusValidForUnit = (unit: string, skillFocus: string): boolean => {
  if (!skillFocus.trim()) return false;
  if (skillFocus.trim() === 'Other') return true;
  const options = getSkillFocusOptionsForUnit(unit);
  return options.some((option) => option.value === skillFocus);
};
