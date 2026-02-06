"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Administration & Control Center
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activation Codes Card */}
          <Link href="/admin/activation-codes">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activation Codes
              </h3>
              <p className="text-gray-600 mb-4">
                Create, manage, and track activation codes for teacher access.
              </p>
              <span className="text-blue-600 font-semibold">
                Manage Codes →
              </span>
            </div>
          </Link>

          {/* User Management Card */}
          <Link href="/admin/users">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                User Management
              </h3>
              <p className="text-gray-600 mb-4">
                View and manage teacher accounts, deactivate users, and manage permissions.
              </p>
              <span className="text-blue-600 font-semibold">
                Manage Users →
              </span>
            </div>
          </Link>

          {/* Documents Card */}
          <Link href="/admin/curriculum">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Curriculum Hub
              </h3>
              <p className="text-gray-600 mb-4">
                Add, edit, and manage curriculum resources for all grade levels.
              </p>
              <span className="text-blue-600 font-semibold">
                Manage Resources →
              </span>
            </div>
          </Link>

          {/* Activity Log Card */}
          <Link href="/admin/logs">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activity Log
              </h3>
              <p className="text-gray-600 mb-4">
                Review system activity, admin actions, and user access logs.
              </p>
              <span className="text-blue-600 font-semibold">
                View Logs →
              </span>
            </div>
          </Link>

          {/* FitnessGram Assessment Card */}
          <Link href="/admin/assessment">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                FitnessGram Assessment
              </h3>
              <p className="text-gray-600 mb-4">
                Import student data, enter fitness test results, and track progress.
              </p>
              <span className="text-blue-600 font-semibold">
                Manage Assessment →
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Stats */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            System Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-gray-600 text-sm">Active Teachers</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-gray-600 text-sm">Available Codes</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <p className="text-gray-600 text-sm">Documents</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <p className="text-gray-600 text-sm">Lesson Plans Created</p>
            </div>
          </div>
        </div>
    </div>
  );
}
