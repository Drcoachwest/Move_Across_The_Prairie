'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TeacherInfo {
  id: string;
  email: string;
  name: string;
  school: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (!response.ok) {
          router.push('/auth/teacher-signin');
          return;
        }
        const data = await response.json();
        if (data.teacher) {
          setTeacherInfo(data.teacher);
        }
      } catch (err) {
        router.push('/auth/teacher-signin');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/auth/teacher-signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/teacher/dashboard" className="flex items-center hover:opacity-80 transition">
              <Image
                src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
                alt="Move Across the Prairie"
                width={60}
                height={60}
                className="h-[60px] w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {teacherInfo && (
            <div>
              <p className="font-medium text-gray-900">{teacherInfo.name}</p>
              <p className="text-xs text-gray-600">{teacherInfo.school}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Welcome to Your Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FitnessGram Assessment Card */}
          <Link
            href="/teacher/assessment"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">🏃</div>
              <h3 className="text-lg font-semibold text-gray-900">
                FitnessGram Assessment
              </h3>
            </div>
            <p className="text-gray-600">
              Enter and view FitnessGram test scores for your PE students
            </p>
          </Link>

          {/* Curriculum Library Card */}
          <Link
            href="/dashboard/curriculum"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Curriculum Library
              </h3>
            </div>
            <p className="text-gray-600">
              Access curriculum materials and resources
            </p>
          </Link>

          {/* Lesson Plans Card */}
          <Link
            href="/dashboard/lesson-plans"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">✏️</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Lesson Plans
              </h3>
            </div>
            <p className="text-gray-600">
              Create and manage lesson plans
            </p>
          </Link>

          {/* Reports Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reports
              </h3>
            </div>
            <p className="text-gray-600">
              View student progress reports (Coming Soon)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
