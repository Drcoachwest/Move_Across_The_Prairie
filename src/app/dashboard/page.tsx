"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Welcome to Your Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Curriculum Library Card */}
        <Link href="/dashboard/curriculum">
          <div className="card cursor-pointer hover:shadow-lg transition">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Curriculum Library
            </h3>
            <p className="text-gray-600 mb-4">
              Browse, view, and download curriculum documents, PDFs, Word documents, and resource links.
            </p>
            <span className="text-blue-600 font-semibold">
              Go to Library →
            </span>
          </div>
        </Link>

        {/* Lesson Plan Builder Card */}
        <Link href="/dashboard/lesson-plans">
          <div className="card cursor-pointer hover:shadow-lg transition">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Lesson Plan Builder
            </h3>
            <p className="text-gray-600 mb-4">
              Create and manage lesson plans with helpful templates, prompts, and save your work.
            </p>
            <span className="text-blue-600 font-semibold">
              Create Lesson Plan →
            </span>
          </div>
        </Link>

        {/* Assessment Data Card */}
        <Link href="/teacher/assessment">
          <div className="card cursor-pointer hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Assessment Data
            </h3>
            <p className="text-gray-600 mb-4">
              View student FitnessGram test results, track progress, and compare fall vs. spring data.
            </p>
            <span className="text-blue-600 font-semibold">
              View Assessment →
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Stats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-gray-600 text-sm">Lesson Plans</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-gray-600 text-sm">Documents Downloaded</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-gray-600 text-sm">Resources Saved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
