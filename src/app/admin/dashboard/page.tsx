"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={async () => {
              const response = await fetch("/api/auth/admin-signout", { method: "POST" });
              window.location.href = response.url;
            }}
            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
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
          <Link href="/admin/documents">
            <div className="card cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Curriculum Documents
              </h3>
              <p className="text-gray-600 mb-4">
                Upload, organize, and manage curriculum materials and resources.
              </p>
              <span className="text-blue-600 font-semibold">
                Manage Documents →
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
      </main>
    </div>
  );
}
