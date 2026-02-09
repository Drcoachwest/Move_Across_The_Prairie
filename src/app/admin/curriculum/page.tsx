"use client";

import { useState, useEffect, useCallback } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  band: string;
  gradeGroup: string;
  unit: string;
  subject: string;
  type: string;
  tags: string;
  fileUrl?: string;
  externalUrl?: string;
  uploadedAt: string;
}

export default function AdminCurriculumPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBand, setSelectedBand] = useState("");
  const [selectedGradeGroup, setSelectedGradeGroup] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    band: "ELEMENTARY",
    gradeGroup: "",
    unit: "",
    subject: "Physical Education",
    tags: "",
    type: "link",
    externalUrl: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBand) params.set("band", selectedBand);
      if (selectedGradeGroup) params.set("gradeGroup", selectedGradeGroup);
      if (selectedUnit) params.set("unit", selectedUnit);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const queryString = params.toString();
      const response = await fetch(`/api/curriculum${queryString ? `?${queryString}` : ""}`);
      const data = await response.json();
      if (data.resources) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBand, selectedGradeGroup, selectedUnit, debouncedSearch]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const url = editingId ? `/api/curriculum/${editingId}` : "/api/curriculum";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: editingId ? "Resource updated successfully!" : "Resource added successfully!" });
        resetForm();
        await fetchResources(); // Refresh list
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save resource" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      title: resource.title,
      description: resource.description || "",
      band: resource.band,
      gradeGroup: resource.gradeGroup || "",
      unit: resource.unit || "",
      subject: resource.subject || "Physical Education",
      tags: resource.tags || "",
      type: resource.type,
      externalUrl: resource.externalUrl || "",
    });
    setEditingId(resource.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/curriculum/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Resource deleted successfully!" });
        await fetchResources(); // Refresh list
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to delete resource" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while deleting" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      band: "ELEMENTARY",
      gradeGroup: "",
      unit: "",
      subject: "Physical Education",
      tags: "",
      type: "link",
      externalUrl: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedBand("");
    setSelectedGradeGroup("");
    setSelectedUnit("");
  };

  // Auto-sync grade based on level selection
  useEffect(() => {
    if (selectedBand === "MIDDLE" && selectedGradeGroup !== "6-8") {
      setSelectedGradeGroup("6-8");
    } else if (selectedBand === "HIGH" && selectedGradeGroup !== "9-12") {
      setSelectedGradeGroup("9-12");
    } else if (selectedBand === "ELEMENTARY") {
      // Keep current if K-2 or 3-5, otherwise reset
      if (selectedGradeGroup !== "K-2" && selectedGradeGroup !== "3-5" && selectedGradeGroup !== "") {
        setSelectedGradeGroup("");
      }
    } else if (selectedBand === "" && selectedGradeGroup !== "") {
      // All levels - reset grade
      setSelectedGradeGroup("");
    }
  }, [selectedBand, selectedGradeGroup]);

  const hasActiveFilters =
    searchInput || selectedBand || selectedGradeGroup || selectedUnit;

  const units = [...new Set(resources.map((r) => r.unit).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Curriculum Resources</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? "Cancel" : "+ Add Resource"}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Resource" : "Add New Resource"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={formData.band}
                  onChange={(e) => setFormData({ ...formData, band: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="MIDDLE">Middle School</option>
                  <option value="HIGH">High School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <select
                  value={formData.gradeGroup}
                  onChange={(e) => setFormData({ ...formData, gradeGroup: e.target.value })}
                  className="input-field"
                >
                  <option value="">All Grades</option>
                  <option value="K-2">K-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., Locomotor Skills, Fitness"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">Document</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL/Link *
              </label>
              <input
                type="url"
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                placeholder="https://..."
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="game, elementary, outdoor"
                className="input-field"
              />
            </div>

            <div className="flex gap-3">
              <button 
                type="submit" 
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Saving..." : editingId ? "Update Resource" : "Add Resource"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, description, unit, or tags..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="input-field"
            >
              <option value="">All Levels</option>
              <option value="ELEMENTARY">Elementary</option>
              <option value="MIDDLE">Middle School</option>
              <option value="HIGH">High School</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            {selectedBand === "MIDDLE" || selectedBand === "HIGH" ? (
              <div>
                <input
                  type="text"
                  value={selectedGradeGroup}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBand === "MIDDLE" ? "Fixed for Middle School (6-8)" : "Fixed for High School (9-12)"}
                </p>
              </div>
            ) : (
              <select
                value={selectedGradeGroup}
                onChange={(e) => setSelectedGradeGroup(e.target.value)}
                className="input-field"
              >
                <option value="">All Grades</option>
                {selectedBand === "ELEMENTARY" ? (
                  <>
                    <option value="K-2">K-2</option>
                    <option value="3-5">3-5</option>
                  </>
                ) : (
                  <>
                    <option value="K-2">K-2</option>
                    <option value="3-5">3-5</option>
                    <option value="6-8">6-8</option>
                    <option value="9-12">9-12</option>
                  </>
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="input-field"
            >
              <option value="">All Units</option>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading resources...</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {hasActiveFilters
                      ? "No resources match your filters."
                      : "No resources yet. Click \"Add Resource\" to get started."}
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                      {resource.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {resource.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.band}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.gradeGroup || "All"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.unit || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      {resource.externalUrl && (
                        <a
                          href={resource.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
