"use client";

import { useState, useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  band: string;
  gradeGroup: string;
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
  const [selectedBand, setSelectedBand] = useState("");
  const [selectedGradeGroup, setSelectedGradeGroup] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

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
      // All levels - keep grade as is
      setSelectedGradeGroup("");
    }
  }, [selectedBand, selectedGradeGroup]);

  useEffect(() => {
    let filtered = resources;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedBand) {
      filtered = filtered.filter((r) => r.band === selectedBand);
    }

    if (selectedGradeGroup) {
      filtered = filtered.filter((r) => r.gradeGroup === selectedGradeGroup);
    }

    if (selectedUnit) {
      filtered = filtered.filter((r) => r.unit === selectedUnit);
    }

    setFilteredResources(filtered);
  }, [resources, search, selectedBand, selectedGradeGroup, selectedUnit]);

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

  const gradeGroups = [...new Set(resources.map((r) => r.gradeGroup).filter(Boolean))];
  const units = [...new Set(resources.map((r) => r.unit).filter(Boolean))];
  const bands = [...new Set(resources.map((r) => r.band).filter(Boolean))];

  const formatLevel = (band: string) => {
    if (band === "ELEMENTARY") return "Elementary";
    if (band === "MIDDLE") return "Middle School";
    if (band === "HIGH") return "High School";
    return band;
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedBand("");
    setSelectedGradeGroup("");
    setSelectedUnit("");
  };

  const hasActiveFilters = search || selectedBand || selectedGradeGroup || selectedUnit;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Curriculum Library</h1>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>
        
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
              Level
            </label>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="input-field"
            >
              <option value="">All Levels</option>
              {bands.map((band) => (
                <option key={band} value={band}>
                  {formatLevel(band)}
                </option>
              ))}
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
                  gradeGroups.map((gradeGroup) => (
                    <option key={gradeGroup} value={gradeGroup}>
                      {gradeGroup}
                    </option>
                  ))
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
                  {resource.band && <p>Level: {formatLevel(resource.band)}</p>}
                  {resource.gradeGroup && <p>Grade: {resource.gradeGroup}</p>}
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
      </div>
    </div>
  );
}
