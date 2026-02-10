interface DraftVariant {
  warmUp: string;
  mainActivity: string;
  modifications: string;
  assessment: string;
  closure: string;
  notes?: string;
  titleSuggestion?: string;
}

interface DraftInput {
  band: string;
  gradeGroup: string;
  unit: string;
  durationMinutes: number;
}

interface SuggestionPool {
  warmUps: string[];
  mainActivities: string[];
  modifications: string[];
  assessments: string[];
  closures: string[];
}

interface DraftVariantResult {
  variants: DraftVariant[];
  unitKey: string;
  usedFallback: boolean;
}

type BandSuggestions = Record<string, SuggestionPool>;

type SuggestionsByBand = Record<string, BandSuggestions>;

export function normalizeUnit(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(i|ii|iii|iv|v)\b/g, (match) => match)
    .trim();
}

const UNIT_KEY_MAP: Record<string, string> = {
  [normalizeUnit('Body Awareness')]: 'Body Awareness',
  [normalizeUnit('Spatial Awareness')]: 'Spatial Awareness',
  [normalizeUnit('Locomotor Skills I')]: 'Locomotor Skills I',
  [normalizeUnit('Locomotor Skills II')]: 'Locomotor Skills II',
  [normalizeUnit('Non-Locomotor Movement')]: 'Non-Locomotor Movement',
  [normalizeUnit('Games & Cooperation I')]: 'Games & Cooperation I',
  [normalizeUnit('Rhythms & Creative Movement')]: 'Rhythms & Creative Movement',
  [normalizeUnit('Fitness Foundations')]: 'Fitness Foundations',
  [normalizeUnit('Skill Review & Reinforcement')]: 'Skill Review & Reinforcement',
  [normalizeUnit('Manipulative Skills I')]: 'Manipulative Skills I',
  [normalizeUnit('Manipulative Skills II')]: 'Manipulative Skills II',
  [normalizeUnit('Games & Cooperation II')]: 'Games & Cooperation II',
  [normalizeUnit('Culminating Experiences')]: 'Culminating Experiences',
  [normalizeUnit('Games and Cooperation I')]: 'Games & Cooperation I',
  [normalizeUnit('Games and Cooperation II')]: 'Games & Cooperation II',
};

const suggestions: SuggestionsByBand = {
  ELEMENTARY: {
    'Body Awareness': {
      warmUps: [
        'Mirror moves: students follow slow, controlled body shapes and balances.',
        'Freeze shapes warm-up: call out levels and body shapes to hold.',
        'Body parts tag: move and touch the body part named by the teacher.',
      ],
      mainActivities: [
        'Shape stations: wide/narrow, high/low, twist/turn shapes with cues.',
        'Balance pathways: travel between spots and hold shapes on cues.',
        'Partner shapes: create matching or contrasting body shapes safely.',
      ],
      modifications: [
        'Use fewer cues and allow extra time for shapes and balances.',
        'Offer seated or supported balance options.',
      ],
      assessments: [
        'Checklist: holds balance, shows clear shapes, follows cues.',
        'Observation of control and safe spacing.',
      ],
      closures: [
        'Share a favorite shape and why it felt stable.',
        'Breathing and stretch while naming two body parts used.',
      ],
    },
    'Spatial Awareness': {
      warmUps: [
        'Personal space bubbles: move without touching others or cones.',
        'Traffic light movement: stop/go/slow to practice control.',
        'Pathway warm-up: straight, curved, zig-zag pathways in space.',
      ],
      mainActivities: [
        'Spatial challenges: move through general space using different pathways.',
        'Spacing game: freeze when near someone and move away safely.',
        'Obstacle course with cones to reinforce spacing and direction.',
      ],
      modifications: [
        'Reduce speed and add more boundaries for clarity.',
        'Use smaller groups to reduce congestion.',
      ],
      assessments: [
        'Teacher observes safe spacing and awareness of others.',
        'Quick check: students identify open space before moving.',
      ],
      closures: [
        'Reflection: how did you keep your space bubble safe?',
        'Cool down stretch and review of pathways.',
      ],
    },
    'Locomotor Skills I': {
      warmUps: [
        'Locomotor parade: walk, jog, skip, gallop on cues.',
        'Freeze dance with locomotor commands and balance on stop.',
        'Pathway follow: move on lines or cones using locomotor skills.',
      ],
      mainActivities: [
        'Station rotation: walk/jog, skip/gallop, jump/land cues.',
        'Locomotor relays with safe spacing and control.',
        'Partner mirror: copy locomotor patterns and switches.',
      ],
      modifications: [
        'Shorten distances and slow the tempo.',
        'Allow walking in place of more complex skills.',
      ],
      assessments: [
        'Checklist: correct movement pattern and safe spacing.',
        'Observation of balance and control on stops.',
      ],
      closures: [
        'Name two locomotor skills practiced today.',
        'Gentle stretching and breathing to cool down.',
      ],
    },
    'Locomotor Skills II': {
      warmUps: [
        'Speed changes: slow/medium/fast locomotor movements.',
        'Directional moves: forward/backward/sideways locomotor cues.',
        'Animal moves warm-up: bear walk, crab walk, bunny hops.',
      ],
      mainActivities: [
        'Pathway maze: follow zig-zag and curved pathways with locomotor skills.',
        'Skill combos: hop then skip, gallop then jump with control.',
        'Locomotor tag in safe zones with spacing rules.',
      ],
      modifications: [
        'Reduce combinations to one skill at a time.',
        'Provide visual pathway markers.',
      ],
      assessments: [
        'Observe smooth transitions and controlled landings.',
        'Checklist: uses correct directions and pathways.',
      ],
      closures: [
        'Share one skill that improved today.',
        'Cool down with stretching legs and hips.',
      ],
    },
    'Non-Locomotor Movement': {
      warmUps: [
        'Stretch and reach warm-up: twist, bend, sway, and curl.',
        'Shape holds: make wide/tall/twisted shapes on cues.',
        'Follow-the-leader with non-locomotor actions.',
      ],
      mainActivities: [
        'Non-locomotor sequence building: bend, twist, stretch, balance.',
        'Partner mirror: match slow non-locomotor movements.',
        'Balance challenge stations with safe holds.',
      ],
      modifications: [
        'Offer seated options and shorter hold times.',
        'Provide visual cues for each movement.',
      ],
      assessments: [
        'Checklist: performs each action with control.',
        'Observation of balance and stability.',
      ],
      closures: [
        'Reflect on which movement felt most controlled.',
        'Breathing and slow stretch to finish.',
      ],
    },
    'Games & Cooperation I': {
      warmUps: [
        'Partner high-five travels: move and connect safely.',
        'Cooperation warm-up: pass a beanbag down a line.',
        'Team freeze game: groups make shapes on cues.',
      ],
      mainActivities: [
        'Cooperative challenges: build a shape together, move a ball on a tarp.',
        'Team relay with turn-taking and encouragement cues.',
        'Small-group task: keep a balloon up with teamwork.',
      ],
      modifications: [
        'Use smaller groups and simpler tasks.',
        'Provide clear roles for each student.',
      ],
      assessments: [
        'Observe communication and turn-taking.',
        'Peer feedback on teamwork behaviors.',
      ],
      closures: [
        'Share one way your team worked well.',
        'Cool down and thank a teammate.',
      ],
    },
    'Rhythms & Creative Movement': {
      warmUps: [
        'Beat walk: move to a steady rhythm with claps.',
        'Freeze dance to different tempos.',
        'Copy the rhythm: step patterns with music.',
      ],
      mainActivities: [
        'Create a short movement sequence to music in small groups.',
        'Rhythm pathways: move on beats with changes in tempo.',
        'Creative movement story: act out a theme with movement.',
      ],
      modifications: [
        'Provide simple 2-step patterns and clear cues.',
        'Use slower tempo and fewer changes.',
      ],
      assessments: [
        'Observe staying on beat and using varied movements.',
        'Checklist: follows rhythm, uses levels and shapes.',
      ],
      closures: [
        'Share a favorite rhythm move.',
        'Cool down with slow movements and breathing.',
      ],
    },
    'Fitness Foundations': {
      warmUps: [
        'Light cardio and dynamic stretch circuit.',
        'Follow-the-leader fitness warm-up with low intensity.',
        'Movement maze: travel to cones with fitness moves.',
      ],
      mainActivities: [
        'Fitness circuit: jumping jacks, squats, lunges, wall push-ups.',
        'Cardio bursts with short strength breaks.',
        'Fitness stations with timed rotations and form focus.',
      ],
      modifications: [
        'Reduce reps and allow longer rest.',
        'Offer low-impact versions of each exercise.',
      ],
      assessments: [
        'Observe form and effort during stations.',
        'Self-rating of effort using a 1-5 scale.',
      ],
      closures: [
        'Cool down with stretching and breathing.',
        'Discuss how exercise affected heart rate.',
      ],
    },
    'Skill Review & Reinforcement': {
      warmUps: [
        'Skill recap warm-up: quick review of prior skills.',
        'Movement recall: students show a favorite learned skill.',
        'Stations preview: rotate briefly through key skills.',
      ],
      mainActivities: [
        'Review circuit with locomotor, balance, and manipulation tasks.',
        'Skill stations with peer feedback and cues.',
        'Team challenge: apply multiple skills in a cooperative game.',
      ],
      modifications: [
        'Provide reminders and simplified stations.',
        'Allow extra practice time at each station.',
      ],
      assessments: [
        'Checklist: demonstrates key skills with control.',
        'Teacher notes on improvement areas.',
      ],
      closures: [
        'Share one skill you improved this unit.',
        'Cool down and set a goal for next lesson.',
      ],
    },
    'Manipulative Skills I': {
      warmUps: [
        'Self-toss and catch with beanbags.',
        'Roll and catch with a partner at short distance.',
        'Target taps: toss to wall targets and catch.',
      ],
      mainActivities: [
        'Throwing and catching stations with targets and partner work.',
        'Accuracy games: aim for cones at different distances.',
        'Partner challenge: increase distance after successful catches.',
      ],
      modifications: [
        'Use larger, softer equipment and shorter distances.',
        'Allow trapping before catching.',
      ],
      assessments: [
        'Observe grip, step, and catch form.',
        'Count successful catches in a set time.',
      ],
      closures: [
        'Share one throwing cue and one catching cue.',
        'Cool down stretch for arms and shoulders.',
      ],
    },
    'Manipulative Skills II': {
      warmUps: [
        'Dribble warm-up: right hand, left hand, and stationary dribble.',
        'Foot dribble: gentle taps with feet around cones.',
        'Paddle taps: keep a balloon or ball up with a paddle.',
      ],
      mainActivities: [
        'Dribbling pathways with control and changes in direction.',
        'Striking practice: hit targets with paddles or hands.',
        'Small-sided skill games using dribble or strike tasks.',
      ],
      modifications: [
        'Use larger balls and slower tempos.',
        'Reduce distance and allow extra touches.',
      ],
      assessments: [
        'Observe control, posture, and eye focus.',
        'Checklist: keeps object under control while moving.',
      ],
      closures: [
        'Reflect on which manipulative skill felt strongest.',
        'Cool down and review safety with equipment.',
      ],
    },
    'Games & Cooperation II': {
      warmUps: [
        'Team warm-up: pass and move in a circle.',
        'Communication warm-up: partner mirroring and cues.',
        'Cooperative tag with safe zones and teamwork rules.',
      ],
      mainActivities: [
        'Cooperative game with shared goals and roles.',
        'Small-team challenges focusing on communication.',
        'Team relay with strategy and encouragement.',
      ],
      modifications: [
        'Simplify rules and use smaller groups.',
        'Provide clear roles and step-by-step tasks.',
      ],
      assessments: [
        'Observe teamwork, encouragement, and role use.',
        'Peer feedback on communication skills.',
      ],
      closures: [
        'Share one teamwork success from today.',
        'Cool down and thank a teammate.',
      ],
    },
    'Culminating Experiences': {
      warmUps: [
        'Review warm-up covering key skills from the unit.',
        'Movement recap: students demonstrate favorite skills.',
        'Team warm-up with cooperative movement.',
      ],
      mainActivities: [
        'Culminating game applying multiple skills learned.',
        'Skill showcase stations with student choice.',
        'Group challenge combining locomotor and manipulative skills.',
      ],
      modifications: [
        'Offer choice of stations with varied difficulty.',
        'Use smaller groups to ensure participation.',
      ],
      assessments: [
        'Teacher observation of skill application in games.',
        'Student self-reflection on growth and goals.',
      ],
      closures: [
        'Celebrate progress and share one achievement.',
        'Cool down and set a goal for the next unit.',
      ],
    },
    __fallback__: {
      warmUps: [
        'Quick movement warm-up with a mix of walking, jogging, and stretching.',
        'Follow-the-leader warm-up focusing on safe spacing and light movement.',
        'Fitness freeze game with simple movements and balance holds.',
        'Dynamic stretch circuit: arms, legs, and core movements.',
        'Music-based movement warm-up with tempo changes.',
      ],
      mainActivities: [
        'Skill stations with clear cues and short rotations.',
        'Partner practice focusing on technique and safe spacing.',
        'Small-group challenges that reinforce the lesson focus.',
        'Timed activity blocks with quick skill checks.',
        'Cooperative game emphasizing control and communication.',
      ],
      modifications: [
        'Shorten distances, lower intensity, and add visual cues.',
        'Provide extra demonstrations and partner support.',
        'Allow alternative equipment or simplified rules.',
        'Offer rest breaks and reduce repetitions.',
        'Add challenge with extra reps or advanced variations.',
      ],
      assessments: [
        'Observe technique using a simple checklist.',
        'Quick peer feedback with one praise and one goal.',
        'Self-assessment on effort and understanding.',
        'Teacher notes on skill cues and participation.',
        'Short exit question about today’s focus skill.',
      ],
      closures: [
        'Guided cool down with stretches and breathing.',
        'Group reflection: one takeaway from today.',
        'Share one success and one goal for next time.',
        'Quick review of key cues and vocabulary.',
        'Exit ticket with a short response or show of hands.',
      ],
    },
  },
  MIDDLE: {
    __fallback__: {
      warmUps: [
        'Dynamic warm-up with mobility, jogging, and stretches.',
        'Movement prep with quick direction changes.',
        'Partner warm-up with mirroring and light cardio.',
        'Skill-based warm-up with light equipment.',
        'Quick circuit warm-up to elevate heart rate.',
      ],
      mainActivities: [
        'Skill stations with short rotations and feedback.',
        'Small-sided games focused on decision-making.',
        'Drills that emphasize control and communication.',
        'Timed activity blocks with skill challenges.',
        'Cooperative tasks with clear success criteria.',
      ],
      modifications: [
        'Reduce complexity and simplify rules.',
        'Allow more time and space to perform skills.',
        'Provide modified equipment or roles.',
        'Lower intensity with extra rest breaks.',
        'Increase challenge with added constraints.',
      ],
      assessments: [
        'Observation checklist for key skills.',
        'Peer feedback on one strength and one goal.',
        'Self-rating on effort and understanding.',
        'Teacher notes on technique and teamwork.',
        'Quick exit prompt about lesson focus.',
      ],
      closures: [
        'Cool down and quick reflection circle.',
        'Share one strategy that helped today.',
        'Review key cues before dismissal.',
        'Stretch and breathing with short recap.',
        'Exit ticket with a goal for next class.',
      ],
    },
  },
  HIGH: {
    __fallback__: {
      warmUps: [
        'Dynamic warm-up with mobility, light cardio, and activation work.',
        'Movement prep with controlled stretches and light drills.',
        'Short cardio block with technique-focused transitions.',
        'Skill-based warm-up tied to the lesson focus.',
        'Partner warm-up with mirroring and light resistance.',
      ],
      mainActivities: [
        'Structured practice with clear performance targets.',
        'Skill application through small-sided games or stations.',
        'Technique-focused sets with peer coaching.',
        'Timed intervals emphasizing intensity control.',
        'Scenario-based practice with reflection breaks.',
      ],
      modifications: [
        'Reduce load or intensity and focus on technique.',
        'Provide alternative movements or roles.',
        'Increase rest intervals and simplify tasks.',
        'Offer extra feedback and demonstrations.',
        'Increase challenge with advanced progressions.',
      ],
      assessments: [
        'Observation checklist for technique and safety.',
        'Self-assessment on effort and confidence.',
        'Peer feedback on performance cues.',
        'Teacher notes on progression and consistency.',
        'Quick exit prompt on key learning.',
      ],
      closures: [
        'Cool down with stretching and recovery focus.',
        'Reflection on performance and next steps.',
        'Discuss how skills apply outside class.',
        'Share one success and one goal.',
        'Brief summary of key cues.',
      ],
    },
  },
};

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const selectOptions = (options: string[], count: number, rand: () => number) => {
  if (options.length === 0) {
    return Array.from({ length: count }, () => '');
  }

  const shuffled = [...options].sort(() => rand() - 0.5);
  const selected: string[] = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(shuffled[i % shuffled.length]);
  }
  return selected;
};

const adjustForDuration = (text: string, durationMinutes: number) => {
  if (!text) return '';
  if (durationMinutes <= 30) {
    const firstSentence = text.split('.').find(Boolean);
    return firstSentence ? `${firstSentence.trim()}.` : text;
  }
  if (durationMinutes >= 75) {
    return `${text} Include extra practice time or extension challenges.`;
  }
  return text;
};

const resolveUnitKey = (band: string, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (UNIT_KEY_MAP[normalizedUnit]) {
    return UNIT_KEY_MAP[normalizedUnit];
  }

  const bandSuggestions = suggestions[band] || suggestions.ELEMENTARY;
  const matchedKey = Object.keys(bandSuggestions).find((key) => {
    if (key === '__fallback__') return false;
    return normalizeUnit(key) === normalizedUnit;
  });

  return matchedKey || '';
};

const getSuggestionPool = (band: string, unit: string) => {
  const bandSuggestions = suggestions[band] || suggestions.ELEMENTARY;
  const unitKey = resolveUnitKey(band, unit);

  if (unitKey && bandSuggestions[unitKey]) {
    return {
      pool: bandSuggestions[unitKey],
      unitKey,
      usedFallback: false,
    };
  }

  return {
    pool: bandSuggestions.__fallback__ || suggestions.ELEMENTARY.__fallback__,
    unitKey: unitKey || '__fallback__',
    usedFallback: true,
  };
};

export function generateDraftVariants(
  input: DraftInput,
  count = 3,
  seed = Date.now()
): DraftVariantResult {
  const { band, unit, durationMinutes } = input;
  const { pool, unitKey, usedFallback } = getSuggestionPool(band, unit);
  const rand = createSeededRandom(seed);

  const warmUps = selectOptions(pool.warmUps, count, rand);
  const mainActivities = selectOptions(pool.mainActivities, count, rand);
  const modifications = selectOptions(pool.modifications, count, rand);
  const assessments = selectOptions(pool.assessments, count, rand);
  const closures = selectOptions(pool.closures, count, rand);

  const variants = Array.from({ length: count }, (_, index) => {
    const warmUp = adjustForDuration(warmUps[index], durationMinutes).trim() || 'Warm-up activity.';
    const mainActivity =
      adjustForDuration(mainActivities[index], durationMinutes).trim() || 'Main activity practice.';
    const modification =
      adjustForDuration(modifications[index], durationMinutes).trim() || 'Provide appropriate modifications.';
    const assessment =
      adjustForDuration(assessments[index], durationMinutes).trim() || 'Assessment and observation.';
    const closure = adjustForDuration(closures[index], durationMinutes).trim() || 'Closure and reflection.';

    return {
      warmUp,
      mainActivity,
      modifications: modification,
      assessment,
      closure,
      titleSuggestion: unitKey ? `${unitKey} - Lesson` : undefined,
    };
  });

  return { variants, unitKey, usedFallback };
}
