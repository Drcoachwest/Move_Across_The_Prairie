'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  durationMinutes: number;
  equipment: string;
  objectives: string;
  standards: string;
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

interface CurriculumResource {
  id: string;
  title: string;
  unit: string;
  band: string;
  gradeGroup: string;
  type?: string;
  fileUrl?: string;
  externalUrl?: string;
}

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title: '',
    band: 'ELEMENTARY',
    gradeGroup: 'K-2',
    unit: '',
    durationMinutes: 45,
    equipment: '',
    objectives: '',
    standards: '',
    warmUp: '',
    mainActivity: '',
    modifications: '',
    assessment: '',
    closure: '',
    notes: '',
  });

  // Resource management
  const [allResources, setAllResources] = useState<CurriculumResource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [resourceFilterLevel, setResourceFilterLevel] = useState('All');
  const [resourceFilterGrade, setResourceFilterGrade] = useState('All');
  const [resourceFilterUnit, setResourceFilterUnit] = useState('All');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchLesson();
      fetchResources();
    }
  }, [id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${id}`);
      if (response.status === 403) {
        setLoadError("You don't have permission to edit this lesson.");
        return;
      }
      if (response.status === 404) {
        setLoadError("Lesson not found.");
        return;
      }
      if (!response.ok) {
        setLoadError("Failed to load lesson.");
        return;
      }

      const data = await response.json();
      const lesson = data.lesson;

      setForm({
        title: lesson.title || '',
        band: lesson.band || 'ELEMENTARY',
        gradeGroup: lesson.gradeGroup || 'K-2',
        unit: lesson.unit || '',
        durationMinutes: lesson.durationMinutes || 45,
        equipment: lesson.equipment || '',
        objectives: lesson.objectives || '',
        standards: lesson.standards || '',
        warmUp: lesson.warmUp || '',
        mainActivity: lesson.mainActivity || '',
        modifications: lesson.modifications || '',
        assessment: lesson.assessment || '',
        closure: lesson.closure || '',
        notes: lesson.notes || '',
      });

      // Load attached resource IDs
      if (lesson.resourceIds) {
        const ids = lesson.resourceIds.split(',').filter(Boolean);
        setSelectedResourceIds(ids);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setLoadError('An error occurred while loading the lesson.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/curriculum');
      if (response.ok) {
        const data = await response.json();
        setAllResources(data.curriculum || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const handleBandChange = (newBand: string) => {
    const newGradeGroup = GRADE_GROUPS[newBand][0];
    setForm((prev) => ({
      ...prev,
      band: newBand,
      gradeGroup: newGradeGroup,
    }));
  };

  const handleSave = async () => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.unit.trim()) newErrors.unit = 'Unit is required';
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
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          band: form.band,
          gradeGroup: form.gradeGroup,
          unit: form.unit.trim(),
          durationMinutes: form.durationMinutes,
          equipment: form.equipment.trim() || null,
          objectives: form.objectives.trim(),
          standards: form.standards.trim() || null,
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

      router.push(`/dashboard/lessons/${id}?saved=1`);
    } catch (err) {
      setErrors({ submit: 'An error occurred while saving the lesson' });
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Resource filtering
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

  const uniqueResourceUnits = Array.from(
    new Set(allResources.map((r) => r.unit).filter(Boolean))
  ).sort();

  const availableResourceGrades = getAvailableResourceGrades();
  const filteredResources = getFilteredResources();
  const selectedResources = allResources.filter((r) => selectedResourceIds.includes(r.id));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 text-center">Loading lesson...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{loadError}</p>
        </div>
        <Link
          href="/dashboard/lessons"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Lesson Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Lesson</h1>
        <Link
          href={`/dashboard/lessons/${id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Cancel and return to lesson
        </Link>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lesson Information</h2>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            }`}
          />
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

        {/* Standards */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Standards</label>
          <textarea
            value={form.standards}
            onChange={(e) => setForm({ ...form, standards: e.target.value })}
            placeholder="PE standards addressed (optional)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Objectives */}
        <div className="mb-6">
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
          {errors.objectives && <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lesson Content</h2>

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
          {errors.mainActivity && <p className="text-red-500 text-sm mt-1">{errors.mainActivity}</p>}
        </div>

        {/* Modifications */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Modifications</label>
          <textarea
            value={form.modifications}
            onChange={(e) => setForm({ ...form, modifications: e.target.value })}
            placeholder="Describe modifications for different skill levels..."
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
            placeholder="How will you assess student learning..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.assessment ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.assessment && <p className="text-red-500 text-sm mt-1">{errors.assessment}</p>}
        </div>

        {/* Closure */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closure <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.closure}
            onChange={(e) => setForm({ ...form, closure: e.target.value })}
            placeholder="How will you wrap up the lesson..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.closure ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.closure && <p className="text-red-500 text-sm mt-1">{errors.closure}</p>}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes or reflections (optional)..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      {/* Curriculum Resources */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Curriculum Resources (Optional)</h2>

        {/* Selected Resources */}
        {selectedResources.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Attached Resources:</p>
            <div className="space-y-2">
              {selectedResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{resource.title}</p>
                    <p className="text-xs text-gray-600">{resource.unit}</p>
                  </div>
                  <button
                    onClick={() => setSelectedResourceIds(selectedResourceIds.filter((rid) => rid !== resource.id))}
                    className="ml-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Resources */}
        <button
          onClick={() => setShowResourcePanel(!showResourcePanel)}
          className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 font-medium"
        >
          {showResourcePanel ? 'Hide Resources' : 'Add Resources'}
        </button>

        {showResourcePanel && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={resourceFilterLevel}
                  onChange={(e) => {
                    setResourceFilterLevel(e.target.value);
                    setResourceFilterGrade('All');
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={resourceFilterGrade}
                  onChange={(e) => setResourceFilterGrade(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  {availableResourceGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={resourceFilterUnit}
                  onChange={(e) => setResourceFilterUnit(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  {uniqueResourceUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={resourceSearchQuery}
                  onChange={(e) => setResourceSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Resource List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredResources.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No resources match your filters.</p>
              ) : (
                filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedResourceIds.includes(resource.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResourceIds([...selectedResourceIds, resource.id]);
                        } else {
                          setSelectedResourceIds(selectedResourceIds.filter((rid) => rid !== resource.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{resource.title}</p>
                      <p className="text-xs text-gray-600">{resource.unit}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <Link
          href={`/dashboard/lessons/${id}`}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
