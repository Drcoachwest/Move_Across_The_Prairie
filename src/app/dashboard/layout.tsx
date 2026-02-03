'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/auth/teacher-signin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition">
                <Image
                  src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
                  alt="Move Across the Prairie"
                  width={180}
                  height={180}
                  className="h-[180px] w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-medium"
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
