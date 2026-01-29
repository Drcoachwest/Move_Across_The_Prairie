"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ActivityLogs() {
  const [logs] = useState([]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold">
            ← Admin Dashboard
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
            <h1 className="text-2xl font-bold">Activity Log</h1>
          </div>
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
