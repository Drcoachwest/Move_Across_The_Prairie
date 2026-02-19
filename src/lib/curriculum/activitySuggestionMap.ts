export type GradeBand = 'K-2' | '3-5';
export type Intent = 'Introduce' | 'Practice' | 'Apply' | 'Review-Assess';

export type ActivitySuggestion = {
  id: string;
  name: string;
  shortDescription?: string;
  recommendedFor?: {
    unit?: string;
    skillFocus?: string;
    gradeBand?: GradeBand;
    intent?: Intent;
  };
};

export const normalizeUnitKey = (unit: string): string => {
  return unit
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const ACTIVITY_SUGGESTIONS: ActivitySuggestion[] = [
  // Body Awareness
  {
    id: 'ba_freeze_statues',
    name: 'Statues / Freeze Shapes',
    recommendedFor: { unit: 'Body Awareness' },
  },
  {
    id: 'ba_mirror_moves',
    name: 'Mirror Moves',
    recommendedFor: { unit: 'Body Awareness' },
  },
  {
    id: 'ba_body_parts_callout',
    name: 'Body Parts Call-Out',
    recommendedFor: { unit: 'Body Awareness' },
  },
  {
    id: 'ba_balance_shapes',
    name: 'Balance Shapes',
    recommendedFor: { unit: 'Body Awareness' },
  },

  // Spatial Awareness
  // Spatial Awareness - K-2 - Introduce
  {
    id: 'sa_k2_intro_space_bubbles',
    name: 'Space Bubbles Freeze',
    recommendedFor: {
      unit: 'Spatial Awareness',
      skillFocus: 'Personal Space (bubble)',
      gradeBand: 'K-2',
      intent: 'Introduce',
    },
  },
  {
    id: 'sa_general_grid_movement',
    name: 'Grid Movement',
    recommendedFor: { unit: 'Spatial Awareness' },
  },

  // Locomotor Skills I
  {
    id: 'loc1_simon_says',
    name: 'Locomotor Simon Says',
    recommendedFor: { unit: 'Locomotor Skills I' },
  },
  {
    id: 'loc1_follow_pathways',
    name: 'Follow-the-Leader Pathways',
    recommendedFor: { unit: 'Locomotor Skills I' },
  },
  {
    id: 'loc1_locomotor_relays',
    name: 'Locomotor Relays',
    recommendedFor: { unit: 'Locomotor Skills I' },
  },

  // Locomotor Skills II
  {
    id: 'loc2_speed_change',
    name: 'Change-of-Speed Challenge',
    recommendedFor: { unit: 'Locomotor Skills II' },
  },
  {
    id: 'loc2_direction_change',
    name: 'Direction Change Course',
    recommendedFor: { unit: 'Locomotor Skills II' },
  },
  {
    id: 'loc2_pathway_switch',
    name: 'Pathway Switch Game',
    recommendedFor: { unit: 'Locomotor Skills II' },
  },

  // Non-Locomotor Movement
  {
    id: 'nlm_balance_shapes',
    name: 'Balance & Shapes',
    recommendedFor: { unit: 'Non-Locomotor Movement' },
  },
  {
    id: 'nlm_twist_bend_stretch',
    name: 'Twist/Bend/Stretch Sequence',
    recommendedFor: { unit: 'Non-Locomotor Movement' },
  },
  {
    id: 'nlm_yoga_flow',
    name: 'Yoga Flow',
    recommendedFor: { unit: 'Non-Locomotor Movement' },
  },

  // Games & Cooperation I
  {
    id: 'gci_partner_challenges',
    name: 'Partner Challenges',
    recommendedFor: { unit: 'Games & Cooperation I' },
  },
  {
    id: 'gci_team_build_stations',
    name: 'Team Build Stations',
    recommendedFor: { unit: 'Games & Cooperation I' },
  },
  {
    id: 'gci_human_knot',
    name: 'Human Knot (modified)',
    recommendedFor: { unit: 'Games & Cooperation I' },
  },
  {
    id: 'gci_pass_the_clap',
    name: 'Pass the Clap (no equipment)',
    recommendedFor: { unit: 'Games & Cooperation I' },
  },

  // Rhythms & Creative Movement
  {
    id: 'rcm_freeze_dance',
    name: 'Freeze Dance',
    recommendedFor: { unit: 'Rhythms & Creative Movement' },
  },
  {
    id: 'rcm_rhythm_follow',
    name: 'Rhythm Follow',
    recommendedFor: { unit: 'Rhythms & Creative Movement' },
  },
  {
    id: 'rcm_move_to_beat',
    name: 'Move to the Beat',
    recommendedFor: { unit: 'Rhythms & Creative Movement' },
  },
  {
    id: 'rcm_creative_pathway',
    name: 'Creative Pathway Dance',
    recommendedFor: { unit: 'Rhythms & Creative Movement' },
  },

  // Fitness Foundations
  {
    id: 'fit_interval_challenge',
    name: 'Interval Move Challenge',
    recommendedFor: { unit: 'Fitness Foundations' },
  },
  {
    id: 'fit_cardio_circuit',
    name: 'Cardio Circuit (no equipment)',
    recommendedFor: { unit: 'Fitness Foundations' },
  },
  {
    id: 'fit_tabata',
    name: 'Kid-Safe Tabata',
    recommendedFor: { unit: 'Fitness Foundations' },
  },
  {
    id: 'fit_fitness_stations',
    name: 'Fitness Stations',
    recommendedFor: { unit: 'Fitness Foundations' },
  },

  // Skill Review & Reinforcement
  {
    id: 'srr_mixed_stations',
    name: 'Mixed-Skill Stations',
    recommendedFor: { unit: 'Skill Review & Reinforcement' },
  },
  {
    id: 'srr_teacher_choice',
    name: 'Teacher Choice Review Game',
    recommendedFor: { unit: 'Skill Review & Reinforcement' },
  },
  {
    id: 'srr_skill_bingo',
    name: 'Skill Bingo (movement)',
    recommendedFor: { unit: 'Skill Review & Reinforcement' },
  },

  // Manipulative Skills I
  {
    id: 'man1_roll_accuracy',
    name: 'Rolling Accuracy (requires equipment)',
    recommendedFor: { unit: 'Manipulative Skills I' },
  },
  {
    id: 'man1_toss_catch',
    name: 'Hand Toss & Catch (requires equipment)',
    recommendedFor: { unit: 'Manipulative Skills I' },
  },
  {
    id: 'man1_target_challenge',
    name: 'Target Challenge (requires equipment)',
    recommendedFor: { unit: 'Manipulative Skills I' },
  },

  // Manipulative Skills II
  {
    id: 'man2_dribble_kick',
    name: 'Dribble/Kick Progressions (requires equipment)',
    recommendedFor: { unit: 'Manipulative Skills II' },
  },
  {
    id: 'man2_skill_circuits',
    name: 'Skill Circuits (requires equipment)',
    recommendedFor: { unit: 'Manipulative Skills II' },
  },

  // Games & Cooperation II
  {
    id: 'gc2_small_sided',
    name: 'Small-Sided Teamwork Games',
    recommendedFor: { unit: 'Games & Cooperation II' },
  },
  {
    id: 'gc2_strategy_movement',
    name: 'Strategy Movement Game',
    recommendedFor: { unit: 'Games & Cooperation II' },
  },
  {
    id: 'gc2_keep_alive',
    name: 'Cooperative “Keep It Alive” (requires equipment)',
    recommendedFor: { unit: 'Games & Cooperation II' },
  },

  // Culminating Experiences
  {
    id: 'cul_choice_stations',
    name: 'Choice Day Stations',
    recommendedFor: { unit: 'Culminating Experiences' },
  },
  {
    id: 'cul_team_challenge',
    name: 'Team Challenge Day',
    recommendedFor: { unit: 'Culminating Experiences' },
  },
  {
    id: 'cul_field_day',
    name: 'Mini Field Day Stations',
    recommendedFor: { unit: 'Culminating Experiences' },
  },
  {
    id: 'sa_k2_intro_traffic_lights',
    name: 'Traffic Lights',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Introduce',
    },
  },
  {
    id: 'sa_k2_intro_follow_leader',
    name: 'Follow the Leader (space rules)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Introduce',
    },
  },
  {
    id: 'sa_k2_intro_island_hopping',
    name: 'Island Hopping (spots)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Introduce',
    },
  },

  // Spatial Awareness - K-2 - Practice
  {
    id: 'sa_k2_practice_cone_cleanup',
    name: 'Cone Cleanup (scatter/gather)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Practice',
    },
  },
  {
    id: 'sa_k2_practice_pathway_parade',
    name: 'Pathway Parade',
    recommendedFor: {
      unit: 'Spatial Awareness',
      skillFocus: 'Pathways (straight/curved/zigzag)',
      gradeBand: 'K-2',
      intent: 'Practice',
    },
  },
  {
    id: 'sa_k2_practice_freeze_find_space',
    name: 'Freeze & Find Space',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Practice',
    },
  },

  // Spatial Awareness - K-2 - Apply
  {
    id: 'sa_k2_apply_safe_zones',
    name: 'Safe Zones Challenge',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Apply',
    },
  },
  {
    id: 'sa_k2_apply_avoid_crowd',
    name: 'Mini “Avoid the Crowd” Relay',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Apply',
    },
  },

  // Spatial Awareness - K-2 - Review-Assess
  {
    id: 'sa_k2_review_show_me',
    name: 'Show Me Stations',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: 'K-2',
      intent: 'Review-Assess',
    },
  },

  // Spatial Awareness - 3-5 - Introduce
  {
    id: 'sa_35_intro_traffic_jam',
    name: 'Traffic Jam (pathways)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Introduce',
    },
  },
  {
    id: 'sa_35_intro_grid_movement',
    name: 'Grid Movement Challenge',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Introduce',
    },
  },
  {
    id: 'sa_35_intro_mirror_move',
    name: 'Mirror Move (partner spacing)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Introduce',
    },
  },

  // Spatial Awareness - 3-5 - Practice
  {
    id: 'sa_35_practice_pathway_tag',
    name: 'Pathway Tag (modified)',
    recommendedFor: {
      unit: 'Spatial Awareness',
      skillFocus: 'Pathways (straight/curved/zigzag)',
      gradeBand: '3-5',
      intent: 'Practice',
    },
  },
  {
    id: 'sa_35_practice_cone_tag_lanes',
    name: 'Cone Tag Lanes',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Practice',
    },
  },
  {
    id: 'sa_35_practice_direction_change',
    name: 'Direction Change Challenge',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Practice',
    },
  },

  // Spatial Awareness - 3-5 - Apply
  {
    id: 'sa_35_apply_small_sided_space',
    name: 'Small-Sided Space Game',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Apply',
    },
  },
  {
    id: 'sa_35_apply_endzone_movement',
    name: 'Endzone Movement Game',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Apply',
    },
  },

  // Spatial Awareness - 3-5 - Review-Assess
  {
    id: 'sa_35_review_rubric_round',
    name: 'Rubric Challenge Round',
    recommendedFor: {
      unit: 'Spatial Awareness',
      gradeBand: '3-5',
      intent: 'Review-Assess',
    },
  },
];

export const FALLBACK_ACTIVITIES: ActivitySuggestion[] = [
  { id: 'fallback_freeze_dance', name: 'Freeze Dance' },
  { id: 'fallback_red_light', name: 'Red Light / Green Light' },
  { id: 'fallback_follow_leader', name: 'Follow the Leader' },
  { id: 'fallback_stations', name: 'Stations / Circuits' },
  { id: 'fallback_partner_mirror', name: 'Partner Mirror' },
  { id: 'fallback_obstacle_course', name: 'Obstacle Course (stations)' },
];

const matches = (
  suggestion: ActivitySuggestion,
  params: { unit?: string; skillFocus?: string; gradeBand?: GradeBand; intent?: Intent }
) => {
  const criteria = suggestion.recommendedFor;
  if (!criteria) return true;
  if (criteria.unit && params.unit) {
    const normalizedCriteria = normalizeUnitKey(criteria.unit);
    const normalizedParam = normalizeUnitKey(params.unit);
    if (normalizedCriteria !== normalizedParam) return false;
  }
  if (criteria.skillFocus && params.skillFocus && criteria.skillFocus !== params.skillFocus) return false;
  if (criteria.gradeBand && params.gradeBand && criteria.gradeBand !== params.gradeBand) return false;
  if (criteria.intent && params.intent && criteria.intent !== params.intent) return false;
  return true;
};

const filterBy = (
  params: { unit?: string; skillFocus?: string; gradeBand?: GradeBand; intent?: Intent },
  required: Array<keyof NonNullable<ActivitySuggestion['recommendedFor']>>
) => {
  return ACTIVITY_SUGGESTIONS.filter((suggestion) => {
    const criteria = suggestion.recommendedFor || {};
    return required.every((key) => criteria[key] && params[key] && criteria[key] === params[key]) && matches(suggestion, params);
  });
};

export const getActivitySuggestions = (params: {
  unit?: string;
  skillFocus?: string;
  gradeBand?: GradeBand;
  intent?: Intent;
}): ActivitySuggestion[] => {
  const cleaned = {
    unit: params.unit?.trim() || undefined,
    skillFocus: params.skillFocus?.trim() || undefined,
    gradeBand: params.gradeBand,
    intent: params.intent,
  };

  const prioritySets: Array<Array<keyof NonNullable<ActivitySuggestion['recommendedFor']>>> = [
    ['unit', 'skillFocus', 'gradeBand', 'intent'],
    ['unit', 'skillFocus', 'gradeBand'],
    ['unit', 'skillFocus'],
    ['unit'],
  ];

  for (const required of prioritySets) {
    const results = filterBy(cleaned, required);
    if (results.length > 0) return results;
  }

  return FALLBACK_ACTIVITIES;
};
