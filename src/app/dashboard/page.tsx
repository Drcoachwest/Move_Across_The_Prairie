"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const [userEmail] = useState("teacher@gpisd.org"); // This would come from session

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={120}
              height={120}
              className="h-[88px] sm:h-[120px] w-auto"
              priority
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Move Across the Prairie
            </h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={async () => {
                const response = await fetch("/api/auth/signout", { method: "POST" });
                window.location.href = response.url;
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
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
          <Link href="/dashboard/assessment">
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
      </main>
    </div>
  );
}
