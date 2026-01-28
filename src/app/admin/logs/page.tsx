"use client";

import Link from "next/link";
import { useState } from "react";

export default function ActivityLogs() {
  const [logs] = useState([]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold">
            ← Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <button
            onClick={async () => {
              await fetch("/api/auth/admin-signout", { method: "POST" });
            }}
            className="text-sm hover:underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>

          {logs.length === 0 ? (
            <p className="text-gray-600">
              No activity logged yet.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Log items will be populated here */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
