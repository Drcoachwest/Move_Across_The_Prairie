export type ChatGptLessonKeys =
  | 'title'
  | 'objectives'
  | 'warmUp'
  | 'mainActivity'
  | 'assessment'
  | 'closure'
  | 'skillFocus'
  | 'progressionLevel'
  | 'teacherLookFors'
  | 'commonMistakes'
  | 'coachingLanguage'
  | 'equipment'
  | 'modifications'
  | 'notes';

export const CHATGPT_KEYS: ChatGptLessonKeys[] = [
  'title',
  'objectives',
  'warmUp',
  'mainActivity',
  'assessment',
  'closure',
  'skillFocus',
  'progressionLevel',
  'teacherLookFors',
  'commonMistakes',
  'coachingLanguage',
  'equipment',
  'modifications',
  'notes',
];

export type ChatGptLessonData = Record<ChatGptLessonKeys, string>;

export type PromptInputs = {
  gradeGroup: 'K-2' | '3-5';
  durationMinutes: number;
  unit: string;
  intent: 'Introduce' | 'Practice' | 'Apply' | 'Review-Assess';
  game: string;
  description?: string;
  equipment?: string[];
  space?: 'Small' | 'Medium' | 'Large' | '';
  constraints?: string;
  skillFocus?: string;
};

const formatList = (items?: string[]) => {
  if (!items || items.length === 0) return 'None';
  if (items.includes('None')) return 'None';
  return items.join(', ');
};

export const buildChatGptPromptFromWizardInputs = (inputs: PromptInputs) => {
  const description = inputs.description?.trim() || 'None';
  const constraints = inputs.constraints?.trim() || 'None';
  const space = inputs.space || 'General space (gym/playground/classroom)';
  const equipment = formatList(inputs.equipment) || 'No equipment (body-only)';
  const skillFocus = inputs.skillFocus?.trim() || '(not specified)';

  return `You are an expert K-12 physical education teacher and curriculum designer.

Your job is to create a COMPLETE, ready-to-teach PE lesson that is:
- Safe
- Age-appropriate
- Easy to follow
- Focused on skill development (not just playing a game)

IMPORTANT: Follow the GRADE BAND strictly. Ignore any conflicting grade references inside GAME/ACTIVITY IDEA or NOTES.

------------------------------------------------------------
CONTEXT
------------------------------------------------------------
GRADE BAND: ${inputs.gradeGroup}
DURATION: ${inputs.durationMinutes} minutes
UNIT: ${inputs.unit}
INTENT FOR TODAY: ${inputs.intent} (Introduce / Practice / Apply / Review-Assess)
GAME/ACTIVITY IDEA: ${inputs.game}
TEACHER NOTES/DESCRIPTION: ${description}
EQUIPMENT AVAILABLE: ${equipment}
SPACE: ${space}
CONSTRAINTS: ${constraints}
SKILL FOCUS: ${skillFocus}

------------------------------------------------------------
INSTRUCTIONS (IMPORTANT)
------------------------------------------------------------

1. ALIGNMENT
- The lesson MUST align with the UNIT and INTENT.
- The activity must clearly develop the targeted skill.

2. GRADE BAND RULES
- K–2:
  - Keep rules simple
  - Use clear boundaries
  - Include frequent stop signals
  - Avoid chaotic tag unless modified for safety
- 3–5:
  - Add decision-making and movement challenges
  - Use progressions and variations

3. MAIN ACTIVITY REQUIREMENTS
- Include:
  - Setup (space + boundaries)
  - How to play (rules)
  - Safety expectations
  - At least 1 progression or variation

4. COACHING QUALITY
- Use short, practical coaching cues teachers can say immediately
- Avoid long paragraphs

5. KEEP IT CONCISE
- Use bullet points
- Avoid long explanations
- Make it easy to scan quickly during teaching

DEFAULTS (use if info is missing):
- If SPACE is not specified, assume general space and include clear boundaries.
- If EQUIPMENT is not specified, assume no equipment.
- If SKILL FOCUS is not specified, choose the most logical focus based on UNIT + INTENT.
- If GAME/ACTIVITY IDEA conflicts with grade band, follow GRADE BAND strictly.

------------------------------------------------------------
RESPONSE FORMAT (TWO SECTIONS)
------------------------------------------------------------

1) TEACHER-FRIENDLY PLAN (READABLE)

Use clear headings and bullet points.

Include:

Title:

Objectives:
- 2–3 clear, student-friendly objectives

Warm-Up:
- Simple and directly connected to the skill

Main Activity:
- Setup:
- How to Play:
- Progression:

Assessment:
- What the teacher observes (quick, practical)

Closure:
- 1–2 quick reflection questions

Teacher Look-Fors:
- Bullet points

Common Mistakes:
- Bullet points

Coaching Language:
- Short cue phrases (NOT sentences)

------------------------------------------------------------

2) IMPORT JSON (LAST)

Place JSON ONLY between these exact markers:

BEGIN_IMPORT_JSON
{ ...valid JSON... }
END_IMPORT_JSON

Rules:
- Do NOT use markdown code fences
- JSON must be valid
- All values must be strings
- Use \n for line breaks
- No extra text inside JSON block

Return JSON with EXACT keys:

{
  "title": "",
  "objectives": "",
  "warmUp": "",
  "mainActivity": "",
  "assessment": "",
  "closure": "",
  "skillFocus": "",
  "progressionLevel": "",
  "teacherLookFors": "",
  "commonMistakes": "",
  "coachingLanguage": "",
  "equipment": "",
  "modifications": "",
  "notes": ""
}`;
};

const stripFences = (text: string) => {
  if (!text.includes('```')) return text;
  return text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
};

const extractFirstJsonBlock = (text: string) => {
  const start = text.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return '';
};

export const parseChatGptLessonJson = (rawText: string) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, errors: ['Paste the ChatGPT response before validating.'] } as const;
  }

  const markerStart = 'BEGIN_IMPORT_JSON';
  const markerEnd = 'END_IMPORT_JSON';
  const startIndex = trimmed.indexOf(markerStart);
  const endIndex = trimmed.indexOf(markerEnd);

  let jsonText = '';
  let usedMarker = false;

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    jsonText = trimmed.slice(startIndex + markerStart.length, endIndex).trim();
    usedMarker = true;
  } else {
    const noFences = stripFences(trimmed);
    jsonText = extractFirstJsonBlock(noFences) || '';
    if (!jsonText) {
      return {
        ok: false,
        errors: [
          'I couldn’t find the IMPORT JSON section. Make sure ChatGPT included BEGIN_IMPORT_JSON and END_IMPORT_JSON.',
        ],
      } as const;
    }
    warnings.push('Markers not found. Import attempted from detected JSON.');
  }

  const cleanedJsonText = stripFences(jsonText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedJsonText);
  } catch (err) {
    return {
      ok: false,
      errors: ['Invalid JSON in the import section. Ask ChatGPT to regenerate.'],
    } as const;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['JSON must be an object with the required keys.'] } as const;
  }

  const record = parsed as Record<string, unknown>;
  const missingKeys = CHATGPT_KEYS.filter((key) => !(key in record));
  if (missingKeys.length > 0) {
    errors.push('Ask ChatGPT to include the import JSON section with all keys.');
  }

  const nonStringKeys = CHATGPT_KEYS.filter((key) => key in record && typeof record[key] !== 'string');
  if (nonStringKeys.length > 0) {
    errors.push('All values must be strings.');
  }

  const objectives = typeof record.objectives === 'string' ? record.objectives.trim() : '';
  const mainActivity = typeof record.mainActivity === 'string' ? record.mainActivity.trim() : '';
  if (!objectives || !mainActivity) {
    errors.push('Objectives/Main Activity missing. Re-run ChatGPT with the provided prompt.');
  }

  if (errors.length > 0) {
    return { ok: false, errors } as const;
  }

  const data: ChatGptLessonData = CHATGPT_KEYS.reduce((acc, key) => {
    acc[key] = String(record[key] ?? '');
    return acc;
  }, {} as ChatGptLessonData);

  return { ok: true, data, warnings: usedMarker ? [] : warnings } as const;
};
