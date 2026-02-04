'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import standards from '@/lib/fitnessgram-standards.json';

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
  sex: string;
  dateOfBirth: string;
  currentGrade: number;
  currentSchool: string;
  peTeacher: string;
}

interface FormData {
  studentId: string;
  testDate: string;
  testSeason: 'Fall' | 'Spring';
  cardioTestType: 'PACER' | 'MILE';
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
  cardioTestType?: 'PACER' | 'MILE';
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
  schoolLevel?: string;
  department?: string;
}

type FitnessComponent = 'pacerOrMileRun' | 'pushups' | 'situps' | 'sitAndReach' | 'trunkLift' | 'bmi';

type StandardsRange = { min?: number; max?: number };
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

export default function SecondaryAssessmentPage() {
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'enter' | 'view' | 'class-summary'>('enter');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [viewTestsPeriod, setViewTestsPeriod] = useState<string>('');
  const [viewTestsSeason, setViewTestsSeason] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    testDate: new Date().toISOString().split('T')[0],
    testSeason: 'Fall',
    cardioTestType: 'PACER',
  });
  const [submitting, setSubmitting] = useState(false);

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
            // Redirect elementary teachers to elementary assessment page
            window.location.href = '/teacher/assessment';
          } else {
            // No teacher in session, redirect to login
            window.location.href = '/auth/teacher-signin';
          }
        } else {
          // Not authenticated, redirect to login
          window.location.href = '/auth/teacher-signin';
        }
      } catch (err) {
        console.error('Failed to get teacher info:', err);
        window.location.href = '/auth/teacher-signin';
      }
    };
    getTeacherInfo();
  }, []);

  const loadClassPeriods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/periods');
      if (!response.ok) throw new Error('Failed to load class periods');
      const data = await response.json();
      setClassPeriods(data.periods || []);
      if (data.periods && data.periods.length > 0) {
        setSelectedPeriod(data.periods[0].id);
      }
      setError('');
    } catch (err) {
      setError('Failed to load class periods');
    } finally {
      setLoading(false);
    }
  };

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

  // Load periods and tests on mount
  useEffect(() => {
    if (teacherInfo) {
      loadClassPeriods();
      loadTests();
    }
  }, [teacherInfo]);

  // Load students when period changes
  useEffect(() => {
    if (selectedPeriod && teacherInfo) {
      loadStudentsForPeriod(selectedPeriod);
    }
  }, [selectedPeriod, teacherInfo]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // If changing student, check if they have an existing test
    if (name === 'studentId') {
      const existingTest = tests.find(t => t.studentId === value);
      if (existingTest) {
        const formattedTestDate = existingTest.testDate
          ? new Date(existingTest.testDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        // Load existing test data
        setFormData({
          studentId: value,
          testDate: formattedTestDate,
          testSeason: existingTest.testSeason,
          cardioTestType: existingTest.cardioTestType || 'PACER',
          pacerOrMileRun: existingTest.pacerOrMileRun,
          pushups: existingTest.pushups,
          situps: existingTest.situps,
          sitAndReach: existingTest.sitAndReach,
          shoulderStretchRight: existingTest.shoulderStretchRight,
          shoulderStretchLeft: existingTest.shoulderStretchLeft,
          height: existingTest.height,
          weight: existingTest.weight,
          trunkLift: existingTest.trunkLift,
          notes: existingTest.notes,
        });
        return;
      } else {
        // New test - reset form
        setFormData({
          studentId: value,
          testDate: new Date().toISOString().split('T')[0],
          testSeason: formData.testSeason,
          cardioTestType: formData.cardioTestType,
        });
        return;
      }
    }

    const numericValue = type === 'number' ? (value ? Number(value) : undefined) : undefined;
    
    let normalizedValue: string | number | undefined = value;
    
    if (type === 'number') {
      if (numericValue === undefined) {
        normalizedValue = undefined;
      } else if (name === 'pacerOrMileRun') {
        normalizedValue = formData.cardioTestType === 'PACER' ? Math.round(numericValue) : numericValue;
      } else {
        normalizedValue = Math.round(numericValue);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : normalizedValue,
    }));
  };

  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return undefined;
    return (weight / (height * height)) * 703;
  };

  const calculateAge = (dateOfBirth: string, testDate: string) => {
    if (!dateOfBirth || !testDate) return undefined;
    const dob = new Date(dateOfBirth);
    const test = new Date(testDate);
    let age = test.getFullYear() - dob.getFullYear();
    const monthDiff = test.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError('Please select a student');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Test recorded successfully');
        setFormData({
          studentId: '',
          testDate: new Date().toISOString().split('T')[0],
          testSeason: formData.testSeason,
          cardioTestType: 'PACER',
        });
        loadTests();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to save test');
      }
    } catch (err) {
      setError('Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  const getStudentTest = (studentId: string) => tests.find(t => t.studentId === studentId);

  const getHFZStatus = (test: TestData, student: Student): 'HFZ' | 'Needs Improvement' => {
    const age = calculateAge(student.dateOfBirth, test.testDate);
    if (age === undefined) return 'Needs Improvement';

    const sex = student.sex.toUpperCase();
    const ageKey = age.toString();
    const standardsData = standards as StandardsData;
    const sexData = sex === 'M' ? standardsData.boys : standardsData.girls;

    const components: (keyof typeof test)[] = ['pacerOrMileRun', 'pushups', 'situps', 'sitAndReach', 'trunkLift'];
    let hfzCount = 0;

    for (const component of components) {
      const value = test[component];
      if (value === undefined || value === null) continue;

      let isHFZ = false;
      if (component === 'pacerOrMileRun') {
        const standard = sexData.cardio[ageKey]?.pacer20;
        if (standard && standard.min !== undefined && value >= standard.min) isHFZ = true;
      } else if (component === 'pushups') {
        const standard = sexData.muscular[ageKey]?.pushup90;
        if (standard && standard.min !== undefined && value >= standard.min) isHFZ = true;
      } else if (component === 'situps') {
        const standard = sexData.muscular[ageKey]?.curlup;
        if (standard && standard.min !== undefined && value >= standard.min) isHFZ = true;
      } else if (component === 'sitAndReach') {
        const standard = sexData.muscular[ageKey]?.sitAndReach;
        if (standard && standard.min !== undefined && value >= standard.min) isHFZ = true;
      } else if (component === 'trunkLift') {
        const standard = sexData.muscular[ageKey]?.trunkLift;
        if (standard && standard.min !== undefined && value >= standard.min) isHFZ = true;
      }

      if (isHFZ) hfzCount++;
    }

    return hfzCount >= 4 ? 'HFZ' : 'Needs Improvement';
  };

  const filteredTests = tests.filter(test => {
    const student = students.find(s => s.id === test.studentId);
    if (!student) return false;
    if (viewTestsPeriod && !student.id) return false; // This would be overridden by period filter
    if (viewTestsSeason && test.testSeason !== viewTestsSeason) return false;
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!teacherInfo) {
    return <div className="p-8 text-center">Loading teacher information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Manager</h1>
          <p className="text-gray-600">{teacherInfo.name} - {teacherInfo.department || 'Department'}</p>
          <p className="text-gray-600">{teacherInfo.school}</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        {/* THREE TABS */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('enter')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'enter'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Enter Test Data
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'view'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            View & Edit Tests
          </button>
          <button
            onClick={() => setActiveTab('class-summary')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'class-summary'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Class Summary
          </button>
        </div>

        {/* TAB 1: ENTER TEST DATA */}
        {activeTab === 'enter' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter FitnesGram Test Data</h2>

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
              <form onSubmit={handleSubmitTest} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                    <select
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} (Grade {student.currentGrade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Date</label>
                    <input
                      type="date"
                      name="testDate"
                      value={formData.testDate}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                    <select
                      name="testSeason"
                      value={formData.testSeason}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardio Test</label>
                    <select
                      name="cardioTestType"
                      value={formData.cardioTestType}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PACER">PACER (laps)</option>
                      <option value="MILE">Mile Run (time)</option>
                    </select>
                  </div>
                </div>

                {/* Fitness Components */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.cardioTestType === 'PACER' ? 'PACER Laps' : 'Mile Run Time (minutes)'}
                    </label>
                    <input
                      type="number"
                      name="pacerOrMileRun"
                      value={formData.pacerOrMileRun || ''}
                      onChange={handleFormChange}
                      step={formData.cardioTestType === 'PACER' ? '1' : '0.1'}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Push-ups</label>
                    <input
                      type="number"
                      name="pushups"
                      value={formData.pushups || ''}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sit-ups</label>
                    <input
                      type="number"
                      name="situps"
                      value={formData.situps || ''}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sit and Reach (inches)</label>
                    <input
                      type="number"
                      name="sitAndReach"
                      value={formData.sitAndReach || ''}
                      onChange={handleFormChange}
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trunk Lift (inches)</label>
                    <input
                      type="number"
                      name="trunkLift"
                      value={formData.trunkLift || ''}
                      onChange={handleFormChange}
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (inches)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height || ''}
                      onChange={handleFormChange}
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (pounds)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleFormChange}
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Shoulder Stretch */}
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="shoulderStretchRight"
                      checked={formData.shoulderStretchRight || false}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Shoulder Stretch Right</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="shoulderStretchLeft"
                      checked={formData.shoulderStretchLeft || false}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Shoulder Stretch Left</label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleFormChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                >
                  {submitting ? 'Saving...' : 'Save Test'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: VIEW & EDIT TESTS */}
        {activeTab === 'view' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">View & Edit Tests</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={viewTestsPeriod}
                  onChange={(e) => setViewTestsPeriod(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- All Periods --</option>
                  {classPeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      Period {period.periodNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                <select
                  value={viewTestsSeason}
                  onChange={(e) => setViewTestsSeason(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- All Seasons --</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTests.length === 0 ? (
                <p className="text-gray-600">No tests found</p>
              ) : (
                filteredTests.map(test => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {test.student.firstName} {test.student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {test.testSeason} {new Date(test.testDate).getFullYear()} - {new Date(test.testDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Status: {getHFZStatus(test, students.find(s => s.id === test.studentId)!)}</p>
                      </div>
                      <button
                        onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expandedTestId === test.id ? 'Hide' : 'Details'}
                      </button>
                    </div>

                    {expandedTestId === test.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">PACER/Mile: <span className="font-normal">{test.pacerOrMileRun}</span></p>
                          <p className="text-sm font-medium text-gray-700">Push-ups: <span className="font-normal">{test.pushups}</span></p>
                          <p className="text-sm font-medium text-gray-700">Sit-ups: <span className="font-normal">{test.situps}</span></p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Sit and Reach: <span className="font-normal">{test.sitAndReach}</span></p>
                          <p className="text-sm font-medium text-gray-700">Trunk Lift: <span className="font-normal">{test.trunkLift}</span></p>
                          <p className="text-sm font-medium text-gray-700">BMI: <span className="font-normal">{test.bmi?.toFixed(1)}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CLASS SUMMARY */}
        {activeTab === 'class-summary' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Class Summary</h2>
            <p className="text-gray-600 mb-6">View comprehensive class summaries with Fall/Spring comparisons and improvement tracking.</p>
            <Link href="/teacher/assessment/secondary/class-summary">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                Go to Class Summary →
              </button>
            </Link>
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
