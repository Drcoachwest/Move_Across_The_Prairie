"use client";

import Link from "next/link";
import { useState } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  grade: string;
  unit: string;
  subject: string;
  type: string;
  tags: string[];
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("");
  const [unit, setUnit] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("pdf");
  const [tags, setTags] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      formData.append("externalUrl", externalUrl);

      const response = await fetch("/api/admin/resources", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResources([...resources, data.resource]);
        setTitle("");
        setDescription("");
        setGrade("");
        setUnit("");
        setSubject("");
        setType("pdf");
        setTags("");
        setExternalUrl("");
        setMessage("Resource added successfully!");
      } else {
        setMessage(data.message || "Failed to add resource");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold">
            ← Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Curriculum Resources</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Resource
              </h3>
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
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unit name"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Math, Science, ELA"
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

                {type === "link" && (
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
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? "Adding..." : "Add Resource"}
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
                            {resource.subject && <span>Subject: {resource.subject}</span>}
                            <span>{resource.type.toUpperCase()}</span>
                          </div>
                          {resource.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
