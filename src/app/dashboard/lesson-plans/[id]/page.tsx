"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface LessonPlan {
  id: string;
  title: string;
  teacher: string;
  campus: string;
  gradeLevel: string;
  date: string;
  safetyAndManagement: string;
  instantActivityWarmUp: string;
  skillIntroduction: string;
  skillPractice: string;
  applicationActivity: string;
  coolDownClosure: string;
  assessment: string;
  mvpa: string;
  adaptations: string;
  teacherReflections: string;
  isDraft: boolean;
  createdAt: string;
}

export default function ViewLessonPlan() {
  const params = useParams();
  const lessonPlanId = params.id as string;
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLessonPlan();
  }, [lessonPlanId]);

  const fetchLessonPlan = async () => {
    try {
      // console.log("Fetching lesson plan with ID:", lessonPlanId);
      const response = await fetch(`/api/lessons/${lessonPlanId}`);
      const data = await response.json();
      // console.log("API Response:", data);
      if (data.success && data.lessonPlan) {
        setLessonPlan(data.lessonPlan);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching lesson plan:", error);
      setNotFound(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson plan? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonPlanId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        // Redirect back to lesson plans list after successful deletion
        window.location.href = "/dashboard/lesson-plans";
      } else {
        alert("Error deleting lesson plan: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      alert("An error occurred while deleting the lesson plan");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById("lesson-plan-content");
    if (!element) {
      alert("Error: Could not find lesson plan content");
      return;
    }

    // Dynamically import html2pdf
    import("html2pdf.js").then((module) => {
      const html2pdf = module.default;
      const opt = {
        margin: 10,
        filename: `${lessonPlan?.title || "lesson-plan"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      };
      html2pdf().set(opt).from(element).save();
    });
  };

  const handleExportWord = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonPlanId}/export-word`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lessonPlan?.title || "lesson-plan"}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Error exporting to Word");
      }
    } catch (error) {
      console.error("Error exporting to Word:", error);
      alert("An error occurred while exporting");
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={64}
              height={64}
              className="h-12 sm:h-16 w-auto"
              priority
            />
            <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
              ← Back to Lesson Plans
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Lesson plan not found.</p>
            <Link href="/dashboard/lesson-plans" className="btn-primary">
              Back to Lesson Plans
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={64}
              height={64}
              className="h-12 sm:h-16 w-auto"
              priority
            />
            <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
              ← Back to Lesson Plans
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/dashboard/lesson-plans" className="text-2xl font-bold text-gray-900">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={64}
              height={64}
              className="h-12 sm:h-16 w-auto"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {lessonPlan?.title || "Lesson Plan"}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700"
              title="Export as PDF"
            >
              📄 PDF
            </button>
            <button
              onClick={handleExportWord}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
              title="Export as Word Document"
            >
              📋 Word
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div id="lesson-plan-content" className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lesson Information
            </h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <p className="text-gray-900">{lessonPlan.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Name
                </label>
                <p className="text-gray-900">{lessonPlan.teacher}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus
                </label>
                <p className="text-gray-900">{lessonPlan.campus}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <p className="text-gray-900">{lessonPlan.gradeLevel}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <p className="text-gray-900">{lessonPlan.date}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Status: {lessonPlan.isDraft ? "Draft" : "Published"}
              </p>
            </div>
          </div>

          {/* Safety and Management Considerations */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Safety and Management Considerations
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {lessonPlan.safetyAndManagement || "—"}
            </p>
          </div>

          {/* Lesson Activities and Instruction */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Lesson Activities and Instruction
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Instant Activity / Warm Up
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.instantActivityWarmUp || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Skill Introduction
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.skillIntroduction || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Skill Practice
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.skillPractice || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Application Activity
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.applicationActivity || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Cool Down / Closure
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.coolDownClosure || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Assessment and Reflection */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assessment and Reflection
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Assessment (What are you looking for?)
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.assessment || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  MVPA (Moderate to Vigorous Physical Activity)
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.mvpa || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Adaptations
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.adaptations || "—"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Teacher Reflections
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {lessonPlan.teacherReflections || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Link
              href={`/dashboard/lesson-plans/${lessonPlan.id}/edit`}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center"
            >
              Edit
            </Link>
            <Link
              href="/dashboard/lesson-plans"
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 text-center"
            >
              Back to List
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
