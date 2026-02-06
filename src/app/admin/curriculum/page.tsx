"use client";

import { useState, useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  band: string;
  grade: string;
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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    band: "ELEMENTARY",
    grade: "",
    unit: "",
    subject: "Physical Education",
    tags: "",
    type: "link",
    externalUrl: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/curriculum");
      const data = await response.json();
      if (data.resources) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

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
        setMessage({ type: "success", text: editingId ? "Resource updated!" : "Resource added!" });
        resetForm();
        fetchResources();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save resource" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      title: resource.title,
      description: resource.description || "",
      band: resource.band,
      grade: resource.grade || "",
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
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const response = await fetch(`/api/curriculum/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Resource deleted!" });
        fetchResources();
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to delete resource" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      band: "ELEMENTARY",
      grade: "",
      unit: "",
      subject: "Physical Education",
      tags: "",
      type: "link",
      externalUrl: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

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
                  Band/Level *
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
                  Grade Group
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
              <button type="submit" className="btn-primary">
                {editingId ? "Update Resource" : "Add Resource"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                  Band
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
                    No resources yet. Click "Add Resource" to get started.
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
                      {resource.grade || "All"}
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
