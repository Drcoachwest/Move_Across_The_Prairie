"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  band: string;
  gradeGroup: string;
  unit: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export default function LessonBank() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedUnit, setSelectedUnit] = useState("All");

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [lessons, searchQuery, selectedLevel, selectedGrade, selectedUnit]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lessons");
      const data = await response.json();
      if (data.lessons) {
        setLessons(data.lessons);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...lessons];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(q) ||
          lesson.unit.toLowerCase().includes(q)
      );
    }

    // Level filter
    if (selectedLevel !== "All") {
      filtered = filtered.filter((lesson) => lesson.band === selectedLevel);
    }

    // Grade filter
    if (selectedGrade !== "All") {
      filtered = filtered.filter((lesson) => lesson.gradeGroup === selectedGrade);
    }

    // Unit filter
    if (selectedUnit !== "All") {
      filtered = filtered.filter((lesson) => lesson.unit === selectedUnit);
    }

    setFilteredLessons(filtered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLessons(lessons.filter((lesson) => lesson.id !== id));
      } else {
        alert("Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("An error occurred while deleting the lesson");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLesson = async (id: string) => {
    setCopyingId(id);
    try {
      const response = await fetch(`/api/lessons/${id}/copy`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to copy lesson");
        return;
      }

      const data = await response.json();
      router.push(`/dashboard/lessons/${data.lessonId}?copied=1`);
    } catch (error) {
      console.error("Error copying lesson:", error);
      alert("An error occurred while copying the lesson");
    } finally {
      setCopyingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("All");
    setSelectedGrade("All");
    setSelectedUnit("All");
  };

  const hasFiltersApplied =
    searchQuery.trim() !== "" ||
    selectedLevel !== "All" ||
    selectedGrade !== "All" ||
    selectedUnit !== "All";

  // Get unique units
  const uniqueUnits = Array.from(new Set(lessons.map((l) => l.unit))).sort();

  // Determine available grades based on selected level
  const getAvailableGrades = () => {
    if (selectedLevel === "All") {
      return ["K-2", "3-5", "6-8", "9-12"];
    } else if (selectedLevel === "ELEMENTARY") {
      return ["K-2", "3-5"];
    } else if (selectedLevel === "MIDDLE") {
      return ["6-8"];
    } else if (selectedLevel === "HIGH") {
      return ["9-12"];
    }
    return [];
  };

  const availableGrades = getAvailableGrades();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter & Search</h2>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Lessons
            </label>
            <input
              type="text"
              placeholder="Search by title, objectives, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  // Reset grade filter if level changes
                  if (e.target.value !== "All" && selectedGrade !== "All") {
                    setSelectedGrade("All");
                  }
                }}
                className="input-field w-full"
              >
                <option value="All">All Levels</option>
                <option value="ELEMENTARY">Elementary</option>
                <option value="MIDDLE">Middle School</option>
                <option value="HIGH">High School</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Group
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="input-field w-full"
              >
                <option value="All">All Grades</option>
                {availableGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="input-field w-full"
              >
                <option value="All">All Units</option>
                {uniqueUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasFiltersApplied && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Lessons List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">
              {hasFiltersApplied
                ? "No lessons match your filters."
                : "No lessons yet. Create one in Lesson Builder."}
            </p>
            {!hasFiltersApplied && (
              <Link
                href="/dashboard/lesson-plans/new"
                className="btn-primary w-fit mx-auto"
              >
                Create Your First Lesson
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {lesson.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {lesson.band}
                      </span>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Grades {lesson.gradeGroup}
                      </span>
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        {lesson.unit}
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {lesson.durationMinutes} min
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Updated {new Date(lesson.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 whitespace-nowrap">
                    <Link
                      href={`/dashboard/lessons/${lesson.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/lessons/${lesson.id}/edit`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleCopyLesson(lesson.id)}
                      disabled={copyingId === lesson.id}
                      className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium disabled:opacity-50"
                    >
                      {copyingId === lesson.id ? "Copying..." : "Copy"}
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id, lesson.title)}
                      disabled={deletingId === lesson.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === lesson.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
