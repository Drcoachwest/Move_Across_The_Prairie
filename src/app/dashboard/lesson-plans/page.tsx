"use client";

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Lesson Plans
          </h1>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.title}
                </h3>
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
