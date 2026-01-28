import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Move Across the Prairie
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Secure Curriculum Materials & Lesson Planning Hub for Educators
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/signin"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/admin"
            className="px-8 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Admin Portal
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📚 Curriculum Library
            </h3>
            <p className="text-gray-600">
              Access and download curriculum materials, PDFs, and resources
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✏️ Lesson Plan Builder
            </h3>
            <p className="text-gray-600">
              Create and save lesson plans with helpful templates and prompts
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🔒 Secure Access
            </h3>
            <p className="text-gray-600">
              Email verification and activation codes for authorized educators
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
