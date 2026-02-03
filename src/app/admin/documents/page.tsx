"use client";

import { useState, useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  grade: string;
  unit: string;
  subject: string;
  type: string;
  tags: string[];
  fileUrl?: string;
  externalUrl?: string;
  uploadedAt: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("");
  const [unit, setUnit] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("pdf");
  const [tags, setTags] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/curriculum");
      const data = await response.json();
      if (data.resources) {
        setResources(data.resources.map((r: any) => ({
          ...r,
          tags: r.tags ? r.tags.split(",") : [],
        })));
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("grade", grade);
      formData.append("unit", unit);
      formData.append("subject", subject);
      formData.append("type", type);
      formData.append("tags", tags);
      
      if (type === "link") {
        formData.append("externalUrl", externalUrl);
      } else if (file) {
        formData.append("file", file);
      } else if (!editingId) {
        setMessage("Please select a file to upload");
        setLoading(false);
        return;
      }

      const url = editingId ? `/api/curriculum?id=${editingId}` : "/api/curriculum";
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMessage(editingId ? "Resource updated successfully!" : "Resource added successfully!");
        fetchResources(); // Refresh the list
        // Reset form
        setEditingId(null);
        setTitle("");
        setDescription("");
        setGrade("");
        setUnit("");
        setSubject("");
        setType("pdf");
        setTags("");
        setExternalUrl("");
        setFile(null);
      } else {
        setMessage(data.error || `Failed to ${editingId ? 'update' : 'add'} resource`);
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setTitle(resource.title);
    setDescription(resource.description || "");
    setGrade(resource.grade || "");
    setUnit(resource.unit || "");
    setSubject(resource.subject || "");
    setType(resource.type);
    setTags(resource.tags.join(", "));
    setExternalUrl(resource.externalUrl || "");
    setFile(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setGrade("");
    setUnit("");
    setSubject("");
    setType("pdf");
    setTags("");
    setExternalUrl("");
    setFile(null);
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const response = await fetch(`/api/curriculum?id=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setMessage("Resource deleted successfully!");
        fetchResources();
        if (editingId === id) {
          handleCancelEdit();
        }
      } else {
        setMessage("Failed to delete resource");
      }
    } catch (error) {
      setMessage("An error occurred");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Edit Resource" : "Add Resource"}
                </h3>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="3rd, 6-8, 9-12"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                    <option value="pdf">PDF</option>
                    <option value="doc">Word Document</option>
                    <option value="link">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="math, multiplication, fractions"
                    className="input-field"
                  />
                </div>

                {type === "link" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="input-field"
                      required={type === "link"}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File {editingId ? "(leave empty to keep current file)" : "*"}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept={type === "pdf" ? ".pdf" : ".doc,.docx"}
                      className="input-field"
                      required={type !== "link" && !editingId}
                    />
                    {file && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Resource" : "Add Resource")}
                </button>

                {message && (
                  <div className={`p-3 rounded text-sm ${
                    message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Resources List */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                All Resources ({resources.length})
              </h3>
              {resources.length === 0 ? (
                <p className="text-gray-600">
                  No resources added yet. Use the form to add resources.
                </p>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {resource.title}
                          </h4>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {resource.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2 text-xs text-gray-500">
                            {resource.grade && <span>Grade: {resource.grade}</span>}
                            <span className="font-semibold">{resource.type.toUpperCase()}</span>
                          </div>
                          {resource.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {resource.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {resource.fileUrl && (
                            <a
                              href={resource.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              📄 View File
                            </a>
                          )}
                          {resource.externalUrl && (
                            <a
                              href={resource.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              🔗 Open Link
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(resource)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(resource.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
