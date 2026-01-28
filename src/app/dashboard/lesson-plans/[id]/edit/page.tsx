"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface LessonPlan {
  id: string;
  title: string;
  teacher: string;
  campus: string;
  gradeLevel: string;
  date: string;
  safetyAndManagement: string;
  instantActivityWarmUp: string;
  skillIntroduction: string;
  skillPractice: string;
  applicationActivity: string;
  coolDownClosure: string;
  assessment: string;
  mvpa: string;
  adaptations: string;
  teacherReflections: string;
  isDraft: boolean;
}

export default function EditLessonPlan() {
  const params = useParams();
  const router = useRouter();
  const lessonPlanId = params.id as string;
  
  const [formData, setFormData] = useState<LessonPlan | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchLessonPlan();
    fetchResources();
  }, [lessonPlanId]);

  const fetchLessonPlan = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonPlanId}`);
      const data = await response.json();
      if (data.success && data.lessonPlan) {
        setFormData(data.lessonPlan);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching lesson plan:", error);
      setNotFound(true);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/admin/resources");
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSave = async (draft: boolean) => {
    if (!formData) return;
    
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/lessons/${lessonPlanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isDraft: draft,
          selectedResources,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(draft ? "Saved as draft!" : "Published successfully!");
        setTimeout(() => {
          router.push("/dashboard/lesson-plans");
        }, 1500);
      } else {
        setMessage(data.message || "Failed to save");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
              ← Back to Lesson Plans
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Lesson plan not found.</p>
            <Link href="/dashboard/lesson-plans" className="btn-primary">
              Back to Lesson Plans
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
              ← Back to Lesson Plans
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Lesson Plan
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <form className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg text-sm ${
                message.includes("success") || message.includes("Saved") || message.includes("Published")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Basic Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lesson Information
            </h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Name
                </label>
                <input
                  type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus
                </label>
                <input
                  type="text"
                  name="campus"
                  value={formData.campus}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="K, 1st, 2nd, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Safety and Management Considerations */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Safety and Management Considerations
            </h2>
            <textarea
              name="safetyAndManagement"
              value={formData.safetyAndManagement}
              onChange={handleInputChange}
              className="input-field h-24"
              placeholder="Enter any safety and management considerations..."
            />
          </div>

          {/* Lesson Activities and Instruction */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lesson Activities and Instruction
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instant Activity / Warm Up
                </label>
                <textarea
                  name="instantActivityWarmUp"
                  value={formData.instantActivityWarmUp}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Introduction
                </label>
                <textarea
                  name="skillIntroduction"
                  value={formData.skillIntroduction}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Practice
                </label>
                <textarea
                  name="skillPractice"
                  value={formData.skillPractice}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Activity
                </label>
                <textarea
                  name="applicationActivity"
                  value={formData.applicationActivity}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cool Down / Closure
                </label>
                <textarea
                  name="coolDownClosure"
                  value={formData.coolDownClosure}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>
            </div>
          </div>

          {/* Resource Picker */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Curriculum Resources
              </h2>
              <button
                type="button"
                onClick={() => setShowResourcePicker(!showResourcePicker)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showResourcePicker ? "Hide Resources" : "Select Resources"}
              </button>
            </div>

            {showResourcePicker && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                {resources.length === 0 ? (
                  <p className="text-sm text-gray-600">No resources available</p>
                ) : (
                  <div className="space-y-2">
                    {resources.map((resource) => (
                      <label key={resource.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => handleResourceToggle(resource.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {resource.title}
                          <span className="text-xs text-gray-500 ml-2">
                            ({resource.type})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedResources.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                {selectedResources.length} resource(s) selected
              </div>
            )}
          </div>

          {/* Assessment and Reflection */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assessment and Reflection
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment (What are you looking for?)
                </label>
                <textarea
                  name="assessment"
                  value={formData.assessment}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MVPA (Moderate to Vigorous Physical Activity)
                </label>
                <textarea
                  name="mvpa"
                  value={formData.mvpa}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adaptations
                </label>
                <textarea
                  name="adaptations"
                  value={formData.adaptations}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Reflections
                </label>
                <textarea
                  name="teacherReflections"
                  value={formData.teacherReflections}
                  onChange={handleInputChange}
                  className="input-field h-20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
            <Link
              href="/dashboard/lesson-plans"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
