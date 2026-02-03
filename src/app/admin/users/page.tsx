"use client";

import { useState, useEffect } from "react";

interface Teacher {
  id: string;
  email: string;
  name: string;
  school: string;
  activated: boolean;
  activatedAt: string | null;
  createdAt: string;
  lastLogin?: string | null;
  locked?: boolean;
}

export default function Users() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "created" | "activated">("created");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterAndSortTeachers();
  }, [teachers, searchTerm, sortBy]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/students");
      const data = await response.json();
      if (data.success && data.teachers) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setMessage("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTeachers = () => {
    let filtered = teachers.filter(
      (teacher) =>
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.school.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "email":
          return a.email.localeCompare(b.email);
        case "activated":
          return (b.activated ? 1 : 0) - (a.activated ? 1 : 0);
        case "created":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredTeachers(filtered);
    setCurrentPage(1);
  };

  const handleResetPassword = async (email: string) => {
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Password reset link sent to ${email}`);
      } else {
        setMessage(data.message || "Failed to send reset link");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleDeactivateTeacher = async (email: string) => {
    if (!confirm("Deactivate this teacher? They won't be able to log in.")) return;

    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "deactivate" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Teacher deactivated");
        fetchTeachers();
      } else {
        setMessage(data.message || "Failed to deactivate teacher");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleActivateTeacher = async (email: string) => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "activate" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Teacher activated");
        fetchTeachers();
      } else {
        setMessage(data.message || "Failed to activate teacher");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleLockTeacher = async (email: string) => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "lock" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Teacher account locked");
        fetchTeachers();
      } else {
        setMessage(data.message || "Failed to lock teacher");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleUnlockTeacher = async (email: string) => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "unlock" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Teacher account unlocked");
        fetchTeachers();
      } else {
        setMessage(data.message || "Failed to unlock teacher");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleDeleteTeacher = async (email: string) => {
    if (!confirm("Permanently delete this teacher? This cannot be undone.")) return;

    try {
      const response = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Teacher deleted");
        fetchTeachers();
        setShowProfileModal(false);
      } else {
        setMessage(data.message || "Failed to delete teacher");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const handleResendActivationEmail = async (email: string) => {
    try {
      const response = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resend-activation" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Activation email sent to " + email);
      } else {
        setMessage(data.message || "Failed to send activation email");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {message}
          <button
            onClick={() => setMessage("")}
            className="ml-2 text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      <div className="card">
        <div className="mb-6">
          {/* Page Title and Stats */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredTeachers.length} {filteredTeachers.length === 1 ? 'teacher' : 'teachers'} total
                {searchTerm && ` (filtered from ${teachers.length})`}
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="search"
                placeholder="🔍 Search by email, name, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field text-sm py-2"
              >
                <option value="created">Newest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="email">Email (A-Z)</option>
                <option value="activated">Status</option>
              </select>
            </div>
          </div>

          {/* Results info */}
          {paginatedTeachers.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredTeachers.length)} of {filteredTeachers.length}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-8">Loading teachers...</p>
        ) : filteredTeachers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {searchTerm ? "No teachers match your search." : "No teachers registered yet."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">School</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Registered</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{teacher.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{teacher.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{teacher.school}</td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            teacher.activated
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {teacher.activated ? "Active" : "Inactive"}
                        </span>
                        {teacher.locked && (
                          <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowProfileModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teacher Management Modal */}
      {showProfileModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTeacher.name}</h2>
                <p className="text-sm text-gray-500">{selectedTeacher.email}</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {/* Teacher Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">School:</span>
                  <span className="font-medium text-gray-900">{selectedTeacher.school}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Status:</span>
                  <span>
                    {selectedTeacher.activated ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        ⚠ Inactive
                      </span>
                    )}
                    {selectedTeacher.locked && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        🔒 Locked
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedTeacher.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                {selectedTeacher.activatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activated:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedTeacher.activatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>

            <div className="space-y-3">
              {/* Account Status Section */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Account Status</p>
                {selectedTeacher.activated ? (
                  <button
                    onClick={() => handleDeactivateTeacher(selectedTeacher.email)}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                  >
                    🚫 Deactivate Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivateTeacher(selectedTeacher.email)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    ✅ Activate Account
                  </button>
                )}
              </div>

              {/* Security Actions */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Security</p>
                <button
                  onClick={() => {
                    if (confirm(`Send password reset link to ${selectedTeacher.email}?`)) {
                      handleResetPassword(selectedTeacher.email);
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2 text-sm"
                >
                  📧 Send Password Reset
                </button>
                {selectedTeacher.locked ? (
                  <button
                    onClick={() => handleUnlockTeacher(selectedTeacher.email)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    🔓 Unlock Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleLockTeacher(selectedTeacher.email)}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  >
                    🔒 Lock Account (Temporary)
                  </button>
                )}
              </div>

              {/* Additional Actions */}
              {!selectedTeacher.activated && (
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Activation</p>
                  <button
                    onClick={() => {
                      handleResendActivationEmail(selectedTeacher.email);
                      setShowProfileModal(false);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    📨 Resend Activation Email
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              <div className="border-t border-red-200 pt-3">
                <p className="text-xs font-semibold text-red-600 uppercase mb-2">⚠️ Danger Zone</p>
                <button
                  onClick={() => handleDeleteTeacher(selectedTeacher.email)}
                  className="w-full px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm"
                >
                  🗑️ Delete Teacher Permanently
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 text-sm font-medium"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
