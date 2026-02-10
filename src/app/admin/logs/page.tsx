"use client";

import { useEffect, useMemo, useState } from "react";

interface AdminLog {
  id: string;
  action: string;
  adminEmail: string;
  details: Record<string, unknown> | string | null;
  createdAt: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  const [actionFilter, setActionFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (actionFilter.trim()) params.set("action", actionFilter.trim());
      if (adminFilter.trim()) params.set("adminEmail", adminFilter.trim());
      if (search.trim()) params.set("search", search.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[ActivityLogs] API error:", response.status, errorData);
        throw new Error("Failed to load logs");
      }

      const data = await response.json();
      console.log("[ActivityLogs] Loaded logs:", data.total, "total,", data.logs?.length, "on page", data.page);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError("Unable to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setAdminFilter("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchLogs();
  };

  const formatDetails = (details: AdminLog["details"]) => {
    if (!details) return "";
    if (typeof details === "string") return details;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600">
              Track admin actions, system changes, and access events.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {total > 0 ? `${total} total events` : "No events logged"}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Action
              </label>
              <input
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="activation_code, teacher_lock..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Admin
              </label>
              <input
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Search details
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="teacher email, resource title"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading activity logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-600">No activity logged yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600">{log.adminEmail}</span>
                </div>
                {log.details && (
                  <pre className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-wrap">
                    {formatDetails(log.details)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
