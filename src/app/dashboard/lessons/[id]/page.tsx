"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  band: string;
  gradeGroup: string;
  unit: string;
  durationMinutes: number;
  objectives: string;
  standards?: string;
  equipment?: string;
  warmUp: string;
  mainActivity: string;
  modifications?: string;
  assessment: string;
  closure: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByEmail: string;
}

interface CurriculumResource {
  id: string;
  title: string;
  unit: string;
  type?: string;
  fileUrl?: string;
  externalUrl?: string;
}

export default function LessonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<CurriculumResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchLesson();
    }
  }, [id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${id}`);
      if (response.status === 403) {
        setError("You don't have access to this lesson.");
        return;
      }
      if (response.status === 404) {
        setError("Lesson not found.");
        return;
      }
      if (!response.ok) {
        setError("Failed to load lesson.");
        return;
      }
      const data = await response.json();
      setLesson(data.lesson);
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      setError("An error occurred while loading the lesson.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;
    if (!confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/lessons");
      } else {
        alert("Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("An error occurred while deleting the lesson");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLesson = async () => {
    if (!lesson) return;

    setCopying(true);
    setCopyError(null);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/copy`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setCopyError(data.error || "Failed to copy lesson");
        return;
      }

      const data = await response.json();
      router.push(`/dashboard/lessons/${data.lessonId}?copied=1`);
    } catch (copyErr) {
      console.error("Error copying lesson:", copyErr);
      setCopyError("An error occurred while copying the lesson.");
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Loading lesson...</p>
        </main>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 text-lg">{error || "Lesson not found."}</p>
          <Link href="/dashboard/lessons" className="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">
            ← Back to Lesson Bank
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {searchParams.get("copied") === "1" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Lesson copied successfully. You can edit this lesson now.</p>
          </div>
        )}
        {searchParams.get("saved") === "1" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Lesson saved successfully.</p>
          </div>
        )}
        {copyError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{copyError}</p>
          </div>
        )}
        <article className="bg-white rounded-lg shadow-md p-8 space-y-8">
          {/* Title & Metadata */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/lessons/${lesson.id}/print`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium whitespace-nowrap"
                >
                  Print / Sub Plan
                </Link>
                <Link
                  href={`/dashboard/lessons/${lesson.id}/edit`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
                >
                  Edit Lesson
                </Link>
                <button
                  onClick={handleCopyLesson}
                  disabled={copying}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  {copying ? "Copying..." : "Copy Lesson"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {lesson.band}
              </span>
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Grades {lesson.gradeGroup}
              </span>
              <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {lesson.unit}
              </span>
              <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {lesson.durationMinutes} minutes
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Updated {new Date(lesson.updatedAt).toLocaleDateString()} at{" "}
              {new Date(lesson.updatedAt).toLocaleTimeString()}
            </p>
            <Link href="/dashboard/lessons" className="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">
              ← Back to Lesson Bank
            </Link>
          </div>

          <hr className="border-gray-200" />

          {/* Learning Objectives */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Learning Objectives</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{lesson.objectives}</p>
          </div>

          {/* Standards & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lesson.standards && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Standards</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.standards}</p>
              </div>
            )}
            {lesson.equipment && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Equipment</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.equipment}</p>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Lesson Flow */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Warm Up / Engagement</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lesson.warmUp}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Main Activity / Instruction</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lesson.mainActivity}</p>
            </div>

            {lesson.modifications && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Modifications / Differentiation</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.modifications}</p>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assessment</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lesson.assessment}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Closure / Cool Down</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{lesson.closure}</p>
            </div>
          </div>

          {lesson.notes && (
            <>
              <hr className="border-gray-200" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes & Reflections</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.notes}</p>
              </div>
            </>
          )}

          {resources.length > 0 && (
            <>
              <hr className="border-gray-200" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Attached Curriculum Resources</h2>
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{resource.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{resource.unit}</p>
                        {(resource.externalUrl || resource.fileUrl) && (
                          <div className="mt-2">
                            {resource.externalUrl && (
                              <a
                                href={resource.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Open Resource →
                              </a>
                            )}
                            {resource.fileUrl && (
                              <p className="text-sm text-gray-600 mt-1">📄 {resource.type}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <hr className="border-gray-200" />
        </article>
      </main>
    </div>
  );
}
