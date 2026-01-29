"use client";

import Image from "next/image";
import Link from "next/link";
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

export default function CurriculumLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    let filtered = resources;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((r) => r.grade === selectedGrade);
    }

    if (selectedSubject) {
      filtered = filtered.filter((r) => r.subject === selectedSubject);
    }

    if (selectedUnit) {
      filtered = filtered.filter((r) => r.unit === selectedUnit);
    }

    setFilteredResources(filtered);
  }, [resources, search, selectedGrade, selectedSubject, selectedUnit]);

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
    } finally {
      setLoading(false);
    }
  };

  const grades = [...new Set(resources.map((r) => r.grade).filter(Boolean))];
  const subjects = [...new Set(resources.map((r) => r.subject).filter(Boolean))];
  const units = [...new Set(resources.map((r) => r.unit).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
            ← Dashboard
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
            <h1 className="text-2xl font-bold text-gray-900">
              Curriculum Library
            </h1>
          </div>
          <div className="w-0 sm:w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search */}
        <div className="mb-8">
          <input
            type="search"
            placeholder="Search resources by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full input-field"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="input-field"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
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

        {/* Resources */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {resources.length === 0
                ? "No resources available yet."
                : "No resources match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {resource.title}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {resource.type.toUpperCase()}
                  </span>
                </div>

                {resource.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {resource.description}
                  </p>
                )}

                <div className="space-y-1 text-xs text-gray-600 mb-4">
                  {resource.grade && <p>Grade: {resource.grade}</p>}
                  {resource.subject && <p>Subject: {resource.subject}</p>}
                  {resource.unit && <p>Unit: {resource.unit}</p>}
                </div>

                {resource.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-4">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {resource.type === "link" ? (
                  <a
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center block"
                  >
                    🔗 Open Link
                  </a>
                ) : (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-primary w-full text-center block"
                  >
                    📥 Download {resource.type.toUpperCase()}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
