'use client';

import { useEffect, useMemo, useState } from 'react';
import { YAG_UNITS } from '@/lib/yagUnits';
import {
  buildChatGptPromptFromWizardInputs,
  parseChatGptLessonJson,
  type PromptInputs,
  type ChatGptLessonData,
} from '@/lib/planMyGameChatgpt';
import {
  getSkillFocusOptionsForUnit,
  isSkillFocusValidForUnit,
  normalizeUnitKey,
} from '@/lib/curriculum/skillFocusMap';
import {
  getActivitySuggestions,
  type ActivitySuggestion,
  type GradeBand,
  type Intent as ActivityIntent,
} from '@/lib/curriculum/activitySuggestionMap';

const DURATIONS = [30, 45, 60];

const EQUIPMENT_OPTIONS = ['None', 'Cones', 'Spots', 'Pinnies', 'Balls', 'Hoops'];

type WizardContext = {
  gradeGroup: 'K-2' | '3-5';
  durationMinutes: number;
  unit: string;
  skillFocus?: string;
};

type PlanMyGameWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    plan: ChatGptLessonData,
    context: WizardContext,
    options: { overwriteExisting: boolean }
  ) => void;
  initialGradeGroup?: 'K-2' | '3-5';
  initialDurationMinutes?: number;
  initialUnit?: string;
  initialSkillFocus?: string;
};

export default function PlanMyGameWizard({
  isOpen,
  onClose,
  onImport,
  initialGradeGroup = 'K-2',
  initialDurationMinutes = 45,
  initialUnit = '',
  initialSkillFocus = '',
}: PlanMyGameWizardProps) {
  const [gradeGroup, setGradeGroup] = useState<'K-2' | '3-5'>(initialGradeGroup);
  const [durationMinutes, setDurationMinutes] = useState(initialDurationMinutes);
  const [unit, setUnit] = useState(initialUnit);
  const [skillFocus, setSkillFocus] = useState(initialSkillFocus);

  const [equipment, setEquipment] = useState<string[]>([]);
  const [space, setSpace] = useState<'Small' | 'Medium' | 'Large' | ''>('');
  const [notes, setNotes] = useState('');
  const [customSkillFocus, setCustomSkillFocus] = useState('');
  const [skillFocusSelection, setSkillFocusSelection] = useState('');
  const [intent, setIntent] = useState<PromptInputs['intent']>('Introduce');
  const [chatGptText, setChatGptText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [customActivityIdea, setCustomActivityIdea] = useState('');
  const [activityError, setActivityError] = useState('');
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const unitOptions = useMemo<string[]>(() => {
    const elementaryUnits = YAG_UNITS.ELEMENTARY as Record<string, string[]>;
    return elementaryUnits[gradeGroup] || elementaryUnits['K-2'] || [];
  }, [gradeGroup]);

  const skillFocusOptions = useMemo(
    () => getSkillFocusOptionsForUnit(unit),
    [unit]
  );

  useEffect(() => {
    if (unit && !unitOptions.includes(unit)) {
      setUnit('');
    }
  }, [unit, unitOptions]);

  useEffect(() => {
    if (skillFocus && !isSkillFocusValidForUnit(unit, skillFocus)) {
      if (skillFocusSelection === 'Other') {
        setCustomSkillFocus(skillFocus);
        return;
      }
      setSkillFocus('');
      setCustomSkillFocus('');
      setSkillFocusSelection('');
    } else if (skillFocus && isSkillFocusValidForUnit(unit, skillFocus)) {
      setSkillFocusSelection(skillFocus);
    } else if (!skillFocus && skillFocusSelection !== 'Other') {
      setSkillFocusSelection('');
    }
  }, [unit, skillFocus, skillFocusSelection]);

  useEffect(() => {
    if (!unit.trim() || !intent || skillFocus.trim()) return;
    const normalizedUnit = normalizeUnitKey(unit);
    const suggestions: Partial<Record<ActivityIntent, string>> =
      normalizedUnit === 'spatial awareness'
        ? {
            Introduce: 'Personal Space (bubble)',
            Practice: 'General Space Awareness',
            Apply: 'Speed & Direction Control',
            'Review-Assess': 'Moving Safely (stop/start, freeze)',
          }
        : normalizedUnit === 'locomotor skills'
          ? {
              Introduce: 'Walk/Run',
              Practice: 'Skip',
              Apply: 'Jump & Land',
              'Review-Assess': 'Walk/Run',
            }
          : {};

    const suggested = suggestions[intent as ActivityIntent];
    if (suggested && isSkillFocusValidForUnit(unit, suggested)) {
      setSkillFocus(suggested);
      setSkillFocusSelection(suggested);
    }
  }, [unit, intent, skillFocus]);

  const activitySuggestions = useMemo<ActivitySuggestion[]>(() => {
    const normalizedUnit = unit.trim() || undefined;
    const normalizedSkill = skillFocus.trim() || undefined;
    return getActivitySuggestions({
      unit: normalizedUnit,
      skillFocus: normalizedSkill,
      gradeBand: gradeGroup as GradeBand,
      intent: intent as ActivityIntent,
    }).slice(0, 12);
  }, [unit, skillFocus, gradeGroup, intent]);

  const selectedActivity = useMemo(
    () => activitySuggestions.find((item) => item.id === selectedActivityId),
    [activitySuggestions, selectedActivityId]
  );

  useEffect(() => {
    console.log('suggestions updated', {
      unit,
      skillFocus,
      gradeBand: gradeGroup,
      intent,
      suggestionsCount: activitySuggestions.length,
    });
  }, [unit, skillFocus, gradeGroup, intent, activitySuggestions]);

  useEffect(() => {
    if (!selectedActivityId) return;
    if (selectedActivityId === 'Other') return;
    if (!activitySuggestions.some((item) => item.id === selectedActivityId)) {
      setSelectedActivityId('');
    }
  }, [activitySuggestions, selectedActivityId]);

  const isCustomActivityRequired = selectedActivityId === 'Other';
  const isReadyToGenerate =
    Boolean(gradeGroup) &&
    Boolean(unit.trim()) &&
    Boolean(intent) &&
    Boolean(selectedActivityId) &&
    (!isCustomActivityRequired || customActivityIdea.trim());

  const prompt = useMemo(() => {
    const activityIdea = selectedActivityId === 'Other'
      ? customActivityIdea.trim()
      : selectedActivity?.name || '';

    return buildChatGptPromptFromWizardInputs({
      gradeGroup,
      durationMinutes,
      unit,
      intent,
      game: activityIdea || 'Other',
      description: customActivityIdea.trim() || undefined,
      equipment: equipment.length > 0 ? equipment : undefined,
      space: space || undefined,
      constraints: notes || undefined,
      skillFocus: skillFocus || undefined,
    });
  }, [
    gradeGroup,
    durationMinutes,
    unit,
    intent,
    selectedActivityId,
    selectedActivity?.name,
    customActivityIdea,
    equipment,
    space,
    notes,
    skillFocus,
  ]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyMessage('Prompt copied.');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (err) {
      setCopyMessage('Unable to copy.');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const handleValidate = () => {
    const result = parseChatGptLessonJson(chatGptText);
    if (!result.ok) {
      setValidationErrors(Array.from(result.errors));
      setValidationWarnings([]);
      return null;
    }
    setValidationErrors([]);
    setValidationWarnings(Array.from(result.warnings || []));
    return result.data;
  };

  const handleImport = () => {
    const data = handleValidate();
    if (!data) return;
    onImport(
      data,
      {
        gradeGroup,
        durationMinutes,
        unit,
        skillFocus: skillFocus || undefined,
      },
      { overwriteExisting }
    );
  };

  const toggleEquipment = (value: string) => {
    setEquipment((prev) => {
      if (value === 'None') {
        return prev.includes('None') ? [] : ['None'];
      }
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      return next.filter((item) => item !== 'None');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Lesson Builder</h2>
            <p className="text-sm text-gray-500">Quickly build a lesson and import it into your plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">What do you want to teach?</h3>
              <p className="text-sm text-gray-500">Set the essentials for today’s lesson.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Band <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeGroup}
                  onChange={(e) => setGradeGroup(e.target.value as 'K-2' | '3-5')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="K-2">K–2</option>
                  <option value="3-5">3–5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select unit</option>
                  {unitOptions.map((unitOption) => (
                    <option key={unitOption} value={unitOption}>
                      {unitOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intent <span className="text-red-500">*</span>
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value as PromptInputs['intent'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Introduce">Introduce</option>
                  <option value="Practice">Practice</option>
                  <option value="Apply">Apply</option>
                  <option value="Review-Assess">Review-Assess</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose or describe an activity <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedActivityId(value);
                  if (value !== 'Other') {
                    setActivityError('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an activity</option>
                {activitySuggestions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Suggestions are based on your unit, skill focus, grade band, and intent.
              </p>
              {selectedActivity?.shortDescription && (
                <p className="text-sm text-gray-600 mt-2">{selectedActivity.shortDescription}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your own activity {isCustomActivityRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={customActivityIdea}
                onChange={(e) => {
                  setCustomActivityIdea(e.target.value);
                  if (activityError) setActivityError('');
                }}
                placeholder="Example: I want students moving safely in open space while avoiding collisions…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {activityError && (
                <p className="text-sm text-red-600 mt-1">{activityError}</p>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setIsRefineOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-lg font-semibold text-gray-900">Refine (Optional)</span>
                <span className="text-sm text-gray-500">{isRefineOpen ? 'Hide' : 'Show'}</span>
              </button>
              {isRefineOpen && (
                <div className="px-4 pb-4 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill Focus</label>
                      <select
                        value={skillFocusSelection}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSkillFocusSelection(value);
                          if (value === 'Other') {
                            setSkillFocus(customSkillFocus);
                          } else {
                            setSkillFocus(value);
                            setCustomSkillFocus('');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select skill focus</option>
                        {skillFocusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {skillFocusSelection === 'Other' && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Custom Skill Focus
                          </label>
                          <input
                            type="text"
                            value={customSkillFocus}
                            onChange={(e) => {
                              setCustomSkillFocus(e.target.value);
                              setSkillFocus(e.target.value);
                            }}
                            placeholder="Enter custom focus"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {DURATIONS.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration} minutes
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment (optional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {EQUIPMENT_OPTIONS.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={equipment.includes(option)}
                            onChange={() => toggleEquipment(option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Space (optional)</label>
                    <select
                      value={space}
                      onChange={(e) => setSpace(e.target.value as 'Small' | 'Medium' | 'Large' | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select space size</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Constraints (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="No running, indoors only, behavior concerns..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedActivityId === 'Other' && !customActivityIdea.trim()) {
                    setActivityError('Custom activity description is required when selecting Other.');
                    return;
                  }
                  if (!isReadyToGenerate) {
                    return;
                  }
                  setShowAiModal(true);
                }}
                className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Build Lesson with AI
              </button>
              <span className="text-xs text-gray-500">Required fields: Grade Band, Unit, Intent, Activity.</span>
            </div>
          </div>
        </div>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Build Your Lesson with AI</h3>
                <p className="text-sm text-gray-500">Create a complete, ready-to-teach lesson in under 60 seconds.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Copy Prompt</h4>
                <textarea
                  readOnly
                  value={prompt}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono"
                />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Copy Prompt
                  </button>
                  {copyMessage && <span className="text-sm text-emerald-600">{copyMessage}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-2">This tells AI exactly what you want to teach.</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Use Any AI Tool</h4>
                <p className="text-sm text-gray-600">
                  Paste the prompt into your preferred AI tool (ChatGPT, Copilot, etc.) and generate your lesson.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Paste Your Lesson</h4>
                {validationWarnings.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-amber-600 mb-2">
                    {validationWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-red-600 mb-2">
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
                <textarea
                  value={chatGptText}
                  onChange={(e) => setChatGptText(e.target.value)}
                  rows={8}
                  placeholder="Paste the full AI response here."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste the full AI response here. The app will automatically find the import section at the end.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Import Lesson
                  </button>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                    />
                    Overwrite existing fields
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowExample((prev) => !prev)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showExample ? 'Hide Example' : 'View Example'}
                  </button>
                </div>
                {showExample && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 bg-gray-50">
                    <p className="font-semibold">Sample Lesson (short)</p>
                    <p className="mt-2">Title: Safe Movement with Traffic Lights</p>
                    <p>Objectives: Students practice safe spacing and quick stops.</p>
                    <p>Main Activity: Traffic Lights with clear boundaries and reset cues.</p>
                    <p className="mt-3 font-semibold">BEGIN_IMPORT_JSON</p>
                    <pre className="whitespace-pre-wrap font-mono text-xs">
{`{
  "title": "Safe Movement with Traffic Lights",
  "objectives": "Students practice safe spacing and quick stops.",
  "warmUp": "Walk/stop cues with boundaries.",
  "mainActivity": "Traffic Lights with boundaries and reset cues.",
  "assessment": "Observe spacing and stop response.",
  "closure": "Quick reflection on safe movement.",
  "skillFocus": "Moving Safely (stop/start, freeze)",
  "progressionLevel": "Intro",
  "teacherLookFors": "- Eyes up\n- Controlled speed",
  "commonMistakes": "- Too fast\n- Not scanning",
  "coachingLanguage": "- Eyes up\n- Control first",
  "equipment": "Cones",
  "modifications": "Reduce space or require walking only.",
  "notes": ""
}`}
                    </pre>
                    <p className="font-semibold">END_IMPORT_JSON</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
