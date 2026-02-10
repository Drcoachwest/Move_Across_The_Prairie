'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import standards from '@/lib/fitnessgram-standards.json';

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
    classroomTeacher?: string;
  };
}

interface TeacherInfo {
  id: string;
  email: string;
  name: string;
  school: string;
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

export default function TeacherAssessmentPage() {
  const router = useRouter();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'enter' | 'view' | 'class-summary'>('enter');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClassroomTeacher, setSelectedClassroomTeacher] = useState<string>('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [classSummaryTeacher, setClassSummaryTeacher] = useState<string>('');
  const [classSummaryGrade, setClassSummaryGrade] = useState<string>('');
  const [viewTestsTeacher, setViewTestsTeacher] = useState<string>('');
  const [viewTestsGrade, setViewTestsGrade] = useState<string>('');
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
        console.log('[TeacherAssessment] Checking session...');
        const response = await fetch('/api/auth/check-session');
        console.log('[TeacherAssessment] Session check response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[TeacherAssessment] Session data:', data);
          
          if (data.teacher) {
            // If secondary teacher, redirect to secondary assessment page
            if (data.teacher.schoolLevel === 'SECONDARY') {
              console.log('[TeacherAssessment] Secondary teacher, redirecting to /teacher/assessment/secondary');
              router.push('/teacher/assessment/secondary');
              return;
            }
            setTeacherInfo(data.teacher);
            setLoading(false);
          } else {
            // No teacher in session, redirect to login
            console.log('[TeacherAssessment] No teacher in session, redirecting to login');
            router.push('/auth/teacher-signin');
          }
        } else {
          // Not authenticated, redirect to login
          console.log('[TeacherAssessment] Not authenticated (status', response.status, '), redirecting to login');
          router.push('/auth/teacher-signin');
        }
      } catch (err) {
        console.error('[TeacherAssessment] Failed to get teacher info:', err);
        router.push('/auth/teacher-signin');
      }
    };
    getTeacherInfo();
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
  }, [teacherInfo]);

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
    
    // For pacerOrMileRun: round if PACER, keep decimal if Mile Run
    // For all other numeric fields: round to whole numbers
    let normalizedValue: string | number | undefined = value;
    
    if (type === 'number') {
      if (numericValue === undefined) {
        normalizedValue = undefined;
      } else if (name === 'pacerOrMileRun') {
        // Only round PACER laps, not Mile Run times (Mile needs decimals like 9.8 for 9:48)
        normalizedValue = formData.cardioTestType === 'PACER' ? Math.round(numericValue) : numericValue;
      } else {
        // All other numeric fields: round to whole numbers
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
    // BMI = (weight in pounds / (height in inches)^2) * 703
    return (weight / (height * height)) * 703;
  };

  const calculateAge = (dateOfBirth: string, testDate: string) => {
    if (!dateOfBirth || !testDate) return undefined;
    const dob = new Date(dateOfBirth);
    const test = new Date(testDate);
    let age = test.getFullYear() - dob.getFullYear();
    const monthDiff = test.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  const isPacer = formData.cardioTestType === 'PACER';

  // Convert decimal minutes to min/sec display
  const mileMinutes = !isPacer && formData.pacerOrMileRun !== undefined
    ? Math.floor(formData.pacerOrMileRun)
    : '';
  const mileSeconds = !isPacer && formData.pacerOrMileRun !== undefined
    ? Math.min(59, Math.max(0, Math.round((formData.pacerOrMileRun - Math.floor(formData.pacerOrMileRun)) * 60)))
    : '';

  const handleMileTimeChange = (minutes: number | '', seconds: number | '') => {
    if (minutes === '' && seconds === '') {
      setFormData(prev => ({ ...prev, pacerOrMileRun: undefined }));
      return;
    }
    const safeMinutes = minutes === '' ? 0 : Math.floor(Number(minutes));
    const safeSeconds = seconds === '' ? 0 : Math.floor(Number(seconds));
    const normalizedSeconds = Math.min(59, Math.max(0, safeSeconds));
    const value = safeMinutes + normalizedSeconds / 60;
    setFormData(prev => ({ ...prev, pacerOrMileRun: value }));
  };

  const calculateImprovementStatus = (
    fallTest: TestData | undefined,
    springTest: TestData | undefined,
    student: Student
  ) => {
    if (!fallTest || !springTest) {
      return {
        status: 'No Data',
        change: 0,
        percentChange: 0,
        reason: 'Missing Fall or Spring test',
        color: 'text-gray-500'
      };
    }

    // Only compare PACER tests (not 1-Mile)
    if (fallTest.cardioTestType !== 'PACER' || springTest.cardioTestType !== 'PACER') {
      return {
        status: 'Not Comparable',
        change: 0,
        percentChange: 0,
        reason: 'Only PACER tests can be compared',
        color: 'text-gray-500'
      };
    }

    const fallValue = fallTest.pacerOrMileRun || 0;
    const springValue = springTest.pacerOrMileRun || 0;
    const lapChange = springValue - fallValue;
    const percentChange = fallValue > 0 ? ((lapChange / fallValue) * 100) : 0;

    // Calculate if moved to HFZ
    const fallAge = calculateAge(student.dateOfBirth, fallTest.testDate);
    const springAge = calculateAge(student.dateOfBirth, springTest.testDate);
    const fallZone = getFitnessZone('pacerOrMileRun', fallValue, fallAge, student.sex, false);
    const springZone = getFitnessZone('pacerOrMileRun', springValue, springAge, student.sex, false);
    const movedToHFZ = fallZone?.includes('Needs Improvement') && springZone?.includes('Healthy');

    // Check improvement criteria
    const hasSignificantIncrease = lapChange >= 5;
    const hasPercentIncrease = percentChange >= 10;
    const hasZoneImprovement = movedToHFZ;

    if (hasSignificantIncrease || hasPercentIncrease || hasZoneImprovement) {
      let reason = '';
      if (hasSignificantIncrease) reason += `+${lapChange} laps `;
      if (hasPercentIncrease) reason += `(${percentChange.toFixed(1)}%) `;
      if (hasZoneImprovement) reason += '(Moved to HFZ) ';
      
      return {
        status: 'Significant Improvement',
        change: lapChange,
        percentChange,
        reason: reason.trim(),
        color: 'text-green-600 font-semibold'
      };
    }

    // Check for "No Clear Change"
    if (Math.abs(lapChange) < 3 && Math.abs(percentChange) < 10) {
      return {
        status: 'No Clear Change',
        change: lapChange,
        percentChange,
        reason: `${lapChange > 0 ? '+' : ''}${lapChange} (${percentChange.toFixed(1)}%)`,
        color: 'text-gray-600'
      };
    }

    // Moderate improvement (3-5 laps and/or 5-10%)
    if (lapChange > 0) {
      return {
        status: 'Moderate Improvement',
        change: lapChange,
        percentChange,
        reason: `+${lapChange} (${percentChange.toFixed(1)}%)`,
        color: 'text-blue-600 font-medium'
      };
    }

    // Declined
    if (lapChange < 0) {
      return {
        status: '⬇️ Declined',
        change: lapChange,
        percentChange,
        reason: `${lapChange} (${percentChange.toFixed(1)}%)`,
        color: 'text-red-600 font-semibold'
      };
    }

    return {
      status: 'No Change',
      change: 0,
      percentChange: 0,
      reason: 'Same as Fall',
      color: 'text-gray-500'
    };
  };;

  const getFitnessZone = (
    component: FitnessComponent,
    value: number | undefined,
    age: number | undefined,
    sex: string | undefined,
    isOneMilleRun?: boolean
  ) => {
    if (value === undefined || age === undefined || !sex) return undefined;

    const data = standards as StandardsData;
    const sexKey = sex.toUpperCase().startsWith('M') ? 'boys' : 'girls';
    const ageKey = age >= 17 ? '17+' : String(age);
    const ageCardio = data[sexKey].cardio[ageKey];
    const ageMuscular = data[sexKey].muscular[ageKey];

    let range: StandardsRange | { min?: number } | undefined;
    if (component === 'pacerOrMileRun') {
      range = isOneMilleRun ? (ageCardio as any)?.oneMilleRun : ageCardio?.pacer20;
    }
    if (component === 'bmi') range = ageCardio?.bmi;
    if (component === 'pushups') range = ageMuscular?.pushup90;
    if (component === 'situps') range = ageMuscular?.curlup;
    if (component === 'trunkLift') range = ageMuscular?.trunkLift;
    if (component === 'sitAndReach') range = ageMuscular?.sitAndReach;

    if (!range) return 'Zone: No standard';

    const min = 'min' in range ? range.min : undefined;
    const max = 'max' in range ? (range as StandardsRange).max : undefined;

    if (min !== undefined && max !== undefined) {
      // For 1-mile run, LOWER times are better (inverse of PACER)
      if (isOneMilleRun) {
        if (value > max) return 'Zone: Needs Improvement (Slow)';
        if (value < min) return 'Zone: Needs Improvement (Fast)';
        return 'Zone: Healthy Fitness Zone';
      } else {
        // PACER: higher values are better
        if (value < min) return 'Zone: Needs Improvement (Low)';
        if (value > max) return 'Zone: Needs Improvement (High)';
        return 'Zone: Healthy Fitness Zone';
      }
    }

    // BMI only has a max value (no min), lower is better
    if (component === 'bmi' && max !== undefined && min === undefined) {
      if (value <= max) return 'Zone: Healthy Fitness Zone';
      return 'Zone: Needs Improvement (High)';
    }

    if (min !== undefined) {
      if (isOneMilleRun) {
        if (value > min) return 'Zone: Healthy Fitness Zone';
        return 'Zone: Needs Improvement';
      } else {
        if (value < min) return 'Zone: Needs Improvement';
        return 'Zone: Healthy Fitness Zone';
      }
    }

    return 'Zone: No standard';
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
        cardioTestType: formData.cardioTestType,
      });
      
      // Show success message for 2 seconds
      setTimeout(() => setSuccess(''), 2000);
      
      // Reload tests list
      await loadTests();
    } catch (err: any) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateTab = (tab: 'enter' | 'view' | 'class-summary') => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const selectedStudent = students.find(s => s.id === formData.studentId);
  const selectedStudentAge = selectedStudent
    ? calculateAge(selectedStudent.dateOfBirth, formData.testDate)
    : undefined;
  const currentBMI = calculateBMI(formData.height, formData.weight);
  const viewableTests = teacherInfo
    ? tests.filter(test => test.student.currentSchool === teacherInfo.school)
    : tests;

  const availableGrades = Array.from(new Set(students.map(s => s.currentGrade))).sort((a, b) => a - b);
  const gradeFilteredStudents = selectedGrade
    ? students.filter(s => s.currentGrade === Number(selectedGrade))
    : students;
  const classroomFilteredStudents = gradeFilteredStudents.filter(
    s => !selectedClassroomTeacher || s.classroomTeacher === selectedClassroomTeacher
  );

  const viewTestsGrades = Array.from(new Set(viewableTests.map(t => t.student.currentGrade))).sort((a, b) => a - b);
  const viewTestsSeasons = Array.from(new Set(viewableTests.map(t => t.testSeason))).sort();
  const viewGradeFilteredTests = viewTestsGrade
    ? viewableTests.filter(t => t.student.currentGrade === Number(viewTestsGrade))
    : viewableTests;
  const viewGradeAndSeasonFilteredTests = viewTestsSeason
    ? viewGradeFilteredTests.filter(t => t.testSeason === viewTestsSeason)
    : viewGradeFilteredTests;

  const classSummaryGrades = Array.from(new Set(students.map(s => s.currentGrade))).sort((a, b) => a - b);
  const classSummaryFilteredStudents = classSummaryGrade
    ? students.filter(s => s.currentGrade === Number(classSummaryGrade))
    : students;

  if (loading && !teacherInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {/* Grade Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level *
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setSelectedClassroomTeacher('');
                      setFormData({ ...formData, studentId: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select grade level...</option>
                    {availableGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

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
                    disabled={!selectedGrade}
                  >
                    <option value="">Select classroom teacher...</option>
                    {Array.from(new Set(gradeFilteredStudents.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map(teacher => (
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
                      disabled={!selectedGrade || !selectedClassroomTeacher}
                    >
                      <option value="">Select a student...</option>
                      {classroomFilteredStudents
                        .map(student => {
                          const hasCompletedTest = tests.some(t => t.studentId === student.id);
                          return (
                            <option key={student.id} value={student.id}>
                              {hasCompletedTest ? '✓ ' : '○ '}{student.firstName} {student.lastName} (Grade {student.currentGrade})
                            </option>
                          );
                        })}
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
                    <p className="text-sm"><strong>Age:</strong> {selectedStudentAge ?? '-'} years</p>
                    <p className="text-sm"><strong>Date of Birth:</strong> {selectedStudent.dateOfBirth}</p>
                    <p className="text-sm"><strong>Sex:</strong> {selectedStudent.sex}</p>
                    <p className="text-sm"><strong>School:</strong> {selectedStudent.currentSchool}</p>
                    <p className="text-sm"><strong>PE Teacher:</strong> {selectedStudent.peTeacher}</p>
                  </div>
                )}

                {/* Test Metrics */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardio Test
                      </label>
                      <div className="grid grid-cols-2 gap-1 rounded-lg border border-gray-300 bg-gray-50 p-1 w-full">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              cardioTestType: 'PACER',
                              pacerOrMileRun: prev.cardioTestType === 'PACER' ? prev.pacerOrMileRun : undefined,
                            }))
                          }
                          className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                            isPacer ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
                          }`}
                          aria-pressed={isPacer}
                        >
                          🏃‍♂️ PACER
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              cardioTestType: 'MILE',
                              pacerOrMileRun: prev.cardioTestType === 'MILE' ? prev.pacerOrMileRun : undefined,
                            }))
                          }
                          className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                            !isPacer ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
                          }`}
                          aria-pressed={!isPacer}
                        >
                          ⏱ 1-Mile
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {isPacer ? 'Enter PACER laps completed.' : 'Enter time in minutes and seconds.'}
                      </p>
                      {isPacer ? (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">
                            PACER (laps)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="pacerOrMileRun"
                              step={1}
                              min={0}
                              placeholder="e.g., 25"
                              value={formData.pacerOrMileRun || ''}
                              onChange={handleFormChange}
                              className="w-full pr-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                              laps
                            </span>
                          </div>
                          <p className={`text-xs font-medium mt-1 ${
                            getFitnessZone('pacerOrMileRun', formData.pacerOrMileRun, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {getFitnessZone('pacerOrMileRun', formData.pacerOrMileRun, selectedStudentAge, selectedStudent?.sex) || 'Zone: —'}
                          </p>
                        </>
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">
                            1-Mile Run Time
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Minutes</label>
                              <input
                                type="number"
                                min={0}
                                placeholder="e.g., 9"
                                value={mileMinutes}
                                onChange={(e) => {
                                  const min = e.target.value === '' ? '' : parseInt(e.target.value, 10) || '';
                                  handleMileTimeChange(min, mileSeconds);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Seconds</label>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                placeholder="e.g., 48"
                                value={mileSeconds}
                                onChange={(e) => {
                                  const min = formData.pacerOrMileRun !== undefined ? Math.floor(formData.pacerOrMileRun) : '';
                                  const sec = e.target.value === '' ? '' : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
                                  handleMileTimeChange(min, sec);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <p className={`text-xs font-medium mt-1 ${
                            getFitnessZone('pacerOrMileRun', formData.pacerOrMileRun, selectedStudentAge, selectedStudent?.sex, true)?.includes('Healthy') 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {getFitnessZone('pacerOrMileRun', formData.pacerOrMileRun, selectedStudentAge, selectedStudent?.sex, true) || 'Zone: —'}
                          </p>
                        </>
                      )}
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
                      <p className={`text-xs font-medium mt-1 ${
                        getFitnessZone('pushups', formData.pushups, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {getFitnessZone('pushups', formData.pushups, selectedStudentAge, selectedStudent?.sex) || 'Zone: —'}
                      </p>
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
                      <p className={`text-xs font-medium mt-1 ${
                        getFitnessZone('situps', formData.situps, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {getFitnessZone('situps', formData.situps, selectedStudentAge, selectedStudent?.sex) || 'Zone: —'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sit and Reach (inches)
                      </label>
                      <input
                        type="number"
                        name="sitAndReach"
                        value={formData.sitAndReach || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className={`text-xs font-medium mt-1 ${
                        getFitnessZone('sitAndReach', formData.sitAndReach, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {getFitnessZone('sitAndReach', formData.sitAndReach, selectedStudentAge, selectedStudent?.sex) || 'Zone: —'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (inches)
                      </label>
                      <input
                        type="number"
                        name="height"
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
                        value={formData.trunkLift || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className={`text-xs font-medium mt-1 ${
                        getFitnessZone('trunkLift', formData.trunkLift, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {getFitnessZone('trunkLift', formData.trunkLift, selectedStudentAge, selectedStudent?.sex) || 'Zone: —'}
                      </p>
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
                      <p className={`text-xs font-medium mt-1 ${
                        getFitnessZone('bmi', currentBMI, selectedStudentAge, selectedStudent?.sex)?.includes('Healthy') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {getFitnessZone('bmi', currentBMI, selectedStudentAge, selectedStudent?.sex) || 'BMI Zone: —'}
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
            
            {viewableTests.length === 0 ? (
              <p className="text-gray-600">No tests have been entered yet.</p>
            ) : (
              <div>
                {/* Grade Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Grade Level
                  </label>
                  <select
                    value={viewTestsGrade}
                    onChange={(e) => {
                      setViewTestsGrade(e.target.value);
                      setViewTestsTeacher('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Grades</option>
                    {viewTestsGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {/* Season Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Test Season
                  </label>
                  <select
                    value={viewTestsSeason}
                    onChange={(e) => setViewTestsSeason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Seasons</option>
                    {viewTestsSeasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                {/* Classroom Teacher Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Classroom Teacher
                  </label>
                  <select
                    value={viewTestsTeacher}
                    onChange={(e) => setViewTestsTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!viewTestsGrade}
                  >
                    <option value="">All Classroom Teachers</option>
                    {Array.from(new Set(viewGradeFilteredTests.map(t => t.student.classroomTeacher).filter(Boolean))).sort().map(teacher => (
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
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Pacer/Mile</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Height</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Weight</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">BMI</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewGradeAndSeasonFilteredTests
                        .filter(test => !viewTestsTeacher || test.student.classroomTeacher === viewTestsTeacher)
                        .map((test) => (
                          <React.Fragment key={test.id}>
                            <tr className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-2">{test.student.firstName} {test.student.lastName}</td>
                              <td className="px-4 py-2">{test.student.classroomTeacher || '-'}</td>
                              <td className="px-4 py-2">{test.student.districtId}</td>
                              <td className="px-4 py-2">{test.student.currentGrade}</td>
                              <td className="px-4 py-2">{new Date(test.testDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{test.testSeason}</td>
                              <td className="px-4 py-2">{test.pacerOrMileRun ?? '-'}</td>
                              <td className="px-4 py-2">{test.height || '-'} in</td>
                              <td className="px-4 py-2">{test.weight || '-'} lbs</td>
                              <td className="px-4 py-2">{test.bmi ? test.bmi.toFixed(1) : '-'}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setSelectedClassroomTeacher(test.student.classroomTeacher || '');
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
                                  <button
                                    onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    {expandedTestId === test.id ? 'Hide' : 'Details'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedTestId === test.id && (
                              <tr className="border-t border-gray-200 bg-gray-50">
                                <td colSpan={11} className="px-4 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500">Pacer/Mile</p>
                                      <p className="font-medium text-gray-900">{test.pacerOrMileRun ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Push-ups</p>
                                      <p className="font-medium text-gray-900">{test.pushups ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Sit-ups</p>
                                      <p className="font-medium text-gray-900">{test.situps ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Sit & Reach</p>
                                      <p className="font-medium text-gray-900">{test.sitAndReach ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Trunk Lift</p>
                                      <p className="font-medium text-gray-900">{test.trunkLift ?? '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Shoulder Stretch</p>
                                      <p className="font-medium text-gray-900">
                                        R: {test.shoulderStretchRight ? 'Pass' : 'Fail'} | L: {test.shoulderStretchLeft ? 'Pass' : 'Fail'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Height</p>
                                      <p className="font-medium text-gray-900">{test.height || '-'} in</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Weight</p>
                                      <p className="font-medium text-gray-900">{test.weight || '-'} lbs</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">BMI</p>
                                      <p className="font-medium text-gray-900">{test.bmi ? test.bmi.toFixed(1) : '-'}</p>
                                    </div>
                                    {test.notes && (
                                      <div className="md:col-span-3">
                                        <p className="text-gray-500">Notes</p>
                                        <p className="font-medium text-gray-900">{test.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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
            <h2 className="text-2xl font-bold mb-6">Class Summary - Fall vs Spring Comparison</h2>
            
            {students.length === 0 ? (
              <p className="text-gray-600">No students found.</p>
            ) : (
              <div>
                {/* Grade Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Grade Level
                  </label>
                  <select
                    value={classSummaryGrade}
                    onChange={(e) => {
                      setClassSummaryGrade(e.target.value);
                      setClassSummaryTeacher('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Grades</option>
                    {classSummaryGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {/* Classroom Teacher Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Classroom Teacher
                  </label>
                  <select
                    value={classSummaryTeacher}
                    onChange={(e) => setClassSummaryTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!classSummaryGrade}
                  >
                    <option value="">All Classroom Teachers</option>
                    {Array.from(new Set(classSummaryFilteredStudents.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-8">
                  {Array.from(new Set(classSummaryFilteredStudents.filter(s => s.classroomTeacher).map(s => s.classroomTeacher))).sort().map((teacher) => {
                    // Skip if filtering and teacher doesn't match
                    if (classSummaryTeacher && teacher !== classSummaryTeacher) {
                      return null;
                    }

                    const classStudents = classSummaryFilteredStudents.filter(s => s.classroomTeacher === teacher);
                    const fallTests = new Map();
                    const springTests = new Map();
                    
                    // Organize tests by student and season
                    tests.forEach(test => {
                      if (classStudents.some(cs => cs.id === test.studentId)) {
                        if (test.testSeason === 'Fall') {
                          fallTests.set(test.studentId, test);
                        } else if (test.testSeason === 'Spring') {
                          springTests.set(test.studentId, test);
                        }
                      }
                    });

                    const completedFall = fallTests.size;
                    const completedSpring = springTests.size;
                    
                    return (
                      <div key={teacher} className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4">
                          <h3 className="text-lg font-semibold text-gray-900">{teacher}</h3>
                          <div className="flex gap-6 mt-2 text-sm text-gray-600">
                            <span>Fall Tests: {completedFall}/{classStudents.length}</span>
                            <span>Spring Tests: {completedSpring}/{classStudents.length}</span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                                <th colSpan={2} className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-200">Fall Test</th>
                                <th colSpan={2} className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-200">Spring Test</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-700 border-l border-gray-200">Change</th>
                              </tr>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-xs text-gray-600"></th>
                                <th className="px-4 py-2 text-center text-xs text-gray-600 border-l border-gray-200">Pacer/Mile</th>
                                <th className="px-4 py-2 text-center text-xs text-gray-600">BMI</th>
                                <th className="px-4 py-2 text-center text-xs text-gray-600 border-l border-gray-200">Pacer/Mile</th>
                                <th className="px-4 py-2 text-center text-xs text-gray-600">BMI</th>
                                <th className="px-4 py-2 text-center text-xs text-gray-600 border-l border-gray-200">Pacer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classStudents.map((student) => {
                                const fallTest = fallTests.get(student.id);
                                const springTest = springTests.get(student.id);
                                const improvement = calculateImprovementStatus(fallTest, springTest, student);
                                
                                const rowBgClass = improvement.status.includes('⬇️') ? 'bg-red-50' : '';
                                
                                return (
                                  <tr key={student.id} className={`border-b border-gray-200 hover:bg-gray-50 ${rowBgClass}`}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                      {student.firstName} {student.lastName}
                                    </td>
                                    <td className="px-4 py-3 text-center border-l border-gray-200">
                                      {fallTest ? (
                                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                                          {fallTest.pacerOrMileRun ?? '—'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">Pending</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {fallTest ? (
                                        <span className="text-gray-700">
                                          {fallTest.bmi ? fallTest.bmi.toFixed(1) : '—'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center border-l border-gray-200">
                                      {springTest ? (
                                        <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                                          {springTest.pacerOrMileRun ?? '—'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">Pending</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {springTest ? (
                                        <span className="text-gray-700">
                                          {springTest.bmi ? springTest.bmi.toFixed(1) : '—'}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">—</span>
                                      )}
                                    </td>
                                    <td className={`px-4 py-3 text-center border-l border-gray-200 ${improvement.color}`}>
                                      <div className="font-medium">{improvement.status}</div>
                                      <div className="text-xs text-gray-600 mt-1">{improvement.reason}</div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
    </div>
  );
}
