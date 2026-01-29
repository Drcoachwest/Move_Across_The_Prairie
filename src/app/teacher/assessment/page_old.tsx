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
    classroomTeacher?: string;
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
  const [viewTestsTeacher, setViewTestsTeacher] = useState<string>('');
  const [classSummaryTeacher, setClassSummaryTeacher] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterSeason, setFilterSeason] = useState<'Fall' | 'Spring'>('Fall');
  const [filterSchool, setFilterSchool] = useState<string>('');
  const [filterClassroomTeacher, setFilterClassroomTeacher] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    testDate: new Date().toISOString().split('T')[0],
    testSeason: 'Fall',
  });
  const [submitting, setSubmitting] = useState(false);

  // Get teacher info from session
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
          loadStudents();
          loadTests();
        }
      } catch (err) {
        router.push('/auth/teacher-signin');
      } finally {
        setLoading(false);
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
      setStudents(data.students || []);
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : (name.includes('?') || name === 'studentId' ? value : value === '' ? undefined : isNaN(Number(value)) ? value : Number(value)),
      };
      return updated;
    });
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError('Please select a student');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const testYear = new Date(formData.testDate).getFullYear();
      const submitData = {
        ...formData,
        testYear,
      };
      
      const response = await fetch('/api/admin/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save test');
      }

      setSuccess('Test data saved successfully!');
      // Reset form but keep classroom teacher selected
      setFormData({ 
        studentId: '', 
        testDate: new Date().toISOString().split('T')[0], 
        testSeason: 'Fall' 
      });
      // Don't clear selectedClassroomTeacher - keep it selected
      loadTests();
      // Keep success message visible longer so user can see it
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {
      console.error('Signout error:', err);
    }
    router.push('/auth/teacher-signin');
  };

  const classroomTeachers = Array.from(
    new Set(
      students
        .filter((s) => s.classroomTeacher)
        .map((s) => s.classroomTeacher)
    )
  ).sort();

  const calculateBMI = (height: number | undefined, weight: number | undefined) => {
    if (!height || !weight) return undefined;
    return Math.round(((weight / (height * height)) * 703) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <Link href="/teacher/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
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

          {teacherInfo && (
            <nav className="text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">{teacherInfo.name}</p>
                <p className="text-xs text-gray-600">{teacherInfo.school}</p>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FitnessGram Assessment</h1>
          <p className="text-gray-600">View student test results and data</p>
        </div>

        {/* Filter Selection Screen */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Filters to View Results</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2026, 2025, 2024, 2023, 2022].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <select
                  value={filterSeason}
                  onChange={(e) => setFilterSeason(e.target.value as 'Fall' | 'Spring')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  placeholder="Enter school name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom Teacher
                </label>
                <select
                  value={filterClassroomTeacher}
                  onChange={(e) => setFilterClassroomTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a classroom teacher --</option>
                  {Array.from(new Set(students.map(s => s.classroomTeacher).filter(Boolean))).sort().map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (filterClassroomTeacher) {
                    setShowFilters(false);
                  } else {
                    setError('Please select a classroom teacher');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                View Results
              </button>
            </div>
          </div>
        )}

        {/* Assessment Content - Only show when filters are applied */}
        {!showFilters && (
          <>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Viewing:</span>{' '}
                  <span className="text-gray-900">{filterYear} {filterSeason}</span> • 
                  <span className="text-gray-900"> {filterSchool || teacherInfo?.school}</span> • 
                  <span className="text-gray-900"> {filterClassroomTeacher}</span>
                </div>
                <button
                  onClick={() => setShowFilters(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Change Filters
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              <strong>{students.filter(s => s.classroomTeacher === filterClassroomTeacher).length} students</strong> from <strong>{teacherInfo?.school}</strong>
            </p>

        {/* Classroom Teacher Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select a Classroom Teacher</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which classroom teacher's students do you want to assess?
          </label>
          <select
            value={selectedClassroomTeacher}
            onChange={(e) => setSelectedClassroomTeacher(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          >
            <option value="">-- Select a classroom teacher --</option>
            {classroomTeachers.map((teacher) => {
              const count = students.filter(s => s.classroomTeacher === teacher).length;
              return (
                <option key={teacher} value={teacher}>
                  {teacher} ({count} students)
                </option>
              );
            })}
          </select>
        </div>

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
              onClick={() => {
                setActiveTab('enter');
                setError('');
                setSuccess('');
              }}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'enter'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✏️ Enter Test Data
            </button>
            <button
              onClick={() => {
                setActiveTab('view');
                setError('');
                setSuccess('');
              }}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              👁️ View/Edit Tests
            </button>
            <button
              onClick={() => {
                setActiveTab('class-summary');
                setError('');
                setSuccess('');
              }}
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

        <div className="bg-white rounded-lg shadow">
          {/* Enter Test Data Tab */}
          {activeTab === 'enter' && (
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Test Data</h2>
                <p className="text-gray-600 mb-4">Select a classroom teacher and enter FitnessGram scores for their students</p>

                {/* Classroom Teacher Selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Step 1: Select a Classroom Teacher
                  </label>
                  <select
                    value={selectedClassroomTeacher}
                    onChange={(e) => setSelectedClassroomTeacher(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="">-- Select a classroom teacher --</option>
                    {classroomTeachers.map((teacher) => {
                      const count = students.filter(s => s.classroomTeacher === teacher).length;
                      return (
                        <option key={teacher} value={teacher}>
                          {teacher} ({count} students)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedClassroomTeacher && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {selectedClassroomTeacher}'s Class
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {students.filter(s => s.classroomTeacher === selectedClassroomTeacher).length} students - Click to enter test data
                    </p>

                    {/* Students in Classroom - Expandable Forms */}
                    <div className="space-y-3">
                      {students
                        .filter(s => s.classroomTeacher === selectedClassroomTeacher)
                        .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
                        .map((student) => {
                          const studentTest = tests.find(t => t.studentId === student.id);
                          const isExpanded = formData.studentId === student.id;

                          return (
                            <div
                              key={student.id}
                              className={`bg-white rounded-lg border transition-all ${
                                studentTest
                                  ? 'border-green-300 bg-green-50'
                                  : isExpanded
                                  ? 'border-blue-400 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {/* Student Header */}
                              <div
                                onClick={() => {
                                  if (isExpanded) {
                                    setFormData({ ...formData, studentId: '' });
                                  } else {
                                    setFormData({ ...formData, studentId: student.id });
                                  }
                                }}
                                className="p-4 cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      District ID: {student.districtId} | Grade {student.currentGrade}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {studentTest && (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                                      ✓ Completed
                                    </span>
                                  )}
                                  <span className="text-xl text-gray-400">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                </div>
                              </div>

                              {/* Expanded Form */}
                              {isExpanded && (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSubmitTest(e);
                                  }}
                                  className="border-t border-gray-200 p-4 bg-gray-50 space-y-4"
                                >
                                  {/* Test Date and Season */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Test Date *
                                      </label>
                                      <input
                                        type="date"
                                        name="testDate"
                                        value={formData.testDate}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Season *
                                      </label>
                                      <select
                                        name="testSeason"
                                        value={formData.testSeason}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="Fall">Fall</option>
                                        <option value="Spring">Spring</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Test Measurements */}
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Test Measurements</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Pacer or Mile Run
                                        </label>
                                        <input
                                          type="number"
                                          name="pacerOrMileRun"
                                          value={formData.pacerOrMileRun || ''}
                                          onChange={handleFormChange}
                                          placeholder="# of laps"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Pushups
                                        </label>
                                        <input
                                          type="number"
                                          name="pushups"
                                          value={formData.pushups || ''}
                                          onChange={handleFormChange}
                                          placeholder="# of reps"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Situps
                                        </label>
                                        <input
                                          type="number"
                                          name="situps"
                                          value={formData.situps || ''}
                                          onChange={handleFormChange}
                                          placeholder="# of reps"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Sit and Reach (inches)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="sitAndReach"
                                          value={formData.sitAndReach || ''}
                                          onChange={handleFormChange}
                                          placeholder="inches"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Height (inches)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="height"
                                          value={formData.height || ''}
                                          onChange={handleFormChange}
                                          placeholder="inches"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Weight (pounds)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="weight"
                                          value={formData.weight || ''}
                                          onChange={handleFormChange}
                                          placeholder="pounds"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          BMI (calculated)
                                        </label>
                                        <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                                          {formData.height && formData.weight
                                            ? calculateBMI(formData.height, formData.weight)
                                            : '-'}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Trunk Lift (inches)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          name="trunkLift"
                                          value={formData.trunkLift || ''}
                                          onChange={handleFormChange}
                                          placeholder="inches"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Shoulder Stretch */}
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Shoulder Stretch</h4>
                                    <div className="flex gap-6">
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          name="shoulderStretchRight"
                                          checked={formData.shoulderStretchRight || false}
                                          onChange={handleFormChange}
                                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Right</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          name="shoulderStretchLeft"
                                          checked={formData.shoulderStretchLeft || false}
                                          onChange={handleFormChange}
                                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Left</span>
                                      </label>
                                    </div>
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
                                      placeholder="Any observations or notes..."
                                      rows={2}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-3 pt-4">
                                    <button
                                      type="submit"
                                      disabled={submitting}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                                    >
                                      {submitting ? 'Saving...' : 'Save Test Data'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFormData({ ...formData, studentId: '' })}
                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View/Edit Tests Tab */}
          {activeTab === 'view' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">View/Edit Test Data</h2>
              
              {/* Classroom Teacher Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Classroom Teacher
                </label>
                <select
                  value={viewTestsTeacher}
                  onChange={(e) => setViewTestsTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classrooms</option>
                  {classroomTeachers.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>

              {tests.length === 0 ? (
                <p className="text-gray-600">No tests recorded yet. Start entering data in the "Enter Test Data" tab.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Student Name</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Classroom Teacher</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Test Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Season</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Pacer/Mile</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Pushups</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Situps</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Height</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Weight</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">BMI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests
                        .filter(test => {
                          const matchesTeacher = viewTestsTeacher === '' || test.student.classroomTeacher === viewTestsTeacher;
                          const matchesYear = test.testYear === parseInt(filterYear);
                          const matchesSeason = test.testSeason === filterSeason;
                          const matchesClassroom = test.student.classroomTeacher === filterClassroomTeacher;
                          return matchesTeacher && matchesYear && matchesSeason && matchesClassroom;
                        })
                        .map((test) => (
                          <tr
                            key={test.id}
                            className="border-t border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-2">{test.student.firstName} {test.student.lastName}</td>
                            <td className="px-4 py-2">{test.student.classroomTeacher || '-'}</td>
                            <td className="px-4 py-2">{test.testDate}</td>
                            <td className="px-4 py-2">{test.testSeason}</td>
                            <td className="px-4 py-2">{test.pacerOrMileRun || '-'}</td>
                            <td className="px-4 py-2">{test.pushups || '-'}</td>
                            <td className="px-4 py-2">{test.situps || '-'}</td>
                            <td className="px-4 py-2">{test.height ? `${test.height}"` : '-'}</td>
                            <td className="px-4 py-2">{test.weight ? `${test.weight} lbs` : '-'}</td>
                            <td className="px-4 py-2">{calculateBMI(test.height, test.weight) || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Class Summary Tab */}
          {activeTab === 'class-summary' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Class Summary</h2>
              
              {/* Classroom Teacher Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Classroom Teacher
                </label>
                <select
                  value={classSummaryTeacher}
                  onChange={(e) => setClassSummaryTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a classroom teacher --</option>
                  {classroomTeachers.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>

              {classSummaryTeacher && (
                <div className="space-y-3">
                  {students
                    .filter(s => s.classroomTeacher === classSummaryTeacher)
                    .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
                    .map((student) => {
                      const studentTests = tests.filter(t => t.studentId === student.id);
                      // Check if student has a complete test with all required fields
                      const hasCompleteTest = studentTests.some(test => 
                        test.pacerOrMileRun !== null && test.pacerOrMileRun !== undefined &&
                        test.pushups !== null && test.pushups !== undefined &&
                        test.situps !== null && test.situps !== undefined &&
                        test.sitAndReach !== null && test.sitAndReach !== undefined &&
                        test.height !== null && test.height !== undefined &&
                        test.weight !== null && test.weight !== undefined &&
                        test.trunkLift !== null && test.trunkLift !== undefined
                        // shoulderStretchRight, shoulderStretchLeft, and notes are optional
                      );
                      const completed = hasCompleteTest;
                      const completionPercent = completed ? 100 : 0;

                      return (
                        <div key={student.id} className="bg-gray-50 rounded p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-600">ID: {student.districtId} | Grade {student.currentGrade}</p>
                            </div>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              completed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {completed ? '✓ Complete' : 'Pending'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                completed ? 'bg-green-600' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${completionPercent}%` }}
                            />
                          </div>
                          {studentTests.length > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                              {studentTests.length} test{studentTests.length !== 1 ? 's' : ''} recorded
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {!classSummaryTeacher && (
                <p className="text-gray-600 text-center py-8">
                  Select a classroom teacher to view their class summary
                </p>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}
