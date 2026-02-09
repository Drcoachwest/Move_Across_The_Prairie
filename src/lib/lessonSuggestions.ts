interface DraftSuggestions {
  warmUp: string;
  mainActivity: string;
  modifications?: string;
  assessment: string;
  closure: string;
  titleSuggestion?: string;
}

interface DraftInput {
  band: string;
  gradeGroup: string;
  unit: string;
  durationMinutes: number;
}

const suggestions: Record<string, Record<string, Omit<DraftSuggestions, 'titleSuggestion'>>> = {
  ELEMENTARY: {
    'Locomotor Skills': {
      warmUp: 'Begin with a 5-minute movement review. Have students practice basic locomotor patterns (walking, jogging, skipping, galloping) in general space. Use music or drum beats to set the rhythm. Include directional changes and level variations.',
      mainActivity: 'Set up activity stations focusing on different locomotor skills. Students rotate through 2-3 stations, practicing: (1) Jumping and landing patterns, (2) Running with directional changes, (3) Skipping and galloping in pathways. Provide visual markers and verbal cues for proper form.',
      modifications: 'For struggling students: reduce distance, use closer spacing between markers, provide hand-over-hand guidance. For advanced students: add complex pathways, increase speed requirements, combine multiple skills.',
      assessment: 'Observe students for proper body alignment, control, and smooth transitions. Check ability to follow directional commands and adjust movement patterns. Use a simple checklist of key locomotor cues.',
      closure: 'Cool down with guided stretching while seated. Discuss which movements felt easiest and which need practice. Ask students to name locomotor skills they used today.',
    },
    'Throwing & Catching': {
      warmUp: 'Practice basic hand movements: throwing arm circles, catching motion rehearsal, and light toss-and-catch with a partner using soft balls or bean bags. Start from close distance.',
      mainActivity: 'Progressive throwing and catching: (1) Toss and catch with self, (2) Partner toss and catch at increasing distances, (3) Target throws at cones or targets. Emphasize stepping into throws and watching the object into hands.',
      modifications: 'Struggling students: use larger, softer objects; reduce distance; provide foam balls. Advanced: smaller objects, greater distances, moving targets, one-handed catches.',
      assessment: 'Observe hand positioning, footwork, eye tracking, and catch completion rate. Check for proper grip and follow-through on throws.',
      closure: 'Gather and review proper throwing and catching form. Have students demonstrate one successful throw and catch.',
    },
    'Striking': {
      warmUp: 'Arm swings and striking motion practice without equipment. Students practice overhead, underhand, and sidearm striking motions. Include hip rotation and weight transfer.',
      mainActivity: 'Striking progression: (1) Strike stationary objects (cones, plastic bottles), (2) Strike moving objects with bat or paddle, (3) Cooperative hitting game. Use plastic bats, paddles, or modified equipment.',
      modifications: 'Beginners: larger, slower-moving objects; shorter implements; closer targets. Advanced: faster objects, longer distance, accuracy targets, combination strikes.',
      assessment: 'Observe stance, grip, swing mechanics, and contact point. Check consistency and control.',
      closure: 'Review proper striking stance and swing. Discuss what makes a good strike.',
    },
    'Fitness Basics': {
      warmUp: 'Light movement exploration: slow jog, arm swings, leg lifts, gentle stretching. Build heart rate gradually.',
      mainActivity: 'Fitness concepts introduction: practice basic exercises (jumping jacks, squats, lunges, push-ups on knees). Complete a simple circuit with 3-4 stations. Focus on proper form over repetitions.',
      modifications: 'Struggling: reduce repetitions, offer modified versions (wall push-ups, step-back lunges). Advanced: increase repetitions, add complexity, add balance challenges.',
      assessment: 'Observe effort level, form quality, and willingness to try. Use simple demonstration checklist.',
      closure: 'Cool down with deep breathing and stretching. Discuss how the body felt during exercise.',
    },
  },
  MIDDLE: {
    'Invasion Games': {
      warmUp: 'Movement preparation: jogging, dynamic stretching, footwork drills (lateral slides, forward/backward running, change of direction drills). Increase heart rate progressively.',
      mainActivity: 'Teach/review invasion game concepts: offensive and defensive positioning, passing and receiving, transition from defense to offense. Use simplified rules. Lead small-sided games (3v3 or 4v4) with emphasis on positioning and decision-making.',
      modifications: 'Beginners: larger play area, fewer defenders, simplified scoring. Advanced: smaller space, more complex rules, emphasis on strategy and positioning.',
      assessment: 'Observe offensive/defensive positioning, passing accuracy, game decision-making, and effort. Note transition skills.',
      closure: 'Debrief game strategy: what worked offensively/defensively? Discuss key positions and roles.',
    },
    'Net/Wall Games': {
      warmUp: 'Dynamic stretching with emphasis on shoulders, hips, and legs. Practice basic movement patterns: side-stepping, forward/backward movement. Arm circles and shoulder rotations.',
      mainActivity: 'Net/wall game fundamentals: proper stance, underhand and overhand striking, placement strategy. Practice over a net or against a wall. Progress from cooperative to competitive play.',
      modifications: 'Beginners: lower net/wall target, slower ball, more touches allowed. Advanced: higher net, faster pace, one-touch limits.',
      assessment: 'Observe racket control, footwork positioning, and striking accuracy. Check understanding of court positioning.',
      closure: 'Review proper grip and striking zones. Discuss strategy for winning points.',
    },
    'Fitness Concepts': {
      warmUp: 'Review basic fitness components: cardiovascular endurance, muscular strength, flexibility. Light cardio and dynamic stretching.',
      mainActivity: 'Teach fitness principles: warm-up importance, proper form, progressive overload. Students perform a structured workout including cardio, strength, and flexibility components. Introduce fitness tracking (counting reps, measuring intensity).',
      modifications: 'Struggling: reduce intensity, modify exercises, provide close form feedback. Advanced: increase complexity, track metrics, create personal workout goals.',
      assessment: 'Observe exercise form, effort level, ability to self-monitor, and engagement with fitness concepts.',
      closure: 'Cool down with guided stretching. Discuss personal fitness goals and how to build fitness safely.',
    },
  },
  HIGH: {
    'Strength & Conditioning': {
      warmUp: 'Dynamic warm-up with sport-specific movements: light cardio, dynamic stretching, mobility exercises, movement prep for planned activities.',
      mainActivity: 'Strength training principles: proper form, progressive overload, compound movements (squats, deadlifts, push-ups, rows). Students work through a structured program with appropriate resistance. Include core and functional fitness work.',
      modifications: 'Beginners: lower weights/resistance, more rest, form-focused work. Advanced: increased load, reduced rest, advanced variations, plyometric elements.',
      assessment: 'Evaluate proper lifting mechanics, ability to adjust load appropriately, safety practices, and progression understanding.',
      closure: 'Cool down and stretch major muscle groups. Discuss recovery importance and program progression.',
    },
    'Lifetime Activities': {
      warmUp: 'Activity-specific warm-up: light cardio plus dynamic stretching targeting muscles used in selected activity.',
      mainActivity: 'Teach/practice lifetime activity (e.g., tennis, golf, hiking skills, swimming technique). Emphasize proper technique, rules, strategy, and enjoyment. Include competitive and recreational play/practice.',
      modifications: 'Beginners: simplified rules, reduced complexity, more instruction. Advanced: official rules, competitive scenarios, refereeing roles.',
      assessment: 'Observe skill execution, rule understanding, tactical decisions, and appreciation for lifelong participation.',
      closure: 'Discuss activity value for lifetime wellness and personal preferences.',
    },
    'Personal Fitness Plans': {
      warmUp: 'Review fitness assessment methods: cardiovascular tests, strength assessments, flexibility measurements.',
      mainActivity: 'Students develop personalized fitness plans based on goals and current fitness levels. Cover: goal-setting (SMART), exercise selection, periodization, progression, and tracking methods. Work with partners or individually.',
      modifications: 'Struggling: provide templates and examples, reduce complexity. Advanced: independent research, complex periodization, competitive goal-setting.',
      assessment: 'Evaluate plan completeness, goal appropriateness, exercise selection, and understanding of fitness principles.',
      closure: 'Share plans and discuss. Review commitment to personal fitness goals.',
    },
  },
};

export function getLessonDraft(input: DraftInput): DraftSuggestions {
  const { band, gradeGroup, unit, durationMinutes } = input;

  // Get suggestions for this band and unit
  let draft = suggestions[band]?.[unit];

  // Fall back to generic band-based suggestions if unit not found
  if (!draft) {
    const bandSuggestions = suggestions[band];
    if (bandSuggestions) {
      // Get first available unit's suggestions
      draft = Object.values(bandSuggestions)[0];
    }
  }

  // Final fallback to Elementary generic
  if (!draft) {
    draft = suggestions.ELEMENTARY['Fitness Basics'];
  }

  // Adjust wording based on duration
  const durationFactor = durationMinutes <= 30 ? 'short' : durationMinutes <= 60 ? 'medium' : 'long';

  let warmUp = draft.warmUp;
  let mainActivity = draft.mainActivity;
  let assessment = draft.assessment;
  let closure = draft.closure;

  // Adjust for short lessons
  if (durationFactor === 'short') {
    warmUp = warmUp.split('.')[0] + '.'; // Use first sentence only
    mainActivity = `Quick focus session: ${mainActivity.split(':')[1]?.split('.')[0] || 'practice core skill'}.`;
    closure = 'Brief cool down and quick reflection on today\'s focus.';
  }

  // Adjust for long lessons
  if (durationFactor === 'long') {
    mainActivity += ' Include extended practice time and multiple game applications.';
    closure += ' Allow time for detailed reflection and goal-setting.';
  }

  return {
    warmUp,
    mainActivity,
    modifications: draft.modifications,
    assessment,
    closure,
    titleSuggestion: unit ? `${unit} - Lesson` : undefined,
  };
}
