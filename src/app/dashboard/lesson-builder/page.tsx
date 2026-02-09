'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLessonDraft } from '@/lib/lessonSuggestions';

const GRADE_GROUPS: Record<string, string[]> = {
  ELEMENTARY: ['K-2', '3-5'],
  MIDDLE: ['6-8'],
  HIGH: ['9-12'],
};

const DURATIONS = [30, 45, 60, 90];

interface FormData {
  title: string;
  band: string;
  gradeGroup: string;
  unit: string;
  customUnit: string;
  durationMinutes: number;
  equipment: string;
  objectives: string;
  warmUp: string;
  mainActivity: string;
  modifications: string;
  assessment: string;
  closure: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
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
    equipment: '',
    objectives: '',
    warmUp: '',
    mainActivity: '',
    modifications: '',
    assessment: '',
    closure: '',
    notes: '',
  });

  const [units, setUnits] = useState<string[]>([]);
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  
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
          const curriculumUnits = Array.from(
            new Set((data.curriculum || []).map((item: any) => item.unit).filter(Boolean))
          );
          setUnits(curriculumUnits.sort());
          setAllResources(data.curriculum || []);
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

  // Generate draft from section 1
  const handleGenerateDraft = () => {
    const requiredFields = ['title', 'unit', 'objectives'];
    const actualUnit = showCustomUnit ? form.customUnit : form.unit;

    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!actualUnit.trim()) newErrors.unit = 'Unit is required';
    if (!form.objectives.trim()) newErrors.objectives = 'Objectives are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const draft = getLessonDraft({
      band: form.band,
      gradeGroup: form.gradeGroup,
      unit: actualUnit,
      durationMinutes: form.durationMinutes,
    });

    setForm((prev) => ({
      ...prev,
      unit: showCustomUnit ? '' : prev.unit,
      customUnit: showCustomUnit ? actualUnit : '',
      warmUp: draft.warmUp,
      mainActivity: draft.mainActivity,
      modifications: draft.modifications || '',
      assessment: draft.assessment,
      closure: draft.closure,
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
      equipment: '',
      objectives: '',
      warmUp: '',
      mainActivity: '',
      modifications: '',
      assessment: '',
      closure: '',
      notes: '',
    });
    setShowCustomUnit(false);
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
    if (!form.warmUp.trim()) newErrors.warmUp = 'Warm-up is required';
    if (!form.mainActivity.trim()) newErrors.mainActivity = 'Main activity is required';
    if (!form.assessment.trim()) newErrors.assessment = 'Assessment is required';
    if (!form.closure.trim()) newErrors.closure = 'Closure is required';

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
          equipment: form.equipment.trim() || null,
          objectives: form.objectives.trim(),
          warmUp: form.warmUp.trim(),
          mainActivity: form.mainActivity.trim(),
          modifications: form.modifications.trim() || null,
          assessment: form.assessment.trim(),
          closure: form.closure.trim(),
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

  const isSection1Complete =
    form.title.trim() &&
    (showCustomUnit ? form.customUnit.trim() : form.unit) &&
    form.objectives.trim();

  const isSection2Complete =
    form.warmUp.trim() &&
    form.mainActivity.trim() &&
    form.assessment.trim() &&
    form.closure.trim();

  const isSaveDisabled = !isSection1Complete || !isSection2Complete || saving;

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Builder</h1>
        <p className="text-gray-600">Create PE lessons with guided suggestions</p>
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
              {units.map((u) => (
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

        {/* Equipment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
          <input
            type="text"
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            placeholder="e.g., Cones, soft balls, mats (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
        <div className="flex gap-4">
          <button
            onClick={handleGenerateDraft}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Generating...' : 'Generate Draft'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SECTION 2: LESSON CONTENT */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Section 2: Lesson Content</h2>

        {/* Warm-Up */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warm-Up <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.warmUp}
            onChange={(e) => setForm({ ...form, warmUp: e.target.value })}
            placeholder="Describe the warm-up activities..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.warmUp ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.warmUp && <p className="text-red-500 text-sm mt-1">{errors.warmUp}</p>}
        </div>

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

        {/* Modifications */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Modifications</label>
          <textarea
            value={form.modifications}
            onChange={(e) => setForm({ ...form, modifications: e.target.value })}
            placeholder="How to modify for different abilities (optional)..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Assessment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.assessment}
            onChange={(e) => setForm({ ...form, assessment: e.target.value })}
            placeholder="How will you assess student learning?..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.assessment ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.assessment && (
            <p className="text-red-500 text-sm mt-1">{errors.assessment}</p>
          )}
        </div>

        {/* Closure */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closure <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.closure}
            onChange={(e) => setForm({ ...form, closure: e.target.value })}
            placeholder="Describe the closing/cool-down activities..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.closure ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.closure && <p className="text-red-500 text-sm mt-1">{errors.closure}</p>}
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional notes or instructions (optional)..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Attach Curriculum Resources */}
        <div className="mb-8 border-t pt-6">
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
