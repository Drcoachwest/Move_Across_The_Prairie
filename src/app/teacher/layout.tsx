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

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {/* Teacher Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/teacher/dashboard" className="flex items-center hover:opacity-80 transition">
                <Image
                  src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
                  alt="Move Across the Prairie"
                  width={140}
                  height={140}
                  className="h-10 sm:h-12 w-auto"
                  priority
                />
              </Link>
              {teacherInfo && (
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-gray-900 text-base sm:text-lg leading-tight">{teacherInfo.name}</p>
                  <p className="hidden sm:block text-xs text-gray-500">{teacherInfo.school}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link 
                href="/teacher/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base whitespace-nowrap"
              >
                ← Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
