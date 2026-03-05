'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TEST_SEASON, type CardioTestType, type Sex, type TestSeason } from '@/lib/fitnessgram/constants';
import { getHFZResults } from '@/lib/fitnessgram/hfz';
import HFZRuleInfo from '@/components/fitnessgram/HFZRuleInfo';

interface ClassPeriod {
  id: string;
  periodNumber: number;
  schoolYear: string;
}

interface Student {
  id: string;
  districtId: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  dateOfBirth: string;
  currentGrade: number;
  currentSchool: string;
  peTeacher: string;
}

interface TestData {
  id: string;
  studentId: string;
  testDate: string;
  testSeason: TestSeason;
  testYear: number;
  cardioTestType?: CardioTestType;
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

interface TeacherInfo {
  id: string;
  email: string;
  name: string;
  school: string;
  schoolLevel?: string;
  department?: string;
}

interface StudentRow {
  student: Student;
  fallTest?: TestData;
  springTest?: TestData;
  fallHFZ?: 'HFZ' | 'NI' | 'NA';
  springHFZ?: 'HFZ' | 'NI' | 'NA';
  improvementStatus?: string;
}

type StandardsRange = { min?: number | null; max?: number | null };
type StandardsData = {
  boys: {
    cardio: Record<string, { pacer20?: StandardsRange; bmi?: StandardsRange }>;
    muscular: Record<string, { curlup?: StandardsRange; trunkLift?: StandardsRange; pushup90?: StandardsRange; sitAndReach?: { min?: number } }>;
  };
  girls: {
    cardio: Record<string, { pacer20?: StandardsRange; bmi?: StandardsRange }>;
    muscular: Record<string, { curlup?: StandardsRange; trunkLift?: StandardsRange; pushup90?: StandardsRange; sitAndReach?: { min?: number } }>;
  };
};

// Import standards
import standards from '@/lib/fitnessgram-standards.json';

export default function SecondaryClassSummaryPage() {
  const STORAGE_SELECTED_PERIOD_ID = 'fg_selected_period_id';
  const safeGet = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const safeSet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  };
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  // Get teacher info from session
  useEffect(() => {
    const getTeacherInfo = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (response.ok) {
          const data = await response.json();
          if (data.teacher && data.teacher.schoolLevel === 'SECONDARY') {
            setTeacherInfo(data.teacher);
            setLoading(false);
          } else if (data.teacher && data.teacher.schoolLevel === 'ELEMENTARY') {
            // Redirect elementary teachers
            window.location.href = '/teacher/assessment';
          } else {
            // Not authenticated
            window.location.href = '/auth/teacher-signin';
          }
        } else {
          window.location.href = '/auth/teacher-signin';
        }
      } catch (err) {
        console.error('Failed to get teacher info:', err);
        window.location.href = '/auth/teacher-signin';
      }
    };
    getTeacherInfo();
  }, []);

  const loadClassPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/periods');
      if (!response.ok) throw new Error('Failed to load class periods');
      const data = await response.json();
      setClassPeriods(data.periods || []);
      if (data.periods && data.periods.length > 0) {
        const storedPeriodId = typeof window !== 'undefined' ? safeGet(STORAGE_SELECTED_PERIOD_ID) : null;
        const hasStored = storedPeriodId && data.periods.some((p: ClassPeriod) => p.id === storedPeriodId);
        if (hasStored && storedPeriodId) {
          setSelectedPeriod(storedPeriodId);
        } else {
          setSelectedPeriod(data.periods[0].id);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(STORAGE_SELECTED_PERIOD_ID);
            } catch {
              // ignore storage errors
            }
          }
        }
      }
      setError('');
    } catch (err) {
      setError('Failed to load class periods');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudentsForPeriod = async (periodId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/periods/${periodId}/students`);
      if (!response.ok) throw new Error('Failed to load students');
      const data = await response.json();
      setStudents(data.students || []);
      setError('');
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async (periodId: string) => {
    try {
      const response = await fetch(`/api/teacher/assessment?periodId=${encodeURIComponent(periodId)}`);
      if (!response.ok) throw new Error('Failed to load tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  useEffect(() => {
    if (teacherInfo) {
      loadClassPeriods();
    }
  }, [teacherInfo, loadClassPeriods]);

  useEffect(() => {
    if (selectedPeriod && teacherInfo) {
      loadStudentsForPeriod(selectedPeriod);
      loadTests(selectedPeriod);
    }
  }, [selectedPeriod, teacherInfo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedPeriod) {
      safeSet(STORAGE_SELECTED_PERIOD_ID, selectedPeriod);
    } else {
      try {
        localStorage.removeItem(STORAGE_SELECTED_PERIOD_ID);
      } catch {
        // ignore storage errors
      }
    }
  }, [selectedPeriod]);

  const getStatusLabel = (status: 'HFZ' | 'NI' | 'NA') => {
    if (status === 'HFZ') return 'HFZ';
    if (status === 'NI') return 'Needs Improvement';
    return 'No Data';
  };

  const getImprovementStatus = (fallTest: TestData | undefined, springTest: TestData | undefined, student: Student): string => {
    if (!fallTest || !springTest) return 'No Data';

    const fallHFZ = getHFZResults({
      student,
      test: {
        testDate: fallTest.testDate,
        cardioTestType: fallTest.cardioTestType,
        pacerOrMileRun: fallTest.pacerOrMileRun,
        pushups: fallTest.pushups,
        situps: fallTest.situps,
        sitAndReach: fallTest.sitAndReach,
        trunkLift: fallTest.trunkLift,
        height: fallTest.height,
        weight: fallTest.weight,
      },
      standards: standards as StandardsData,
    }).overall;

    const springHFZ = getHFZResults({
      student,
      test: {
        testDate: springTest.testDate,
        cardioTestType: springTest.cardioTestType,
        pacerOrMileRun: springTest.pacerOrMileRun,
        pushups: springTest.pushups,
        situps: springTest.situps,
        sitAndReach: springTest.sitAndReach,
        trunkLift: springTest.trunkLift,
        height: springTest.height,
        weight: springTest.weight,
      },
      standards: standards as StandardsData,
    }).overall;

    // Moved from Needs Improvement to HFZ
    if (fallHFZ === 'NI' && springHFZ === 'HFZ') {
      return '✅ Significant Improvement';
    }

    // Stayed in HFZ
    if (fallHFZ === 'HFZ' && springHFZ === 'HFZ') {
      return '✅ Maintained HFZ';
    }

    // Check for ≥10% improvement in at least 3 components
    const components: (keyof typeof fallTest)[] = ['pacerOrMileRun', 'pushups', 'situps', 'sitAndReach', 'trunkLift'];
    let improvementCount = 0;

    for (const component of components) {
      const fallValue = fallTest[component] as number | undefined;
      const springValue = springTest[component] as number | undefined;

      if (fallValue === undefined || springValue === undefined) continue;

      const improvement = ((springValue - fallValue) / Math.abs(fallValue)) * 100;
      if (improvement >= 10) {
        improvementCount++;
      }
    }

    if (improvementCount >= 3) {
      return '✅ Significant Improvement';
    }

    // Declined
    if (fallHFZ === 'HFZ' && springHFZ === 'NI') {
      return '⬇️ Declined';
    }

    // No clear change
    return '→ No Clear Change';
  };

  const buildSummaryRows = (): StudentRow[] => {
    return students.map(student => {
      const fallTest = tests.find(t => t.studentId === student.id && t.testSeason === TEST_SEASON.Fall);
      const springTest = tests.find(t => t.studentId === student.id && t.testSeason === TEST_SEASON.Spring);

      return {
        student,
        fallTest,
        springTest,
        fallHFZ: fallTest
          ? getHFZResults({
              student,
              test: {
                testDate: fallTest.testDate,
                cardioTestType: fallTest.cardioTestType,
                pacerOrMileRun: fallTest.pacerOrMileRun,
                pushups: fallTest.pushups,
                situps: fallTest.situps,
                sitAndReach: fallTest.sitAndReach,
                trunkLift: fallTest.trunkLift,
                height: fallTest.height,
                weight: fallTest.weight,
              },
              standards: standards as StandardsData,
            }).overall
          : undefined,
        springHFZ: springTest
          ? getHFZResults({
              student,
              test: {
                testDate: springTest.testDate,
                cardioTestType: springTest.cardioTestType,
                pacerOrMileRun: springTest.pacerOrMileRun,
                pushups: springTest.pushups,
                situps: springTest.situps,
                sitAndReach: springTest.sitAndReach,
                trunkLift: springTest.trunkLift,
                height: springTest.height,
                weight: springTest.weight,
              },
              standards: standards as StandardsData,
            }).overall
          : undefined,
        improvementStatus: getImprovementStatus(fallTest, springTest, student),
      };
    });
  };

  if (loading && !teacherInfo) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!teacherInfo) {
    return <div className="p-8 text-center">Loading teacher information...</div>;
  }

  const summaryRows = buildSummaryRows();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Summary</h1>
          <p className="text-gray-600">{teacherInfo.name} - {teacherInfo.department || 'Department'}</p>
          <p className="text-gray-600">{teacherInfo.school}</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Period Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Period --</option>
            {classPeriods.map(period => (
              <option key={period.id} value={period.id}>
                Period {period.periodNumber}
              </option>
            ))}
          </select>
        </div>

        {selectedPeriod && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 pt-4">
              <HFZRuleInfo />
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Student Name</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Grade</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Fall HFZ</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Spring HFZ</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Improvement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaryRows.map(row => (
                  <tr key={row.student.id} className={row.improvementStatus?.includes('Declined') ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.student.firstName} {row.student.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Grade {row.student.currentGrade}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${row.fallHFZ === 'HFZ' ? 'text-green-600' : 'text-orange-600'}`}>
                        {row.fallHFZ ? getStatusLabel(row.fallHFZ) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${row.springHFZ === 'HFZ' ? 'text-green-600' : 'text-orange-600'}`}>
                        {row.springHFZ ? getStatusLabel(row.springHFZ) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.improvementStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {summaryRows.length === 0 && (
              <div className="px-6 py-4 text-center text-gray-600">No students in this period</div>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link href="/teacher/dashboard">
            <button className="text-blue-600 hover:text-blue-900 font-medium">← Back to Dashboard</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
