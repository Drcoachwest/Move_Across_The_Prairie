"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface LessonPlan {
  id: string;
  title: string;
  teacher: string;
  campus: string;
  gradeLevel: string;
  date: string;
  isDraft: boolean;
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
      if (data.success) {
        setLessonPlans(data.lessonPlans);
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
      const response = await fetch(`/api/lessons?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted lesson plan from the state
        setLessonPlans(lessonPlans.filter(plan => plan.id !== id));
      } else {
        alert(data.message || "Failed to delete lesson plan");
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      alert("An error occurred while deleting the lesson plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
            ← Dashboard
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
              Lesson Plans
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
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
                  {plan.teacher} • {plan.campus} • Grade {plan.gradeLevel}
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  {plan.date} • {plan.isDraft ? "Draft" : "Published"}
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
      </main>
    </div>
  );
}
