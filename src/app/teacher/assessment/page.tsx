'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  districtId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  currentGrade: number;
  currentSchool: string;
  peTeacher: string;
  classroomTeacher?: string;
}

interface FormData {
  studentId: string;
  testDate: string;
  testSeason: 'Fall' | 'Spring';
  pacerOrMileRun?: number;
  pushups?: number;
  situps?: number;
  sitAndReach?: number;
  shoulderStretchRight?: boolean;
  shoulderStretchLeft?: boolean;
  height?: number;
  weight?: number;
  trunkLift?: number;
  notes?: string;
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
  notes?: string;
  student: {
    districtId: string;
    firstName: string;
    lastName: string;
    currentGrade: number;
    currentSchool: string;
    peTeacher: string;
  };
}

interface TeacherInfo {
  id: string;
  email: string;
  name: string;
  school: string;
}

export default function TeacherAssessmentPage() {
  const router = useRouter();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'enter' | 'view' | 'class-summary'>('enter');
  const [selectedClassroomTeacher, setSelectedClassroomTeacher] = useState<string>('');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [classSummaryTeacher, setClassSummaryTeacher] = useState<string>('');
  const [viewTestsTeacher, setViewTestsTeacher] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    testDate: new Date().toISOString().split('T')[0],
    testSeason: 'Fall',
  });
  const [submitting, setSubmitting] = useState(false);

  // Check teacher session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (!response.ok) {
          router.push('/auth/teacher-signin');
          return;
        }
        const data = await response.json();
        if (data.teacher) {
          setTeacherInfo(data.teacher);
        }
      } catch (err) {
        router.push('/auth/teacher-signin');
      }
    };
    checkSession();
  }, [router]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to load students');
      const data = await response.json();
      // Filter students by teacher's school
      const filteredStudents = teacherInfo 
        ? data.students.filter((s: Student) => s.currentSchool === teacherInfo.school)
        : data.students;
      setStudents(filteredStudents || []);
      setError('');
    } catch (err) {
      setError('Failed to load students');
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

  // Load students and tests on mount and when entering test data tab
  useEffect(() => {
    if (teacherInfo) {
      loadStudents();
      loadTests();
    }
  }, [activeTab, teacherInfo]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value ? parseFloat(value) : undefined) : value),
    }));
  };

  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return undefined;
    // BMI = (weight in pounds / (height in inches)^2) * 703
    return (weight / (height * height)) * 703;
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError('Please select a student');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSubmitting(true);

      const testYear = new Date(formData.testDate).getFullYear();
      const payload = {
        ...formData,
        testYear,
        bmi: calculateBMI(formData.height, formData.weight),
      };

      const response = await fetch('/api/admin/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save test');
      }

      setSuccess('Test data saved successfully!');
      
      // Keep the classroom teacher selected but reset other fields
      setFormData({
        studentId: '',
        testDate: new Date().toISOString().split('T')[0],
        testSeason: formData.testSeason,
      });
      setEditingTestId(null);
      
      // Show success message for 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
      // Reload tests list
      await loadTests();
    } catch (err: any) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/auth/teacher-signin');
    } catch (err) {
      console.error('Signout error:', err);
    }
  };

  const navigateTab = (tab: 'enter' | 'view' | 'class-summary') => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const selectedStudent = students.find(s => s.id === formData.studentId);

  if (loading && !teacherInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/teacher/dashboard" className="flex items-center hover:opacity-80 transition">
              <Image
                src="/images/ChatGPT%20Image%20Jan%2029,%202026,%2009_16_31%20AM.png"
                alt="Move Across the Prairie"
                width={60}
                height={60}
                className="h-[60px] w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/teacher/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm md:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Breadcrumb Navigation */}
          <nav className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Link href="/teacher/dashboard" className="text-blue-600 hover:text-blue-800">
                Teacher Dashboard
              </Link>
              <span>/</span>
              <span className="font-medium text-gray-900">FitnessGram Assessment</span>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assessment Sections</h2>
            <span className="text-sm text-gray-500">
              {activeTab === 'enter' && '1. Enter Test Data'}
              {activeTab === 'view' && '2. View/Edit Tests'}
              {activeTab === 'class-summary' && '3. Class Summary'}
            </span>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-1 inline-flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('enter')}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'enter'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✏️ Enter Test Data
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              👁️ View/Edit Tests
            </button>
            <button
              onClick={() => setActiveTab('class-summary')}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'class-summary'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Class Summary
            </button>
          </div>
        </div>

        {/* Enter Test Data Tab */}
        {activeTab === 'enter' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Enter FitnessGram Test Data</h2>

            {loading ? (
              <p className="text-gray-600">Loading students...</p>
            ) : (
              <form onSubmit={handleSubmitTest} className="space-y-6">
                {/* Classroom Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classroom Teacher *
                  </label>
                  <select
                    value={selectedClassroomTeacher}
                    onChange={(e) => {
                      setSelectedClassroomTeacher(e.target.value);
                      setFormData({ ...formData, studentId: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select classroom teacher...</option>
                    {Array.from(new Set(students.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                {/* Student Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student *
                    </label>
                    <select
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!selectedClassroomTeacher}
                    >
                      <option value="">Select a student...</option>
                      {students
                        .filter(s => !selectedClassroomTeacher || s.classroomTeacher === selectedClassroomTeacher)
                        .map(student => (
                          <option key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} (Grade {student.currentGrade})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Date *
                    </label>
                    <input
                      type="date"
                      name="testDate"
                      value={formData.testDate}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Season *
                    </label>
                    <select
                      name="testSeason"
                      value={formData.testSeason}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                    </select>
                  </div>
                </div>

                {/* Student Info Display */}
                {selectedStudent && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm"><strong>District ID:</strong> {selectedStudent.districtId}</p>
                    <p className="text-sm"><strong>Grade:</strong> {selectedStudent.currentGrade}</p>
                    <p className="text-sm"><strong>School:</strong> {selectedStudent.currentSchool}</p>
                    <p className="text-sm"><strong>PE Teacher:</strong> {selectedStudent.peTeacher}</p>
                  </div>
                )}

                {/* Test Metrics */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PACER / 1-Mile Run (laps or minutes)
                      </label>
                      <input
                        type="number"
                        name="pacerOrMileRun"
                        step="0.1"
                        value={formData.pacerOrMileRun || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pushups (count)
                      </label>
                      <input
                        type="number"
                        name="pushups"
                        value={formData.pushups || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situps (count)
                      </label>
                      <input
                        type="number"
                        name="situps"
                        value={formData.situps || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sit and Reach (cm)
                      </label>
                      <input
                        type="number"
                        name="sitAndReach"
                        step="0.5"
                        value={formData.sitAndReach || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (inches)
                      </label>
                      <input
                        type="number"
                        name="height"
                        step="0.1"
                        value={formData.height || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (pounds)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        step="0.1"
                        value={formData.weight || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trunk Lift (inches)
                      </label>
                      <input
                        type="number"
                        name="trunkLift"
                        step="0.5"
                        value={formData.trunkLift || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="shoulderStretchRight"
                          checked={formData.shoulderStretchRight || false}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Shoulder Stretch - Right
                        </span>
                      </label>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="shoulderStretchLeft"
                          checked={formData.shoulderStretchLeft || false}
                          onChange={handleFormChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Shoulder Stretch - Left
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* BMI Display */}
                  {formData.height && formData.weight && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-gray-900">
                        Calculated BMI: {calculateBMI(formData.height, formData.weight)?.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional notes about the test..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded transition"
                  >
                    {submitting ? 'Saving...' : 'Save Test Data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab('view')}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
                  >
                    View/Edit Tests →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* View/Edit Tests Tab */}
        {activeTab === 'view' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">View & Edit Test Data</h2>
            
            {tests.length === 0 ? (
              <p className="text-gray-600">No tests have been entered yet.</p>
            ) : (
              <div>
                {/* Classroom Teacher Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Classroom Teacher
                  </label>
                  <select
                    value={viewTestsTeacher}
                    onChange={(e) => setViewTestsTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Classroom Teachers</option>
                    {Array.from(new Set(tests.map(t => t.student.classroomTeacher).filter(Boolean))).sort().map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Student</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Teacher</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">District ID</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Grade</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Test Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Season</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Height</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Weight</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">BMI</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests
                        .filter(test => !viewTestsTeacher || test.student.classroomTeacher === viewTestsTeacher)
                        .map((test) => (
                          <tr key={test.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-2">{test.student.firstName} {test.student.lastName}</td>
                            <td className="px-4 py-2">{test.student.classroomTeacher || '-'}</td>
                            <td className="px-4 py-2">{test.student.districtId}</td>
                            <td className="px-4 py-2">{test.student.currentGrade}</td>
                            <td className="px-4 py-2">{new Date(test.testDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{test.testSeason}</td>
                            <td className="px-4 py-2">{test.height || '-'} in</td>
                            <td className="px-4 py-2">{test.weight || '-'} lbs</td>
                            <td className="px-4 py-2">{test.bmi ? test.bmi.toFixed(1) : '-'}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => {
                                  setEditingTestId(test.id);
                                  const student = students.find(s => s.id === test.studentId);
                                  if (student && student.classroomTeacher) {
                                    setSelectedClassroomTeacher(student.classroomTeacher);
                                  }
                                  setFormData({
                                    studentId: test.studentId,
                                    testDate: test.testDate.split('T')[0],
                                    testSeason: test.testSeason,
                                    pacerOrMileRun: test.pacerOrMileRun || undefined,
                                    pushups: test.pushups || undefined,
                                    situps: test.situps || undefined,
                                    sitAndReach: test.sitAndReach || undefined,
                                    shoulderStretchRight: test.shoulderStretchRight || undefined,
                                    shoulderStretchLeft: test.shoulderStretchLeft || undefined,
                                    height: test.height || undefined,
                                    weight: test.weight || undefined,
                                    trunkLift: test.trunkLift || undefined,
                                    notes: test.notes || undefined,
                                  });
                                  setActiveTab('enter');
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigateTab('enter')}
                className="text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 hover:bg-gray-50 transition"
              >
                ← Back to Enter Data
              </button>
              <button
                onClick={() => navigateTab('class-summary')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
              >
                Next: Class Summary →
              </button>
            </div>
          </div>
        )}

        {/* Class Summary Tab */}
        {activeTab === 'class-summary' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Class Summary</h2>
            
            {students.length === 0 ? (
              <p className="text-gray-600">No students found.</p>
            ) : (
              <div>
                {/* Classroom Teacher Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Classroom Teacher
                  </label>
                  <select
                    value={classSummaryTeacher}
                    onChange={(e) => setClassSummaryTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Classroom Teachers</option>
                    {Array.from(new Set(students.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-6">
                  {Array.from(new Set(students.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map((teacher) => {
                    // Skip if filtering and teacher doesn't match
                    if (classSummaryTeacher && teacher !== classSummaryTeacher) {
                      return null;
                    }

                    const classStudents = students.filter(s => s.classroomTeacher === teacher);
                    const completedCount = tests.filter(t => classStudents.some(cs => cs.id === t.studentId)).length;
                    
                    return (
                      <div key={teacher} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{teacher}</h3>
                          <span className="text-sm font-medium text-gray-600">
                            {completedCount} of {classStudents.length} tests completed
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${classStudents.length > 0 ? (completedCount / classStudents.length) * 100 : 0}%` }}
                          ></div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {classStudents.map((student) => {
                            const studentTest = tests.find(t => t.studentId === student.id);
                            return (
                              <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </span>
                                {studentTest ? (
                                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                    ✓ {new Date(studentTest.testDate).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Pending
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigateTab('view')}
                    className="text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 hover:bg-gray-50 transition"
                  >
                    ← Back to View/Edit Tests
                  </button>
                  <Link
                    href="/teacher/dashboard"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition inline-block text-center"
                  >
                    Return to Dashboard →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
