'use client';

import { useState, useEffect } from 'react';

interface Student {
  id: string;
  districtId: string;
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  currentGrade: number;
  currentSchool: string;
  peTeacher: string;
  classroomTeacher?: string;
}

interface TestData {
  id: string;
  studentId: string;
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
  student: {
    districtId: string;
    firstName: string;
    lastName: string;
    currentGrade: number;
    currentSchool: string;
    peTeacher: string;
    classroomTeacher?: string;
  };
}

interface TeacherInfo {
  id: string;
  email: string;
  name: string;
  school: string;
}

export default function ReportsPage() {
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClassroomTeacher, setSelectedClassroomTeacher] = useState<string>('');

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

  useEffect(() => {
    if (teacherInfo) {
      loadStudents();
      loadTests();
    }
  }, [teacherInfo]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to load students');
      const data = await response.json();
      const filteredStudents = teacherInfo 
        ? data.students.filter((s: Student) => s.currentSchool === teacherInfo.school)
        : data.students;
      setStudents(filteredStudents || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    try {
      const response = await fetch('/api/admin/assessment');
      if (!response.ok) throw new Error('Failed to load tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  const availableGrades = Array.from(new Set(students.map(s => s.currentGrade))).sort((a, b) => a - b);
  const gradeFilteredStudents = selectedGrade
    ? students.filter(s => s.currentGrade === Number(selectedGrade))
    : students;
  const classroomFilteredStudents = gradeFilteredStudents.filter(
    s => !selectedClassroomTeacher || s.classroomTeacher === selectedClassroomTeacher
  );
  const classroomTeachers = Array.from(new Set(gradeFilteredStudents.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort();
  const classroomFilteredTests = tests.filter(t => classroomFilteredStudents.some(s => s.id === t.studentId));

  // Calculate stats
  const totalStudents = classroomFilteredStudents.length;
  const completedTests = classroomFilteredTests.length;
  const completionRate = totalStudents > 0 ? Math.round((completedTests / totalStudents) * 100) : 0;

  // Fitness zone stats
  const healthyZoneCount = classroomFilteredTests.filter(t => {
    const pacerZone = t.pacerOrMileRun ? 'healthy' : null; // placeholder
    const bmiZone = t.bmi ? 'healthy' : null;
    return pacerZone === 'healthy' || bmiZone === 'healthy';
  }).length;

  const averageBMI = classroomFilteredTests.length > 0
    ? (classroomFilteredTests.reduce((sum, t) => sum + (t.bmi || 0), 0) / classroomFilteredTests.length).toFixed(1)
    : '-';

  const averagePACER = classroomFilteredTests.filter(t => t.pacerOrMileRun).length > 0
    ? (classroomFilteredTests.filter(t => t.pacerOrMileRun).reduce((sum, t) => sum + (t.pacerOrMileRun || 0), 0) / classroomFilteredTests.filter(t => t.pacerOrMileRun).length).toFixed(1)
    : '-';

  const exportToCSV = () => {
    const rows = [
      ['Student', 'Grade', 'Classroom Teacher', 'Test Date', 'PACER/Mile', 'Pushups', 'Situps', 'Sit & Reach', 'Height', 'Weight', 'BMI', 'Trunk Lift'],
      ...classroomFilteredTests.map(t => [
        `${t.student.firstName} ${t.student.lastName}`,
        t.student.currentGrade,
        t.student.classroomTeacher || '-',
        new Date(t.testDate).toLocaleDateString(),
        t.pacerOrMileRun || '-',
        t.pushups || '-',
        t.situps || '-',
        t.sitAndReach || '-',
        t.height || '-',
        t.weight || '-',
        t.bmi ? t.bmi.toFixed(1) : '-',
        t.trunkLift || '-',
      ])
    ];

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports & Analytics</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedClassroomTeacher('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Grades</option>
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classroom Teacher</label>
          <select
            value={selectedClassroomTeacher}
            onChange={(e) => setSelectedClassroomTeacher(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={!selectedGrade}
          >
            <option value="">All Teachers</option>
            {classroomTeachers.map(teacher => (
              <option key={teacher} value={teacher}>{teacher}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Tests Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{completedTests}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{completionRate}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Healthy Zone</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{healthyZoneCount}</p>
          <p className="text-xs text-gray-500 mt-1">students in zone</p>
        </div>
      </div>

      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Averages</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Average PACER (laps)</p>
              <p className="text-2xl font-bold text-gray-900">{averagePACER}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average BMI</p>
              <p className="text-2xl font-bold text-gray-900">{averageBMI}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Grade Level: {selectedGrade || 'All'}</p>
            <p>• Classroom Teacher: {selectedClassroomTeacher || 'All'}</p>
            <p>• Tests with Data: {classroomFilteredTests.length}</p>
            <p>• Last Updated: {classroomFilteredTests.length > 0 ? new Date(classroomFilteredTests[classroomFilteredTests.length - 1].testDate).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-8">
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition"
          disabled={classroomFilteredTests.length === 0}
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Test Details Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Test Details</h3>
        </div>

        {classroomFilteredTests.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600">
            No tests found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Grade</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Teacher</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Test Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">PACER</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">BMI</th>
                </tr>
              </thead>
              <tbody>
                {classroomFilteredTests.map((test) => (
                  <tr key={test.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">{test.student.firstName} {test.student.lastName}</td>
                    <td className="px-4 py-2">{test.student.currentGrade}</td>
                    <td className="px-4 py-2">{test.student.classroomTeacher || '-'}</td>
                    <td className="px-4 py-2">{new Date(test.testDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{test.pacerOrMileRun || '-'}</td>
                    <td className="px-4 py-2">{test.bmi ? test.bmi.toFixed(1) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
