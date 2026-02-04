'use client';

import { useState, useEffect } from 'react';
import standards from '@/lib/fitnessgram-standards.json';
import {
  calculateImprovement,
  calculateClassImprovementStats,
  getImprovementColor,
  PacerComparison,
  ClassImprovementStats,
} from '@/lib/improvement-tracker';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  currentGrade: number;
  classroomTeacher?: string;
}

interface TestData {
  id: string;
  studentId: string;
  testSeason: 'Fall' | 'Spring';
  cardioTestType?: 'PACER' | 'MILE';
  pacerOrMileRun?: number;
}

interface StudentComparison {
  student: Student;
  fallTest?: TestData;
  springTest?: TestData;
  comparison: PacerComparison;
}

export default function PacerComparisonPage() {
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [classroomTeacher, setClassroomTeacher] = useState<string>('');
  const [availableTeachers, setAvailableTeachers] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<StudentComparison[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classStats, setClassStats] = useState<ClassImprovementStats | null>(null);
  const [nonPacerCount, setNonPacerCount] = useState(0);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);

  // Fetch teacher info and verify session
  useEffect(() => {
    const getTeacherInfo = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (response.ok) {
          const data = await response.json();
          if (data.teacher) {
            setTeacherInfo(data.teacher);
          } else {
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

  // Fetch and compare tests
  const loadComparisons = async (selectedGrade: number) => {
    setLoading(true);
    try {
      // Load all students
      const studentsResponse = await fetch('/api/admin/students');
      if (!studentsResponse.ok) throw new Error('Failed to load students');
      const studentsData = await studentsResponse.json();

      // Load all assessment/test data
      const testsResponse = await fetch('/api/admin/assessment');
      if (!testsResponse.ok) throw new Error('Failed to load tests');
      const testsData = await testsResponse.json();

      // Filter students by grade
      const gradeStudents = studentsData.students.filter(
        (s: Student) => s.currentGrade === selectedGrade
      );

      // Group tests by student
      const testsByStudent: Record<string, { fall?: TestData; spring?: TestData }> = {};
      testsData.tests.forEach((test: TestData) => {
        if (!testsByStudent[test.studentId]) {
          testsByStudent[test.studentId] = {};
        }
        if (test.testSeason === 'Fall') {
          testsByStudent[test.studentId].fall = test;
        } else if (test.testSeason === 'Spring') {
          testsByStudent[test.studentId].spring = test;
        }
      });

      const isWholeNumber = (value: number | undefined) => Number.isInteger(value);
      let nonPacer = 0;

      console.log('Total students in grade:', gradeStudents.length);
      console.log('Total tests:', testsData.tests.length);

      // Build comparisons
      const comparisons: StudentComparison[] = gradeStudents
        .map((student: Student) => {
          const tests = testsByStudent[student.id] || {};
          const fallRaw = tests.fall?.pacerOrMileRun;
          const springRaw = tests.spring?.pacerOrMileRun;
          const fallIsPacer = tests.fall?.cardioTestType === 'PACER' || (tests.fall?.cardioTestType === undefined && tests.fall !== undefined);
          const springIsPacer = tests.spring?.cardioTestType === 'PACER' || (tests.spring?.cardioTestType === undefined && tests.spring !== undefined);

          const fallLaps = fallIsPacer && isWholeNumber(fallRaw) ? fallRaw : undefined;
          const springLaps = springIsPacer && isWholeNumber(springRaw) ? springRaw : undefined;

// Show which students have decimal values (excluded from PACER)
      if ((fallRaw && !isWholeNumber(fallRaw)) || (springRaw && !isWholeNumber(springRaw))) {
        console.log(
          `⚠️ ${student.firstName} ${student.lastName} - EXCLUDED:`,
          `Fall=${fallRaw}`,
          `Spring=${springRaw}`,
          `CardioType: Fall=${tests.fall?.cardioTestType} Spring=${tests.spring?.cardioTestType}`
        );
      }

          if (fallRaw !== undefined && (!isWholeNumber(fallRaw) || !fallIsPacer)) nonPacer += 1;
          if (springRaw !== undefined && (!isWholeNumber(springRaw) || !springIsPacer)) nonPacer += 1;

          // Get standards for student's age and sex
          const age = calculateAge(student.dateOfBirth);
          const sexKey = student.sex?.toLowerCase() === 'f' ? 'girls' : 'boys';
          const fitnessGramStandards = standards as any;
          const ageStandards = fitnessGramStandards[sexKey]?.cardio?.[age.toString()];
          const pacerStandard = ageStandards?.pacer20 || { min: 0, max: 100 };

          const comparison = calculateImprovement(fallLaps, springLaps, pacerStandard.min, pacerStandard.max);

          return {
            student,
            fallTest: tests.fall,
            springTest: tests.spring,
            comparison,
          };
        })
        .filter(sc => sc.comparison.fallLaps || sc.comparison.springLaps); // Only show students with test data

      // Extract unique classroom teachers for filtering
      const teachers = Array.from(
        new Set(
          comparisons
            .map(sc => sc.student.classroomTeacher)
            .filter((t): t is string => !!t)
        )
      ).sort();

      setAvailableTeachers(teachers);
      setAllStudents(comparisons);
      setFilteredStudents(comparisons);
      setClassroomTeacher(''); // Reset filter
      setNonPacerCount(nonPacer);
      
      // Calculate class stats for all students
      const comparisonsWithBoth = comparisons.filter(c => c.comparison.fallLaps && c.comparison.springLaps);
      const stats = calculateClassImprovementStats(comparisonsWithBoth.map(c => c.comparison));
      setClassStats(stats);
    } catch (err) {
      console.error('Error loading comparisons:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSelect = (grade: number) => {
    setGradeLevel(grade);
    loadComparisons(grade);
  };

  // Filter students by classroom teacher
  const handleTeacherFilter = (teacher: string) => {
    setClassroomTeacher(teacher);
    
    if (!teacher) {
      // Show all students
      setFilteredStudents(allStudents);
      const comparisonsWithBoth = allStudents.filter(c => c.comparison.fallLaps && c.comparison.springLaps);
      const stats = calculateClassImprovementStats(comparisonsWithBoth.map(c => c.comparison));
      setClassStats(stats);
    } else {
      // Filter by classroom teacher
      const filtered = allStudents.filter(sc => sc.student.classroomTeacher === teacher);
      setFilteredStudents(filtered);
      const comparisonsWithBoth = filtered.filter(c => c.comparison.fallLaps && c.comparison.springLaps);
      const stats = calculateClassImprovementStats(comparisonsWithBoth.map(c => c.comparison));
      setClassStats(stats);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PACER Performance Comparison</h1>
          <p className="text-gray-600">Compare Fall vs Spring performance to track student improvement</p>
        </div>

        {/* Grade Filter */}
        {!gradeLevel ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">Select Grade Level</h2>
            <div className="grid grid-cols-3 gap-4">
              {[3, 4, 5].map(grade => (
                <button
                  key={grade}
                  onClick={() => handleGradeSelect(grade)}
                  className="p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition"
                >
                  <div className="text-2xl font-bold text-blue-600">Grade {grade}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {nonPacerCount > 0 && !loading && (
              <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                {nonPacerCount} score{nonPacerCount === 1 ? '' : 's'} look like 1-mile run times (decimals), so they were excluded from PACER comparisons.
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => {
                setGradeLevel(null);
                setError(null);
              }}
              className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Grade Selection
            </button>

            {/* Classroom Teacher Filter */}
            {!loading && availableTeachers.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Classroom Teacher
                </label>
                <select
                  value={classroomTeacher}
                  onChange={(e) => handleTeacherFilter(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Teachers ({allStudents.length} students)</option>
                  {availableTeachers.map(teacher => {
                    const count = allStudents.filter(sc => sc.student.classroomTeacher === teacher).length;
                    return (
                      <option key={teacher} value={teacher}>
                        {teacher} ({count} students)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading comparison data...</div>
              </div>
            )}

            {/* Class Statistics */}
            {!loading && classStats && classStats.totalStudentsWithBothTests > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Class Improvement Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-3xl font-bold text-green-600">
                      {classStats.percentageSignificantlyImproved.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Significant Improvement</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {classStats.studentsWithSignificantImprovement} of {classStats.totalStudentsWithBothTests} students
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-3xl font-bold text-blue-600">
                      {classStats.percentageImproved.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Any Improvement</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {classStats.studentsWithSignificantImprovement + classStats.studentsWithSomeImprovement} students
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-3xl font-bold text-purple-600">
                      {classStats.averagePercentageChange.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Average % Change</div>
                    <div className="text-xs text-gray-500 mt-1">Across all students</div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded">
                    <div className="text-3xl font-bold text-orange-600">
                      {classStats.studentsWithDecline}
                    </div>
                    <div className="text-sm text-gray-600">Declined</div>
                    <div className="text-xs text-gray-500 mt-1">Need support</div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Comparisons */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Fall PACER</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Spring PACER</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Change</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">% Change</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(sc => (
                      <tr key={sc.student.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {sc.student.firstName} {sc.student.lastName}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">
                          {sc.comparison.fallLaps ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">
                          {sc.comparison.springLaps ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {sc.comparison.lapDifference > 0 ? '+' : ''}
                          {sc.comparison.lapDifference !== 0 ? sc.comparison.lapDifference : '0'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {sc.comparison.percentageChange > 0 ? '+' : ''}
                          {sc.comparison.percentageChange.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div
                            className={`px-3 py-1 rounded text-xs font-semibold ${getImprovementColor(
                              sc.comparison.improvementStatus,
                              sc.comparison.isSignificantImprovement
                            )}`}
                          >
                            {sc.comparison.improvementStatus === 'improved'
                              ? sc.comparison.isSignificantImprovement
                                ? '✓ Significant'
                                : 'Improved'
                              : sc.comparison.improvementStatus === 'declined'
                                ? 'Declined'
                                : 'No Change'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details Section */}
            {filteredStudents.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStudents.map(sc => (
                  <div key={sc.student.id} className={`p-4 rounded-lg border-l-4`} style={{
                    borderLeftColor: sc.comparison.isSignificantImprovement ? '#10b981' : 
                                    sc.comparison.improvementStatus === 'improved' ? '#3b82f6' :
                                    sc.comparison.improvementStatus === 'declined' ? '#f97316' : '#6b7280'
                  }}>
                    <h3 className="font-bold text-gray-900">
                      {sc.student.firstName} {sc.student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{sc.comparison.improvementMessage}</p>
                    {sc.comparison.fallLaps && sc.comparison.springLaps && (
                      <div className="mt-3 text-xs text-gray-600">
                        <div>Fall: {sc.comparison.fallLaps} laps</div>
                        <div>Spring: {sc.comparison.springLaps} laps</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
