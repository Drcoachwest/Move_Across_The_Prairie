"use client";

// DEPRECATED: This page is no longer used. Teachers now sign in via /auth/teacher-signin
// This can be deleted once confirmed it's not referenced anywhere

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userHasPassword, setUserHasPassword] = useState<boolean | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);

  // Check if user has already set a password
  const checkUserPassword = async (emailValue: string) => {
    if (!emailValue || !emailValue.endsWith("@gpisd.org")) {
      setUserHasPassword(null);
      return;
    }

    setCheckingUser(true);
    setUserHasPassword(null);
    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      const data = await response.json();
      setUserHasPassword(data.hasPassword);
    } catch (err) {
      console.error("Error checking user:", err);
      setUserHasPassword(null);
    } finally {
      setCheckingUser(false);
    }
  };

  // Check user immediately when email is valid
  useEffect(() => {
    if (email && email.endsWith("@gpisd.org")) {
      checkUserPassword(email);
    } else {
      setUserHasPassword(null);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Make sure we have the required fields
    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (userHasPassword === null) {
      setError("Still checking your account, please wait...");
      setLoading(false);
      return;
    }

    if (userHasPassword === false && !activationCode) {
      setError("Activation code is required for first login");
      setLoading(false);
      return;
    }

    if (userHasPassword === true && !password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...(userHasPassword ? { password } : { activationCode }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsPasswordSetup) {
          router.push("/auth/set-password");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.message || "Sign in failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <Image
              src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
              alt="Move Across the Prairie logo"
              width={96}
              height={96}
              className="h-24 w-auto"
              priority
            />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              Move Across the Prairie
            </h1>
            <p className="text-gray-600 mt-1">Sign In</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@gpisd.org"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must use your @gpisd.org email address
              </p>
            </div>

            {/* Show loading state while checking user */}
            {checkingUser && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded text-sm">
                Checking account status...
              </div>
            )}

            {/* Show activation code field if user hasn't set a password yet */}
            {userHasPassword === false && !checkingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activation Code
                </label>
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) =>
                    setActivationCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter your activation code"
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll create a password after your first login
                </p>
              </div>
            )}

            {/* Show password field if user has already set one */}
            {userHasPassword === true && !checkingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading || checkingUser || !email || userHasPassword === null
              }
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an activation code?{" "}
            <span className="font-semibold">Contact your administrator.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
