"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Users() {
  const [users] = useState([]);

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
            <h1 className="text-2xl font-bold">User Management</h1>
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Teachers
            </h3>
            <input
              type="search"
              placeholder="Search users..."
              className="input-field w-64"
            />
          </div>

          {users.length === 0 ? (
            <p className="text-gray-600">
              No teachers have activated their accounts yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-700">Email</th>
                    <th className="text-left py-2 text-gray-700">Name</th>
                    <th className="text-left py-2 text-gray-700">Activated</th>
                    <th className="text-left py-2 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Table rows will be populated from users state */}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
