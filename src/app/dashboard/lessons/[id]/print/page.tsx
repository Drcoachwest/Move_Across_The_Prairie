'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  skillFocus?: string;
  progressionLevel?: string;
  teacherLookFors?: string;
  commonMistakes?: string;
  coachingLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

interface CurriculumResource {
  id: string;
  title: string;
  unit: string;
  type?: string;
  fileUrl?: string;
  externalUrl?: string;
}

export default function PrintLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<CurriculumResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeTeacherSupport, setIncludeTeacherSupport] = useState(true);
  const [includeResources, setIncludeResources] = useState(true);

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
      console.error('Error fetching lesson:', error);
      setError('An error occurred while loading the lesson.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push(`/dashboard/lessons/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-gray-600">Loading lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-red-600 text-lg mb-4">{error || 'Lesson not found.'}</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .print-container {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          h1 {
            page-break-after: avoid;
          }
          h2 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .print-section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-container max-w-5xl mx-auto px-6 py-8">
        {/* Screen-only controls */}
        <div className="no-print mb-6 flex flex-wrap gap-4 items-center">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Print Lesson
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Back to Lesson
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeTeacherSupport}
              onChange={(e) => setIncludeTeacherSupport(e.target.checked)}
            />
            Include Teacher Support Tools
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeResources}
              onChange={(e) => setIncludeResources(e.target.checked)}
            />
            Include Resources List
          </label>
        </div>

        {/* Print content */}
        <div className="bg-white">
          {/* Header */}
          <header className="mb-8 pb-4 border-b-2 border-gray-300">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
              <span><strong>Level:</strong> {lesson.band}</span>
              <span><strong>Grade:</strong> {lesson.gradeGroup}</span>
              <span><strong>Unit:</strong> {lesson.unit}</span>
              <span><strong>Duration:</strong> {lesson.durationMinutes} minutes</span>
            </div>
            <p className="text-sm text-gray-600">
              Last Updated: {new Date(lesson.updatedAt).toLocaleDateString()} at{' '}
              {new Date(lesson.updatedAt).toLocaleTimeString()}
            </p>
          </header>

          {/* Learning Objectives */}
          <section className="print-section mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Learning Objectives</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.objectives}</p>
          </section>

          {/* Standards */}
          {lesson.standards && (
            <section className="print-section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Standards</h2>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.standards}</p>
            </section>
          )}

          {/* Equipment */}
          {lesson.equipment && (
            <section className="print-section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Equipment Needed</h2>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.equipment}</p>
            </section>
          )}

          {/* Warm-Up */}
          <section className="print-section mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Warm-Up / Engagement</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.warmUp}</p>
          </section>

          {/* Main Activity */}
          <section className="print-section mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Main Activity / Instruction</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.mainActivity}</p>
          </section>

          {/* Teacher Support Tools */}
          {includeTeacherSupport &&
            (lesson.skillFocus ||
              lesson.progressionLevel ||
              lesson.teacherLookFors ||
              lesson.commonMistakes ||
              lesson.coachingLanguage) && (
              <section className="print-section mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Teacher Support Tools</h2>
                <div className="space-y-3 text-gray-800">
                  {lesson.skillFocus && (
                    <p><strong>Skill Focus:</strong> {lesson.skillFocus}</p>
                  )}
                  {lesson.progressionLevel && (
                    <p><strong>Progression Level:</strong> {lesson.progressionLevel}</p>
                  )}
                  {lesson.teacherLookFors && (
                    <div>
                      <p className="font-semibold">Teacher Look-Fors</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{lesson.teacherLookFors}</p>
                    </div>
                  )}
                  {lesson.commonMistakes && (
                    <div>
                      <p className="font-semibold">Common Mistakes</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{lesson.commonMistakes}</p>
                    </div>
                  )}
                  {lesson.coachingLanguage && (
                    <div>
                      <p className="font-semibold">Coaching Language</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{lesson.coachingLanguage}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Modifications */}
          {lesson.modifications && (
            <section className="print-section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Modifications / Differentiation</h2>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.modifications}</p>
            </section>
          )}

          {/* Assessment */}
          <section className="print-section mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.assessment}</p>
          </section>

          {/* Closure */}
          <section className="print-section mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Closure / Cool Down</h2>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.closure}</p>
          </section>

          {/* Notes */}
          {lesson.notes && (
            <section className="print-section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Notes & Reflections</h2>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{lesson.notes}</p>
            </section>
          )}

          {/* Curriculum Resources */}
          {includeResources && resources.length > 0 && (
            <section className="print-section mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Curriculum Resources</h2>
              <ul className="space-y-2">
                {resources.map((resource) => (
                  <li key={resource.id} className="text-gray-800">
                    <strong>{resource.title}</strong> - {resource.unit}
                    {resource.externalUrl && (
                      <div className="text-sm text-gray-600 ml-4">
                        URL: {resource.externalUrl}
                      </div>
                    )}
                    {resource.fileUrl && (
                      <div className="text-sm text-gray-600 ml-4">
                        File: {resource.type}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Screen-only controls at bottom */}
        <div className="no-print mt-8 flex gap-4">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Print Lesson
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Back to Lesson
          </button>
        </div>
      </div>
    </>
  );
}
