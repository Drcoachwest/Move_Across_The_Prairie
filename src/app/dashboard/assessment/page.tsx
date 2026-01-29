'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Student {
  id: string;
  districtId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  currentGrade: number;
  currentSchool: string;
  peTeacher: string;
}

interface Test {
  id: string;
  studentId: string;
  student: Student;
  testDate: string;
  testSeason: 'Fall' | 'Spring';
  testYear: number;
  pacerOrMileRun?: number;
  pushups?: number;
  situps?: number;
  sitAndReach?: number;
  shoulderStretchRight?: boolean;
  shoulderStretchLeft?: boolean;
  height?: number;
  weight?: number;
  bmi?: number;
  trunkLift?: number;
  notes?: string;
}

export default function TeacherAssessmentPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterSeason, setFilterSeason] = useState<'Fall' | 'Spring' | ''>('');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assessment');
      if (!response.ok) throw new Error('Failed to load tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(test => {
    if (filterYear && test.testYear !== filterYear) return false;
    if (filterSeason && test.testSeason !== filterSeason) return false;
    return true;
  });

  // Get unique years and seasons
  const years = [...new Set(tests.map(t => t.testYear))].sort().reverse();
  const seasons = [...new Set(tests.map(t => t.testSeason))];

  // Helper to compare two test seasons
  const getComparison = (studentId: string, year: number) => {
    const fallTest = tests.find(t => t.studentId === studentId && t.testYear === year && t.testSeason === 'Fall');
    const springTest = tests.find(t => t.studentId === studentId && t.testYear === year && t.testSeason === 'Spring');
    return { fallTest, springTest };
  };

  const calculateImprovement = (fallValue?: number, springValue?: number) => {
    if (fallValue === undefined || springValue === undefined) return null;
    const change = springValue - fallValue;
    const percent = ((change / fallValue) * 100).toFixed(1);
    return {
      value: change.toFixed(1),
      percent,
      improved: change > 0,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={180}
                height={60}
                className="h-12 md:h-[72px] w-auto"
              />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Assessment Data</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Season
              </label>
              <select
                value={filterSeason}
                onChange={(e) => setFilterSeason(e.target.value as 'Fall' | 'Spring' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Seasons</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-600 py-8">Loading assessment data...</p>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No assessment data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group by student and year */}
            {[...new Set(filteredTests.map(t => `${t.studentId}-${t.testYear}`))].map(key => {
              const [studentId, year] = key.split('-');
              const studentTests = filteredTests.filter(t => t.studentId === studentId && t.testYear === parseInt(year));
              const student = studentTests[0]?.student;
              const { fallTest, springTest } = getComparison(studentId, parseInt(year));

              return (
                <div key={key} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-blue-50 border-b border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {student?.firstName} {student?.lastName}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">District ID:</span>
                        <p className="font-medium">{student?.districtId}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Grade:</span>
                        <p className="font-medium">{student?.currentGrade}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">School:</span>
                        <p className="font-medium">{student?.currentSchool}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Year:</span>
                        <p className="font-medium">{year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-900">Metric</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-900">Fall</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-900">Spring</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-900">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fallTest || springTest ? (
                            <>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">PACER/Mile Run</td>
                                <td className="text-center px-4 py-3">{fallTest?.pacerOrMileRun ? `${fallTest.pacerOrMileRun}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.pacerOrMileRun ? `${springTest.pacerOrMileRun}` : '—'}</td>
                                <td className="text-center px-4 py-3">
                                  {(() => {
                                    const imp = calculateImprovement(fallTest?.pacerOrMileRun, springTest?.pacerOrMileRun);
                                    return imp ? (
                                      <span className={imp.improved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {imp.improved ? '+' : ''}{imp.value} ({imp.percent}%)
                                      </span>
                                    ) : '—';
                                  })()}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Pushups</td>
                                <td className="text-center px-4 py-3">{fallTest?.pushups ?? '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.pushups ?? '—'}</td>
                                <td className="text-center px-4 py-3">
                                  {(() => {
                                    const imp = calculateImprovement(fallTest?.pushups, springTest?.pushups);
                                    return imp ? (
                                      <span className={imp.improved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {imp.improved ? '+' : ''}{imp.value} ({imp.percent}%)
                                      </span>
                                    ) : '—';
                                  })()}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Situps</td>
                                <td className="text-center px-4 py-3">{fallTest?.situps ?? '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.situps ?? '—'}</td>
                                <td className="text-center px-4 py-3">
                                  {(() => {
                                    const imp = calculateImprovement(fallTest?.situps, springTest?.situps);
                                    return imp ? (
                                      <span className={imp.improved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {imp.improved ? '+' : ''}{imp.value} ({imp.percent}%)
                                      </span>
                                    ) : '—';
                                  })()}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Sit and Reach (cm)</td>
                                <td className="text-center px-4 py-3">{fallTest?.sitAndReach ? `${fallTest.sitAndReach}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.sitAndReach ? `${springTest.sitAndReach}` : '—'}</td>
                                <td className="text-center px-4 py-3">
                                  {(() => {
                                    const imp = calculateImprovement(fallTest?.sitAndReach, springTest?.sitAndReach);
                                    return imp ? (
                                      <span className={imp.improved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {imp.improved ? '+' : ''}{imp.value} ({imp.percent}%)
                                      </span>
                                    ) : '—';
                                  })()}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Shoulder Stretch - Right</td>
                                <td className="text-center px-4 py-3">{fallTest?.shoulderStretchRight ? '✓ Pass' : fallTest ? '✗ Fail' : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.shoulderStretchRight ? '✓ Pass' : springTest ? '✗ Fail' : '—'}</td>
                                <td className="text-center px-4 py-3">—</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Shoulder Stretch - Left</td>
                                <td className="text-center px-4 py-3">{fallTest?.shoulderStretchLeft ? '✓ Pass' : fallTest ? '✗ Fail' : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.shoulderStretchLeft ? '✓ Pass' : springTest ? '✗ Fail' : '—'}</td>
                                <td className="text-center px-4 py-3">—</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Height (cm)</td>
                                <td className="text-center px-4 py-3">{fallTest?.height ? `${fallTest.height}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.height ? `${springTest.height}` : '—'}</td>
                                <td className="text-center px-4 py-3">—</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">Weight (kg)</td>
                                <td className="text-center px-4 py-3">{fallTest?.weight ? `${fallTest.weight}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.weight ? `${springTest.weight}` : '—'}</td>
                                <td className="text-center px-4 py-3">—</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-4 py-3 text-gray-700">BMI</td>
                                <td className="text-center px-4 py-3">{fallTest?.bmi ? `${fallTest.bmi.toFixed(1)}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.bmi ? `${springTest.bmi.toFixed(1)}` : '—'}</td>
                                <td className="text-center px-4 py-3">—</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 text-gray-700">Trunk Lift (cm)</td>
                                <td className="text-center px-4 py-3">{fallTest?.trunkLift ? `${fallTest.trunkLift}` : '—'}</td>
                                <td className="text-center px-4 py-3">{springTest?.trunkLift ? `${springTest.trunkLift}` : '—'}</td>
                                <td className="text-center px-4 py-3">
                                  {(() => {
                                    const imp = calculateImprovement(fallTest?.trunkLift, springTest?.trunkLift);
                                    return imp ? (
                                      <span className={imp.improved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {imp.improved ? '+' : ''}{imp.value} ({imp.percent}%)
                                      </span>
                                    ) : '—';
                                  })()}
                                </td>
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-gray-600">No test data</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Notes */}
                    {(fallTest?.notes || springTest?.notes) && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                        {fallTest?.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600"><strong>Fall:</strong> {fallTest.notes}</p>
                          </div>
                        )}
                        {springTest?.notes && (
                          <div>
                            <p className="text-sm text-gray-600"><strong>Spring:</strong> {springTest.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
