'use client';

import Link from 'next/link';

export default function TeacherDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Welcome to Your Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FitnessGram Assessment Card */}
        <Link
          href="/teacher/assessment"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">🏃</div>
            <h3 className="text-lg font-semibold text-gray-900">
              FitnessGram Assessment
            </h3>
          </div>
          <p className="text-gray-600">
            Enter and view FitnessGram test scores for your PE students
          </p>
        </Link>

        {/* Curriculum Library Card */}
        <Link
          href="/dashboard/curriculum"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Curriculum Library
            </h3>
          </div>
          <p className="text-gray-600">
            Browse curriculum resources by grade, unit, and band
          </p>
        </Link>

        {/* Lesson Plans Card */}
        <Link
          href="/dashboard/lesson-plans"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">✏️</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Lesson Plans
            </h3>
          </div>
          <p className="text-gray-600">
            Create and manage lesson plans
          </p>
        </Link>

        {/* Reports Card */}
        <Link
          href="/teacher/dashboard/reports"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reports
            </h3>
          </div>
          <p className="text-gray-600">
            View fitness data analytics and export reports
          </p>
        </Link>

        {/* PACER Improvement Tracker Card */}
        <Link
          href="/teacher/dashboard/pacer-comparison"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900">
              PACER Improvement Tracker
            </h3>
          </div>
          <p className="text-gray-600">
            Compare Fall vs Spring performance and track student growth
          </p>
        </Link>
      </div>
    </div>
  );
}
