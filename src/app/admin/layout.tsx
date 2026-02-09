'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AdminInfo {
  id: string;
  username: string;
  email?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (!response.ok) {
          router.push('/auth/admin-login');
          return;
        }
        const data = await response.json();
        // Check if it's an admin user
        if (data.admin) {
          setAdminInfo({ id: data.admin.id, username: data.admin.username });
        } else {
          // Not an admin, redirect to admin login
          router.push('/auth/admin-login');
        }
      } catch (err) {
        router.push('/auth/admin-login');
      } finally {
        setLoading(false);
      }
    };
    checkAdminSession();
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/admin-signout', { method: 'POST' });
    router.push('/auth/admin-login');
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
      {/* Admin Header */}
      <header className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center hover:opacity-80 transition">
                <Image
                  src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
                  alt="Move Across the Prairie"
                  width={180}
                  height={180}
                  className="h-[180px] w-auto"
                  priority
                />
              </Link>
              {adminInfo && (
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-white text-xl">{adminInfo.username}</p>
                  <p className="text-sm text-gray-300">Administrator</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/dashboard"
                className="text-gray-300 hover:text-white font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/curriculum"
                className="text-gray-300 hover:text-white font-medium"
              >
                Curriculum Hub
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 font-medium"
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
