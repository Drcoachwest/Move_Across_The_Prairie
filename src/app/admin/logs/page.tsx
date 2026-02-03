"use client";

import { useState } from "react";

export default function ActivityLogs() {
  const [logs] = useState([]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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
    </div>
  );
}
