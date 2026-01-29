"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeacherSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);

  const handleCheckUser = async () => {
    if (!email || !email.endsWith("@gpisd.org")) {
      setHasPassword(null);
      setEmailChecked(false);
      return;
    }

    setError("");
    setCheckingUser(true);

    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.message || "Error checking email");
        setHasPassword(null);
        setEmailChecked(false);
        return;
      }

      setHasPassword(data.hasPassword);
      setEmailChecked(true);
    } catch (err) {
      console.error("Error checking user:", err);
      setError("Failed to verify email. Please try again.");
      setHasPassword(null);
      setEmailChecked(false);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailChecked) {
      setError("Please verify your email address first");
      return;
    }

    if (!email || !email.endsWith("@gpisd.org")) {
      setError("Please use a valid @gpisd.org email address");
      return;
    }

    if (hasPassword && !password) {
      setError("Please enter your password");
      return;
    }

    if (!hasPassword && !activationCode) {
      setError("Please enter your activation code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/teacher-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          activationCode: hasPassword ? undefined : activationCode,
          password: hasPassword ? password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      // If teacher doesn't have a profile set up, redirect to profile setup
      if (data.needsProfile) {
        router.push("/auth/teacher-profile-setup");
      } else {
        // Redirect to teacher dashboard
        router.push("/teacher/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Teacher Portal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in with your GPISD email
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailChecked}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailChecked(false);
                  setHasPassword(null);
                  setError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !emailChecked && email && email.endsWith("@gpisd.org")) {
                    e.preventDefault();
                    handleCheckUser();
                  }
                }}
                placeholder="your.name@gpisd.org"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
              <button
                type="button"
                onClick={handleCheckUser}
                disabled={emailChecked || checkingUser || !email || !email.endsWith("@gpisd.org")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {checkingUser ? "Checking..." : "Continue"}
              </button>
            </div>
            {email && !email.endsWith("@gpisd.org") && (
              <p className="mt-1 text-sm text-red-600">
                Must be a @gpisd.org email address
              </p>
            )}
            {emailChecked && hasPassword === false && (
              <div className="flex items-center gap-2">
                <p className="mt-1 text-sm text-green-600">
                  ✓ Email verified - Enter your activation code below
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    setEmailChecked(false);
                    setHasPassword(null);
                    setError("");
                  }}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  (Change)
                </button>
              </div>
            )}
            {emailChecked && hasPassword === true && (
              <div className="flex items-center gap-2">
                <p className="mt-1 text-sm text-green-600">
                  ✓ Welcome back - Enter your password below
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    setEmailChecked(false);
                    setHasPassword(null);
                    setError("");
                  }}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  (Change)
                </button>
              </div>
            )}
          </div>

          {emailChecked && hasPassword === false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activation Code
              </label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="PE-TEACHER-2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-600">
                First time signing in? Enter the activation code provided by your administrator.
              </p>
            </div>
          )}

          {emailChecked && hasPassword === true && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {emailChecked && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Administrator?{" "}
            <Link href="/auth/admin" className="text-blue-600 hover:text-blue-800 font-medium">
              Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
