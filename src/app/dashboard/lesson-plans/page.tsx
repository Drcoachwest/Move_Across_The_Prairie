/**
 * @deprecated This page has been superseded by /dashboard/lessons (Lesson Bank)
 * and /dashboard/lesson-builder (Lesson Builder)
 * 
 * TODO: Remove this route and folder entirely in a future cleanup.
 * All functionality has been migrated to:
 * - GET lessons: /dashboard/lessons
 * - CREATE lessons: /dashboard/lesson-builder
 * 
 * As of February 2026, users should navigate through /dashboard/layout.tsx
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface LessonPlan {
  id: string;
  title: string;
  band: string;
  gradeGroup: string;
  unit: string;
  durationMinutes: number;
  objectives: string;
  createdAt: string;
}

export default function LessonPlans() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  const fetchLessonPlans = async () => {
    try {
      const response = await fetch("/api/lessons");
      const data = await response.json();
      if (data.lessons) {
        setLessonPlans(data.lessons);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted lesson plan from the state
        setLessonPlans(lessonPlans.filter(plan => plan.id !== id));
      } else {
        alert(data.error || "Failed to delete lesson plan");
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      alert("An error occurred while deleting the lesson plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex gap-4">
          <Link
            href="/dashboard/lesson-plans/new"
            className="btn-primary"
          >
            + Create New Lesson Plan
          </Link>
        </div>

        {lessonPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              You have not created any lesson plans yet.
            </p>
            <Link
              href="/dashboard/lesson-plans/new"
              className="btn-primary"
            >
              Create Your First Lesson Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessonPlans.map((plan) => (
              <div key={plan.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {plan.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(plan.id, plan.title)}
                    disabled={deletingId === plan.id}
                    className="text-red-600 hover:text-red-800 text-sm ml-2 disabled:opacity-50"
                    title="Delete lesson plan"
                  >
                    {deletingId === plan.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">{plan.band}</span>
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">Grades {plan.gradeGroup}</span>
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs">{plan.durationMinutes} min</span>
                </p>
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {plan.unit}
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  Created {new Date(plan.createdAt).toLocaleDateString()}
                </p>
                <Link
                  href={`/dashboard/lesson-plans/${plan.id}`}
                  className="text-blue-600 font-semibold"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
