'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateDraftVariants, getCoachingSuggestions } from '@/lib/lessonSuggestions';
import { YAG_UNITS } from '@/lib/yagUnits';

const GRADE_GROUPS: Record<string, string[]> = {
  ELEMENTARY: ['K-2', '3-5'],
  MIDDLE: ['6-8'],
  HIGH: ['9-12'],
};

const DURATIONS = [30, 45, 60, 90];

const SKILL_FOCUS_OPTIONS = [
  'Spatial Awareness',
  'Locomotor',
  'Manipulative/Striking',
  'Dribbling',
  'Throwing/Catching',
  'Fitness',
  'Teamwork',
  'Rhythm/Creative',
  'Balance/Body Control',
  'Other',
];

const PROGRESSION_LEVEL_OPTIONS = ['Intro', 'Development', 'Application', 'Assessment'];

interface FormData {
  title: string;
  band: string;
  gradeGroup: string;
  unit: string;
  customUnit: string;
  durationMinutes: number;
  skillFocus: string;
  progressionLevel: string;
  equipment: string;
  objectives: string;
  warmUp: string;
  mainActivity: string;
  modifications: string;
  assessment: string;
  closure: string;
  teacherLookFors: string;
  commonMistakes: string;
  coachingLanguage: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface DraftVariant {
  warmUp: string;
  mainActivity: string;
  modifications: string;
  assessment: string;
  closure: string;
  skillFocus: string;
  progressionLevel: string;
  teacherLookFors: string;
  commonMistakes: string;
  coachingLanguage: string;
  notes?: string;
  titleSuggestion?: string;
}

export default function LessonBuilderPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title: '',
    band: 'ELEMENTARY',
    gradeGroup: 'K-2',
    unit: '',
    customUnit: '',
    durationMinutes: 45,
    skillFocus: '',
    progressionLevel: '',
    equipment: '',
    objectives: '',
    warmUp: '',
    mainActivity: '',
    modifications: '',
    assessment: '',
    closure: '',
    teacherLookFors: '',
    commonMistakes: '',
    coachingLanguage: '',
    notes: '',
  });

  const [units, setUnits] = useState<string[]>([]);
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [draftOptions, setDraftOptions] = useState<DraftVariant[]>([]);
  const [draftUnitFocus, setDraftUnitFocus] = useState('');
  const [draftUsedFallback, setDraftUsedFallback] = useState(false);
  const [lessonMode, setLessonMode] = useState<'quick' | 'high'>('quick');
  const [openPanels, setOpenPanels] = useState({
    warmUpClosure: false,
    instructionalQuality: false,
    assessment: false,
    differentiation: false,
    resources: false,
  });
  
  // Curriculum resources
  interface CurriculumResource {
    id: string;
    title: string;
    unit: string;
    band: string;
    gradeGroup: string;
    url?: string;
    fileName?: string;
  }
  const [allResources, setAllResources] = useState<CurriculumResource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [resourceFilterLevel, setResourceFilterLevel] = useState('All');
  const [resourceFilterGrade, setResourceFilterGrade] = useState('All');
  const [resourceFilterUnit, setResourceFilterUnit] = useState('All');

  // Fetch curriculum units and resources on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/curriculum');
        if (response.ok) {
          const data = await response.json();
          const resources = data.resources || [];
          const curriculumUnits: string[] = Array.from(
            new Set(resources.map((item: any) => item.unit).filter(Boolean))
          );
          setUnits(curriculumUnits.sort());
          setAllResources(resources);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      }
    };

    fetchData();
  }, []);

  // Handle band change - auto-set grade for Middle/High, clear unit
  const handleBandChange = (newBand: string) => {
    const newGradeGroup = GRADE_GROUPS[newBand][0];
    setForm((prev) => ({
      ...prev,
      band: newBand,
      gradeGroup: newGradeGroup,
      unit: '',
      customUnit: '',
    }));
    setShowCustomUnit(false);
  };

  const getTeacherSupportExamples = (type: 'lookFors' | 'mistakes' | 'coaching') => {
    const base = {
      lookFors: ['Eyes up and scanning for space', 'Uses the key cue consistently', 'Moves with control'],
      mistakes: ['Rushing and losing control', 'Eyes down during movement', 'Forgetting the key cue'],
      coaching: ['Eyes up', 'Find open space', 'Control first, then speed'],
    };

    if (form.skillFocus === 'Throwing/Catching') {
      return type === 'lookFors'
        ? ['Steps to target', 'Hands ready for catch', 'Tracks the ball into hands']
        : type === 'mistakes'
          ? ['No step on throw', 'Stiff hands on catch', 'Looking away early']
          : ['Step and throw', 'Soft hands', 'Watch it in'];
    }

    if (form.skillFocus === 'Dribbling') {
      return type === 'lookFors'
        ? ['Ball stays close', 'Uses fingertips', 'Eyes up when moving']
        : type === 'mistakes'
          ? ['Ball too far away', 'Watching the ball', 'Using palm']
          : ['Soft fingertips', 'Keep it close', 'Eyes up'];
    }

    if (form.skillFocus === 'Teamwork') {
      return type === 'lookFors'
        ? ['Communicates with partners', 'Shares space and equipment', 'Encourages teammates']
        : type === 'mistakes'
          ? ['Works alone instead of with group', 'Does not listen to cues', 'Rushing without a plan']
          : ['Talk to your partner', 'Share the space', 'Plan before you move'];
    }

    return base[type];
  };

  const fillTeacherSupportField = (field: 'teacherLookFors' | 'commonMistakes' | 'coachingLanguage') => {
    const fieldMap = {
      teacherLookFors: 'lookFors',
      commonMistakes: 'mistakes',
      coachingLanguage: 'coaching',
    } as const;

    const value = form[field];
    if (value && value.trim()) return;

    const examples = getTeacherSupportExamples(fieldMap[field]);
    const text = examples.map((item) => `- ${item}`).join('\n');
    setForm((prev) => ({ ...prev, [field]: text }));
  };

  const clearTeacherSupportField = (field: 'teacherLookFors' | 'commonMistakes' | 'coachingLanguage') => {
    setForm((prev) => ({ ...prev, [field]: '' }));
  };

  const previewBullets = (text: string, max = 2) => {
    const bullets = text
      .split('\n')
      .map((line) => line.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean);
    return bullets.slice(0, max);
  };

  // Handle unit change
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'other') {
      setShowCustomUnit(true);
      setForm((prev) => ({ ...prev, unit: '', customUnit: '' }));
    } else {
      setShowCustomUnit(false);
      setForm((prev) => ({ ...prev, unit: value, customUnit: '' }));
    }
  };

  // Handle custom unit input
  const handleCustomUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, customUnit: e.target.value }));
  };

  const generateDraftOptions = (seed = Date.now()) => {
    const actualUnit = showCustomUnit ? form.customUnit : form.unit;

    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!actualUnit.trim()) newErrors.unit = 'Unit is required';
    if (!form.objectives.trim()) newErrors.objectives = 'Objectives are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const draftResult = generateDraftVariants(
      {
        band: form.band,
        gradeGroup: form.gradeGroup,
        unit: actualUnit,
        durationMinutes: form.durationMinutes,
      },
      3,
      seed
    );

    setDraftOptions(draftResult.variants);
    setDraftUnitFocus(
      draftResult.unitKey && draftResult.unitKey !== '__fallback__' ? draftResult.unitKey : actualUnit
    );
    setDraftUsedFallback(draftResult.usedFallback);
    setErrors({});
    setLoading(false);
  };

  const handleGenerateDraft = () => {
    generateDraftOptions();
  };

  const handleRegenerateDrafts = () => {
    generateDraftOptions(Date.now());
  };

  const handleUseDraft = (draft: DraftVariant) => {
    setForm((prev) => ({
      ...prev,
      unit: showCustomUnit ? '' : prev.unit,
      customUnit: showCustomUnit ? form.customUnit : prev.customUnit,
      warmUp: draft.warmUp,
      mainActivity: draft.mainActivity,
      modifications: draft.modifications || '',
      assessment: draft.assessment,
      closure: draft.closure,
      skillFocus: draft.skillFocus || prev.skillFocus,
      progressionLevel: draft.progressionLevel || prev.progressionLevel,
      teacherLookFors: draft.teacherLookFors || prev.teacherLookFors,
      commonMistakes: draft.commonMistakes || prev.commonMistakes,
      coachingLanguage: draft.coachingLanguage || prev.coachingLanguage,
      notes: draft.notes || prev.notes,
      title: prev.title.trim() ? prev.title : draft.titleSuggestion || prev.title,
    }));

    setErrors({});
  };

  // Reset form
  const handleReset = () => {
    setForm({
      title: '',
      band: 'ELEMENTARY',
      gradeGroup: 'K-2',
      unit: '',
      customUnit: '',
      durationMinutes: 45,
      skillFocus: '',
      progressionLevel: '',
      equipment: '',
      objectives: '',
      warmUp: '',
      mainActivity: '',
      modifications: '',
      assessment: '',
      closure: '',
      teacherLookFors: '',
      commonMistakes: '',
      coachingLanguage: '',
      notes: '',
    });
    setShowCustomUnit(false);
    setLessonMode('quick');
    setOpenPanels({
      warmUpClosure: false,
      instructionalQuality: false,
      assessment: false,
      differentiation: false,
      resources: false,
    });
    setErrors({});
    setSuccessMessage('');
  };

  // Save lesson
  const handleSaveLesson = async () => {
    const actualUnit = showCustomUnit ? form.customUnit : form.unit;

    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!actualUnit.trim()) newErrors.unit = 'Unit is required';
    if (!form.objectives.trim()) newErrors.objectives = 'Objectives are required';
    if (!form.mainActivity.trim()) newErrors.mainActivity = 'Main activity is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          band: form.band,
          gradeGroup: form.gradeGroup,
          unit: actualUnit.trim(),
          durationMinutes: form.durationMinutes,
          skillFocus: form.skillFocus.trim(),
          progressionLevel: form.progressionLevel.trim(),
          equipment: form.equipment.trim() || null,
          objectives: form.objectives.trim(),
          warmUp: form.warmUp.trim(),
          mainActivity: form.mainActivity.trim(),
          modifications: form.modifications.trim() || null,
          assessment: form.assessment.trim(),
          closure: form.closure.trim(),
          teacherLookFors: form.teacherLookFors.trim(),
          commonMistakes: form.commonMistakes.trim(),
          coachingLanguage: form.coachingLanguage.trim(),
          notes: form.notes.trim() || null,
          resourceIds: selectedResourceIds.length > 0 ? selectedResourceIds : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.field) {
          setErrors({ [errorData.field]: errorData.error });
        } else {
          setErrors({ submit: errorData.error || 'Failed to save lesson' });
        }
        return;
      }

      const lesson = await response.json();
      setSuccessMessage('Lesson saved! Redirecting...');
      setTimeout(() => {
        router.push(`/dashboard/lessons/${lesson.lesson.id}`);
      }, 1000);
    } catch (err) {
      setErrors({ submit: 'An error occurred while saving the lesson' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isSaveDisabled =
    !form.title.trim() ||
    !(showCustomUnit ? form.customUnit.trim() : form.unit) ||
    !form.objectives.trim() ||
    !form.mainActivity.trim() ||
    saving;

  // Filter resources for resource selector
  const getFilteredResources = () => {
    return allResources.filter((resource) => {
      if (resourceSearchQuery.trim()) {
        const q = resourceSearchQuery.toLowerCase();
        if (!resource.title.toLowerCase().includes(q) && !resource.unit.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (resourceFilterLevel !== 'All' && resource.band !== resourceFilterLevel) {
        return false;
      }
      if (resourceFilterGrade !== 'All' && resource.gradeGroup !== resourceFilterGrade) {
        return false;
      }
      if (resourceFilterUnit !== 'All' && resource.unit !== resourceFilterUnit) {
        return false;
      }
      return true;
    });
  };

  // Get unique units from resources for filter dropdown
  const uniqueResourceUnits = Array.from(
    new Set(allResources.map((r) => r.unit).filter(Boolean))
  ).sort();

  // Get available grades based on selected level for resource filter
  const getAvailableResourceGrades = () => {
    if (resourceFilterLevel === 'All') {
      return ['K-2', '3-5', '6-8', '9-12'];
    } else if (resourceFilterLevel === 'ELEMENTARY') {
      return ['K-2', '3-5'];
    } else if (resourceFilterLevel === 'MIDDLE') {
      return ['6-8'];
    } else if (resourceFilterLevel === 'HIGH') {
      return ['9-12'];
    }
    return [];
  };

  const availableResourceGrades = getAvailableResourceGrades();
  const filteredResources = getFilteredResources();
  const selectedResources = allResources.filter((r) => selectedResourceIds.includes(r.id));
  const previewText = (text: string) => (text.length > 120 ? `${text.slice(0, 120)}…` : text);
  const unitOptions = form.band === 'ELEMENTARY' ? YAG_UNITS.ELEMENTARY['K-2'] : units;

  const actualUnit = showCustomUnit ? form.customUnit : form.unit;
  const hasMinLength = (value: string, min: number) => value.trim().length >= min;
  const countNonEmptyLines = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length;

  const instructionalQualityScore =
    (hasMinLength(form.objectives, 15) ? 20 : 0) +
    (hasMinLength(form.mainActivity, 50) ? 25 : 0) +
    (form.skillFocus.trim() ? 10 : 0) +
    (form.progressionLevel.trim() ? 10 : 0) +
    (countNonEmptyLines(form.teacherLookFors) >= 2 ? 10 : 0) +
    (countNonEmptyLines(form.commonMistakes) >= 2 ? 10 : 0) +
    (countNonEmptyLines(form.coachingLanguage) >= 2 ? 10 : 0) +
    (hasMinLength(form.assessment, 20) ? 5 : 0);
  const qualityStatus =
    instructionalQualityScore >= 70
      ? 'Instructionally Strong'
      : instructionalQualityScore >= 40
        ? 'Developing'
        : 'Basic';

  const unitFocusLabel = showCustomUnit
    ? form.customUnit.trim() || 'Custom Unit'
    : form.unit.trim() || '—';
  const skillFocusLabel = form.skillFocus.trim() || '—';
  const progressionLabel = form.progressionLevel.trim() || '—';

  const setAllPanels = (isOpen: boolean) => {
    setOpenPanels({
      warmUpClosure: isOpen,
      instructionalQuality: isOpen,
      assessment: isOpen,
      differentiation: isOpen,
      resources: isOpen,
    });
  };

  useEffect(() => {
    if (lessonMode === 'high') {
      setAllPanels(true);
    } else {
      setAllPanels(false);
    }
  }, [lessonMode]);

  const handleSuggestCoachingLanguage = () => {
    const suggestions = getCoachingSuggestions({
      band: form.band,
      gradeGroup: form.gradeGroup,
      unit: actualUnit || 'General PE',
      durationMinutes: form.durationMinutes,
      skillFocus: form.skillFocus,
      progressionLevel: form.progressionLevel,
    });
    if (!suggestions.length) return;
    const text = suggestions.map((item) => `- ${item}`).join('\n');
    setForm((prev) => {
      const current = prev.coachingLanguage.trim();
      if (!current) {
        return { ...prev, coachingLanguage: text };
      }
      return { ...prev, coachingLanguage: `${current}\n--- Suggested ---\n${text}` };
    });
  };

  const handleQuickFill = () => {
    if (form.objectives.trim() && form.mainActivity.trim()) return;
    if (!actualUnit.trim()) return;
    const draftResult = generateDraftVariants(
      {
        band: form.band,
        gradeGroup: form.gradeGroup,
        unit: actualUnit,
        durationMinutes: form.durationMinutes,
      },
      1,
      Date.now()
    );
    const draft = draftResult.variants[0];
    setForm((prev) => ({
      ...prev,
      objectives: prev.objectives.trim()
        ? prev.objectives
        : draft.skillFocus
          ? `Students will demonstrate ${draft.skillFocus.toLowerCase()} skills at the ${draft.progressionLevel.toLowerCase()} level.`
          : `Students will practice the key skills for ${actualUnit}.`,
      mainActivity: prev.mainActivity.trim() ? prev.mainActivity : draft.mainActivity,
    }));
  };

  const handleAutoFillRemainingSections = () => {
    if (!actualUnit.trim()) return;
    const draft = draftOptions[0]
      ? draftOptions[0]
      : generateDraftVariants(
          {
            band: form.band,
            gradeGroup: form.gradeGroup,
            unit: actualUnit || 'General PE',
            durationMinutes: form.durationMinutes,
          },
          1,
          Date.now()
        ).variants[0];

    const baseSkillFocus = form.skillFocus.trim() ? form.skillFocus : draft.skillFocus;
    const equipmentSuggestion = (() => {
      if (baseSkillFocus === 'Spatial Awareness') return 'Cones, poly spots, boundary lines.';
      if (baseSkillFocus === 'Locomotor') return 'Cones, poly spots, floor lines.';
      if (baseSkillFocus === 'Throwing/Catching') return 'Soft balls, targets, cones.';
      if (baseSkillFocus === 'Dribbling') return 'Basketballs or playground balls, cones.';
      if (baseSkillFocus === 'Fitness') return 'Mats, timers, cones.';
      if (baseSkillFocus === 'Teamwork') return 'Cones, pinnies, small equipment.';
      return 'Cones, poly spots, and basic equipment.';
    })();

    setForm((prev) => ({
      ...prev,
      warmUp: prev.warmUp.trim() ? prev.warmUp : draft.warmUp,
      closure: prev.closure.trim() ? prev.closure : draft.closure,
      assessment: prev.assessment.trim() ? prev.assessment : draft.assessment,
      equipment: prev.equipment.trim() ? prev.equipment : equipmentSuggestion,
      modifications: prev.modifications.trim() ? prev.modifications : draft.modifications,
      notes: prev.notes.trim() ? prev.notes : draft.notes || prev.notes,
      teacherLookFors: prev.teacherLookFors.trim() ? prev.teacherLookFors : draft.teacherLookFors,
      commonMistakes: prev.commonMistakes.trim() ? prev.commonMistakes : draft.commonMistakes,
      coachingLanguage: prev.coachingLanguage.trim() ? prev.coachingLanguage : draft.coachingLanguage,
      skillFocus: prev.skillFocus.trim() ? prev.skillFocus : draft.skillFocus,
      progressionLevel: prev.progressionLevel.trim() ? prev.progressionLevel : draft.progressionLevel,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Builder</h1>
        <p className="text-gray-600">Create PE lessons with guided suggestions</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Lesson Mode</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setLessonMode('quick')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  lessonMode === 'quick'
                    ? 'bg-blue-50 text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quick Lesson
              </button>
              <button
                type="button"
                onClick={() => setLessonMode('high')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  lessonMode === 'high'
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                High-Quality Lesson (recommended)
              </button>
            </div>
          </div>
          <span
            className={`text-sm px-2.5 py-1 rounded-md border ${
              instructionalQualityScore >= 70
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : instructionalQualityScore >= 40
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            Instructional Quality: {instructionalQualityScore}/100
            <span className="ml-2 font-medium">{qualityStatus}</span>
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This score reflects instructional completeness and supports consistent PE instruction across campuses.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Unit Context: Unit Focus: {unitFocusLabel} | Skill Focus: {skillFocusLabel} | Lesson Position: {progressionLabel}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* SECTION 1: LESSON SETUP */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Section 1: Lesson Setup</h2>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Throwing Basics for Grade 3"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Level and Grade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              value={form.band}
              onChange={(e) => handleBandChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ELEMENTARY">Elementary</option>
              <option value="MIDDLE">Middle</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade <span className="text-red-500">*</span>
            </label>
            {['MIDDLE', 'HIGH'].includes(form.band) ? (
              <div className="relative">
                <select
                  value={form.gradeGroup}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                >
                  <option>{form.gradeGroup}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-set for {form.band}</p>
              </div>
            ) : (
              <select
                value={form.gradeGroup}
                onChange={(e) => setForm({ ...form, gradeGroup: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GRADE_GROUPS[form.band].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Unit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit <span className="text-red-500">*</span>
          </label>
          {!showCustomUnit ? (
            <select
              value={form.unit}
              onChange={handleUnitChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.unit ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a unit...</option>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="other">Other…</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={form.customUnit}
                onChange={handleCustomUnitChange}
                placeholder="Enter custom unit name"
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                onClick={() => {
                  setShowCustomUnit(false);
                  setForm((prev) => ({ ...prev, unit: '', customUnit: '' }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
          {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit}</p>}
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <select
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
        </div>

        {/* Objectives */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.objectives}
            onChange={(e) => setForm({ ...form, objectives: e.target.value })}
            placeholder="Describe the learning objectives for this lesson..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.objectives ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.objectives && (
            <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>
          )}
        </div>

        {/* Section 1 Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGenerateDraft}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Generating...' : 'Generate Draft Options'}
          </button>
          <button
            onClick={handleQuickFill}
            disabled={saving}
            className="px-6 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium"
          >
            Quick Fill (Minimum Required)
          </button>
          {lessonMode === 'high' && (
            <button
              onClick={handleAutoFillRemainingSections}
              disabled={saving}
              className="px-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100 disabled:opacity-50 font-medium"
            >
              Auto-Fill Remaining Sections
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
          >
            Reset
          </button>
          {draftOptions.length > 0 && (
            <button
              onClick={handleRegenerateDrafts}
              disabled={saving}
              className="md:col-span-2 px-6 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {draftOptions.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Draft Options</h2>
            <p className="text-sm text-gray-500">Choose a draft to start editing</p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Unit focus: <span className="font-medium text-gray-900">{draftUnitFocus || 'General PE'}</span>
            </p>
            {draftUsedFallback && (
              <p className="text-sm text-amber-700 mt-1">
                General PE template used (no unit-specific template found).
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {draftOptions.map((draft, index) => (
              <div key={`draft-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Draft {String.fromCharCode(65 + index)}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.skillFocus && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                      {draft.skillFocus}
                    </span>
                  )}
                  {draft.progressionLevel && (
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                      {draft.progressionLevel}
                    </span>
                  )}
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900">Warm Up</p>
                    <p>{previewText(draft.warmUp)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Main Activity</p>
                    <p>{previewText(draft.mainActivity)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Assessment</p>
                    <p>{previewText(draft.assessment)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Teacher Support</p>
                    <ul className="list-disc list-inside space-y-1">
                      {previewBullets(draft.teacherLookFors).map((item, itemIndex) => (
                        <li key={`lookfor-${itemIndex}`}>{item}</li>
                      ))}
                      {previewBullets(draft.coachingLanguage, 1).map((item, itemIndex) => (
                        <li key={`coach-${itemIndex}`} className="text-gray-600">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => handleUseDraft(draft)}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                >
                  Use this draft
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: LESSON CONTENT */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Section 2: Lesson Content</h2>
        {/* Main Activity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Activity <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.mainActivity}
            onChange={(e) => setForm({ ...form, mainActivity: e.target.value })}
            placeholder="Describe the main instructional activities..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.mainActivity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.mainActivity && (
            <p className="text-red-500 text-sm mt-1">{errors.mainActivity}</p>
          )}
        </div>

        {/* Warm-Up & Closure */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() =>
              setOpenPanels((prev) => ({ ...prev, warmUpClosure: !prev.warmUpClosure }))
            }
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold text-gray-900">Warm-Up &amp; Closure</span>
            <span className="text-sm text-gray-500">
              {openPanels.warmUpClosure ? 'Hide' : 'Show'}
            </span>
          </button>

          {openPanels.warmUpClosure && (
            <div className="px-4 pb-4">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warm-Up
                </label>
                <textarea
                  value={form.warmUp}
                  onChange={(e) => setForm({ ...form, warmUp: e.target.value })}
                  placeholder="Describe the warm-up activities..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
                />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closure
                </label>
                <textarea
                  value={form.closure}
                  onChange={(e) => setForm({ ...form, closure: e.target.value })}
                  placeholder="Describe the closing/cool-down activities..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Instructional Quality */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() =>
              setOpenPanels((prev) => ({ ...prev, instructionalQuality: !prev.instructionalQuality }))
            }
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold text-gray-900">Instructional Quality</span>
            <span className="text-sm text-gray-500">
              {openPanels.instructionalQuality ? 'Hide' : 'Show'}
            </span>
          </button>

          {openPanels.instructionalQuality && (
            <div className="px-4 pb-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Focus</label>
                  <select
                    value={form.skillFocus}
                    onChange={(e) => setForm({ ...form, skillFocus: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  >
                    <option value="">Select skill focus...</option>
                    {SKILL_FOCUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progression Level
                  </label>
                  <select
                    value={form.progressionLevel}
                    onChange={(e) => setForm({ ...form, progressionLevel: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  >
                    <option value="">Select progression level...</option>
                    {PROGRESSION_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Teacher Look-Fors
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillTeacherSupportField('teacherLookFors')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Add Examples
                    </button>
                    <button
                      type="button"
                      onClick={() => clearTeacherSupportField('teacherLookFors')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">What should you watch for during the activity?</p>
                <textarea
                  value={form.teacherLookFors}
                  onChange={(e) => setForm({ ...form, teacherLookFors: e.target.value })}
                  placeholder="- Eyes up and scanning for space\n- Uses correct form\n- Shows control"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Common Mistakes</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillTeacherSupportField('commonMistakes')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Add Examples
                    </button>
                    <button
                      type="button"
                      onClick={() => clearTeacherSupportField('commonMistakes')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">What do students commonly do wrong?</p>
                <textarea
                  value={form.commonMistakes}
                  onChange={(e) => setForm({ ...form, commonMistakes: e.target.value })}
                  placeholder="- Eyes down\n- Rushing without control\n- Forgetting the cue"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Coaching Language</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillTeacherSupportField('coachingLanguage')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Add Examples
                    </button>
                    <button
                      type="button"
                      onClick={handleSuggestCoachingLanguage}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Suggest Coaching Language
                    </button>
                    <button
                      type="button"
                      onClick={() => clearTeacherSupportField('coachingLanguage')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">Short phrases you can say while teaching</p>
                <textarea
                  value={form.coachingLanguage}
                  onChange={(e) => setForm({ ...form, coachingLanguage: e.target.value })}
                  placeholder="- Eyes up\n- Find open space\n- Control first"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Assessment */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setOpenPanels((prev) => ({ ...prev, assessment: !prev.assessment }))}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold text-gray-900">Assessment</span>
            <span className="text-sm text-gray-500">
              {openPanels.assessment ? 'Hide' : 'Show'}
            </span>
          </button>

          {openPanels.assessment && (
            <div className="px-4 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
              <textarea
                value={form.assessment}
                onChange={(e) => setForm({ ...form, assessment: e.target.value })}
                placeholder="How will you assess student learning?..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border-gray-300"
              />
            </div>
          )}
        </div>

        {/* Differentiation & Logistics */}
        <div className="mb-6 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() =>
              setOpenPanels((prev) => ({ ...prev, differentiation: !prev.differentiation }))
            }
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold text-gray-900">Differentiation &amp; Logistics</span>
            <span className="text-sm text-gray-500">
              {openPanels.differentiation ? 'Hide' : 'Show'}
            </span>
          </button>

          {openPanels.differentiation && (
            <div className="px-4 pb-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                <input
                  type="text"
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="e.g., Cones, soft balls, mats (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modifications</label>
                <textarea
                  value={form.modifications}
                  onChange={(e) => setForm({ ...form, modifications: e.target.value })}
                  placeholder="How to modify for different abilities (optional)..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes or instructions (optional)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="mb-8 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setOpenPanels((prev) => ({ ...prev, resources: !prev.resources }))}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-lg font-semibold text-gray-900">Resources</span>
            <span className="text-sm text-gray-500">
              {openPanels.resources ? 'Hide' : 'Show'}
            </span>
          </button>

          {openPanels.resources && (
            <div className="px-4 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attach Curriculum Resources (Optional)</h3>
              
              {selectedResources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Resources:</p>
                  <div className="space-y-2">
                    {selectedResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <p className="text-sm text-gray-600">{resource.unit}</p>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedResourceIds((prev) =>
                              prev.filter((id) => id !== resource.id)
                            )
                          }
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowResourcePanel(!showResourcePanel)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium mb-4"
              >
                {showResourcePanel ? 'Hide Resources' : '+ Add Resources'}
              </button>

              {showResourcePanel && (
                <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Select Resources</h4>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Search by title..."
                        value={resourceSearchQuery}
                        onChange={(e) => setResourceSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Level
                      </label>
                      <select
                        value={resourceFilterLevel}
                        onChange={(e) => {
                          setResourceFilterLevel(e.target.value);
                          setResourceFilterGrade('All');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="All">All Levels</option>
                        <option value="ELEMENTARY">Elementary</option>
                        <option value="MIDDLE">Middle</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade
                      </label>
                      <select
                        value={resourceFilterGrade}
                        onChange={(e) => setResourceFilterGrade(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="All">All Grades</option>
                        {availableResourceGrades.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        value={resourceFilterUnit}
                        onChange={(e) => setResourceFilterUnit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="All">All Units</option>
                        {uniqueResourceUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resource List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredResources.length > 0 ? (
                      filteredResources.map((resource) => (
                        <label
                          key={resource.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedResourceIds.includes(resource.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResourceIds((prev) => [...prev, resource.id]);
                              } else {
                                setSelectedResourceIds((prev) =>
                                  prev.filter((id) => id !== resource.id)
                                );
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{resource.title}</p>
                            <p className="text-sm text-gray-600">
                              {resource.band} • {resource.gradeGroup} • {resource.unit}
                            </p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm py-4">No resources match your filters.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveLesson}
          disabled={isSaveDisabled}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
        >
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/lessons"
          className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          View All Lessons
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
