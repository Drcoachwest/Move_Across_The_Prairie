"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Code {
  id: string;
  code: string;
  active: boolean;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function ActivationCodes() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/admin/activation-codes");
      const data = await response.json();
      if (data.success) {
        setCodes(data.codes);
      }
    } catch (error) {
      console.error("Error fetching codes:", error);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/activation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxUses,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCodes([...codes, data.code]);
        setMaxUses(1);
        setExpiresAt("");
        setMessage("Code generated successfully!");
      } else {
        setMessage(data.message || "Failed to generate code");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold">
            ← Admin Dashboard
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
            <h1 className="text-2xl font-bold">Activation Codes</h1>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/auth/admin-signout", { method: "POST" });
            }}
            className="text-sm hover:underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generate Code Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generate New Code
              </h3>
              <form onSubmit={handleGenerateCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 = single-use, &gt;1 = multi-use
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? "Generating..." : "Generate Code"}
                </button>

                {message && (
                  <div className={`p-3 rounded text-sm ${
                    message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Codes List */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                All Activation Codes ({codes.length})
              </h3>
              {codes.length === 0 ? (
                <p className="text-gray-600">
                  No codes generated yet. Create one on the left.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">
                          Code
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">
                          Uses
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">
                          Expires
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((code) => (
                        <tr key={code.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 font-mono">{code.code}</td>
                          <td className="py-2 px-2">
                            {code.usesCount}/{code.maxUses}
                          </td>
                          <td className="py-2 px-2">
                            {code.expiresAt
                              ? new Date(code.expiresAt).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              code.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {code.active ? "Active" : "Disabled"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
