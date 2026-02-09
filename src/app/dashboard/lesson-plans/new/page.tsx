"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CreateLessonPlan() {
  const [formData, setFormData] = useState({
    title: "",
    band: "ELEMENTARY",
    gradeGroup: "",
    unit: "",
    durationMinutes: "45",
    objectives: "",
    standards: "",
    equipment: "",
    warmUp: "",
    mainActivity: "",
    modifications: "",
    assessment: "",
    closure: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (draft: boolean) => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          band: formData.band,
          gradeGroup: formData.gradeGroup,
          unit: formData.unit,
          durationMinutes: parseInt(formData.durationMinutes, 10),
          objectives: formData.objectives,
          standards: formData.standards || null,
          equipment: formData.equipment || null,
          warmUp: formData.warmUp,
          mainActivity: formData.mainActivity,
          modifications: formData.modifications || null,
          assessment: formData.assessment,
          closure: formData.closure,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(draft ? "Saved as draft!" : "Published successfully!");
        setTimeout(() => {
          window.location.href = "/dashboard/lesson-plans";
        }, 1500);
      } else {
        setMessage(data.error || data.message || "Failed to save");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={72}
              height={72}
              className="h-12 sm:h-[72px] w-auto"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Create Lesson Plan
            </h1>
          </div>
          <div className="w-0 sm:w-20"></div>
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
                  Title *
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
                  Band *
                </label>
                <select
                  name="band"
                  value={formData.band}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="MIDDLE">Middle School</option>
                  <option value="HIGH">High School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Group *
                </label>
                <select
                  name="gradeGroup"
                  value={formData.gradeGroup}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select grade group</option>
                  <option value="K-2">K-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Unit 1, Locomotor Skills"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  className="input-field"
                  min="10"
                  max="180"
                  required
                />
              </div>
            </div>
          </div>

          {/* Standards and Objectives */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Standards and Objectives
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives *
                </label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  className="input-field h-24"
                  placeholder="What will students learn? What will they be able to do?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standards (TEKS, etc.)
                </label>
                <textarea
                  name="standards"
                  value={formData.standards}
                  onChange={handleInputChange}
                  className="input-field h-20"
                  placeholder="Enter relevant standards..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Needed
                </label>
                <textarea
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  className="input-field h-20"
                  placeholder="List materials and equipment..."
                />
              </div>
            </div>
          </div>

          {/* Lesson Activities and Instruction */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lesson Activities
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warm Up / Engagement *
                </label>
                <textarea
                  name="warmUp"
                  value={formData.warmUp}
                  onChange={handleInputChange}
                  className="input-field h-20"
                  placeholder="How will you engage students and prepare them for the lesson?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Activity / Instruction *
                </label>
                <textarea
                  name="mainActivity"
                  value={formData.mainActivity}
                  onChange={handleInputChange}
                  className="input-field h-32"
                  placeholder="Describe the main lesson activity, practice, and application..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modifications / Differentiation
                </label>
                <textarea
                  name="modifications"
                  value={formData.modifications}
                  onChange={handleInputChange}
                  className="input-field h-20"
                  placeholder="How will you adapt for different skill levels?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closure / Cool Down *
                </label>
                <textarea
                  name="closure"
                  value={formData.closure}
                  onChange={handleInputChange}
                  className="input-field h-20"
                  placeholder="How will you wrap up and review learning?"
                  required
                />
              </div>
            </div>
          </div>

          {/* Assessment and Notes */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assessment and Notes
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment *
                </label>
                <textarea
                  name="assessment"
                  value={formData.assessment}
                  onChange={handleInputChange}
                  className="input-field h-24"
                  placeholder="How will you assess student learning? What are you looking for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Reflections
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-field h-24"
                  placeholder="Any additional notes, reflections, or observations..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Lesson"}
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
