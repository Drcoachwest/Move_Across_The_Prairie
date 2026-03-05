'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import standards from '@/lib/fitnessgram-standards.json';
import {
  normalizeNumberInput,
  validateMileTime,
  validateNumber,
} from '@/lib/fitnessgram/validation';
import { calculateBMI_US } from '@/lib/fitnessgram/bmi';
import { computeAgeOnTestDate, getBmiHfzRange, getHfzThresholds, isHFZ } from '@/lib/fitnessgram/hfz';

const SEASON_OPTIONS = [
  { value: 'Fall', label: 'Fall' },
  { value: 'Spring', label: 'Spring' },
];

const CARDIO_TEST_OPTIONS = [
  { value: 'PACER', label: 'PACER' },
  { value: 'MileRun', label: '1-Mile Run' },
];

const formatSecondsAsTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const formatBmiRangeLabel = (range?: { min?: number | null; max?: number | null }) => {
  if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') return null;
  return `HFZ BMI range: ${range.min.toFixed(1)}–${range.max.toFixed(1)}`;
};

const getSexLabel = (sex: string) => {
  const normalized = String(sex).trim().toLowerCase();
  if (['m', 'male', 'boy', 'boys'].includes(normalized)) return 'Boys';
  if (['f', 'female', 'girl', 'girls'].includes(normalized)) return 'Girls';
  return 'Students';
};

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
  cardioTestType: 'PACER' | 'MileRun';
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

type RowData = FormData;

type RowStatus = 'saved' | 'dirty' | 'saving' | 'error' | 'idle';

interface TestData {
  id: string;
  studentId: string;
  testDate: string;
  testSeason: 'Fall' | 'Spring';
  testYear: number;
  cardioTestType?: 'PACER' | 'MileRun';
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
  const [rowsByStudentId, setRowsByStudentId] = useState<Record<string, RowData>>({});
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [patchesByStudentId, setPatchesByStudentId] = useState<Record<string, Partial<RowData>>>({});
  const [rowStatusById, setRowStatusById] = useState<Record<string, RowStatus>>({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});
  const [validationErrorsById, setValidationErrorsById] = useState<Record<string, string[]>>({});
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [seasonAll, setSeasonAll] = useState<FormData['testSeason'] | ''>('');
  const [cardioAll, setCardioAll] = useState<FormData['cardioTestType'] | ''>('');
  const [dateAll, setDateAll] = useState<string>('');
  const prevSeasonAllRef = useRef<FormData['testSeason'] | ''>('');
  const prevCardioAllRef = useRef<FormData['cardioTestType'] | ''>('');
  const prevDateAllRef = useRef<string>('');

  const failedRowIds = useMemo(
    () => Object.keys(rowStatusById).filter((id) => rowStatusById[id] === 'error'),
    [rowStatusById]
  );
  const failedCount = failedRowIds.length;
  const invalidRowIds = useMemo(
    () =>
      Object.keys(validationErrorsById).filter(
        (id) => (validationErrorsById[id]?.length ?? 0) > 0 && Boolean(rowsByStudentId[id])
      ),
    [rowsByStudentId, validationErrorsById]
  );
  const hasValidationErrors = invalidRowIds.length > 0;

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

  const loadStudents = useCallback(async () => {
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
  }, [teacherInfo]);

  const loadTests = useCallback(async (grade: string, classroomTeacher: string) => {
    try {
      if (!grade) {
        setTests([]);
        return;
      }

      const params = new URLSearchParams({ grade });
      if (classroomTeacher) params.set('classroomTeacher', classroomTeacher);

      const response = await fetch(`/api/teacher/assessment?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  }, []);

  // Load students and tests on mount and when entering test data tab
  useEffect(() => {
    if (teacherInfo) {
      loadStudents();
    }
  }, [teacherInfo, loadStudents]);

  useEffect(() => {
    if (!teacherInfo) return;

    if (activeTab === 'enter') {
      if (selectedGrade) {
        loadTests(selectedGrade, selectedClassroomTeacher);
      }
      return;
    }

    if (activeTab === 'view') {
      loadTests(viewTestsGrade, viewTestsTeacher);
      return;
    }

    if (activeTab === 'class-summary') {
      if (classSummaryGrade) {
        loadTests(classSummaryGrade, classSummaryTeacher);
      }
    }
  }, [
    activeTab,
    classSummaryGrade,
    classSummaryTeacher,
    loadTests,
    selectedClassroomTeacher,
    selectedGrade,
    teacherInfo,
    viewTestsGrade,
    viewTestsTeacher,
  ]);

  const deriveTestYear = (testDate?: string) => {
    if (testDate) {
      const parsed = new Date(testDate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.getFullYear();
      }
    }
    return new Date().getFullYear();
  };

  const normalizeMileValueToSeconds = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return undefined;
    if (value < 0) return undefined;
    if (value < 60) {
      return Math.round(value * 60);
    }
    return Math.round(value);
  };

  const formatMileTime = (value?: number) => {
    const totalSeconds = normalizeMileValueToSeconds(value);
    if (totalSeconds === undefined) return '-';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const renderHfzIndicator = (status: boolean | null, title?: string) => {
    if (status === null) return null;
    const badgeClass = status
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

    return (
      <div
        className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[10px] ${badgeClass}`}
        title={title}
      >
        {status ? 'HFZ' : 'Not HFZ'}
      </div>
    );
  };

  const validateRow = (row: RowData) => {
    const errors: string[] = [];

    if (row.cardioTestType === 'PACER' && row.pacerOrMileRun !== undefined) {
      const pacerResult = validateNumber('pacerLaps', row.pacerOrMileRun);
      if (!pacerResult.valid && pacerResult.message) {
        errors.push(pacerResult.message);
      }
    }

    if (row.cardioTestType === 'MileRun' && row.pacerOrMileRun !== undefined) {
      const minutes = Math.floor(row.pacerOrMileRun / 60);
      const seconds = row.pacerOrMileRun % 60;
      const mileResult = validateMileTime(minutes, seconds);
      if (!mileResult.valid && mileResult.message) {
        errors.push(mileResult.message);
      }
    }

    const numericFields: Array<{ label: string; value?: number }> = [
      { label: 'Push-ups', value: row.pushups },
      { label: 'Sit-ups', value: row.situps },
      { label: 'Sit & Reach', value: row.sitAndReach },
      { label: 'Height', value: row.height },
      { label: 'Weight', value: row.weight },
    ];

    if (row.situps !== undefined) {
      const curlUpResult = validateNumber('curlUps', row.situps);
      if (!curlUpResult.valid && curlUpResult.message) {
        errors.push(curlUpResult.message);
      }
    }

    if (row.trunkLift !== undefined) {
      const trunkResult = validateNumber('trunkLift', row.trunkLift);
      if (!trunkResult.valid && trunkResult.message) {
        errors.push(trunkResult.message);
      }
    }

    numericFields.forEach((field) => {
      if (field.value !== undefined && field.value < 0) {
        errors.push(`${field.label} cannot be negative.`);
      }
    });

    return errors;
  };

  const handleRowChange = (
    studentId: string,
    field: keyof RowData,
    value: string | boolean | number | undefined
  ) => {
    setRowsByStudentId((prev) => {
      const nextRow = {
        ...prev[studentId],
        [field]: value,
      };
      const next = {
        ...prev,
        [studentId]: nextRow,
      };

      const errors = validateRow(nextRow);
      setValidationErrorsById((prevErrors) => {
        if (errors.length === 0) {
          if (!prevErrors[studentId]) return prevErrors;
          const nextErrors = { ...prevErrors };
          delete nextErrors[studentId];
          return nextErrors;
        }
        return {
          ...prevErrors,
          [studentId]: errors,
        };
      });

      return next;
    });

    setPatchesByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));

    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });

    setRowStatusById((prev) => ({
      ...prev,
      [studentId]: 'dirty',
    }));

    setRowErrorById((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleRowPatch = (studentId: string, patch: Partial<RowData>) => {
    setRowsByStudentId((prev) => {
      const nextRow = {
        ...prev[studentId],
        ...patch,
      };
      const next = {
        ...prev,
        [studentId]: nextRow,
      };

      const errors = validateRow(nextRow);
      setValidationErrorsById((prevErrors) => {
        if (errors.length === 0) {
          if (!prevErrors[studentId]) return prevErrors;
          const nextErrors = { ...prevErrors };
          delete nextErrors[studentId];
          return nextErrors;
        }
        return {
          ...prevErrors,
          [studentId]: errors,
        };
      });

      return next;
    });

    setPatchesByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        ...patch,
      },
    }));

    setDirtyRowIds((prev) => {
      const next = new Set(prev);
      next.add(studentId);
      return next;
    });

    setRowStatusById((prev) => ({
      ...prev,
      [studentId]: 'dirty',
    }));

    setRowErrorById((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const selectAllOnFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  const preventMouseDownDeselect = (event: React.MouseEvent<HTMLInputElement>) => {
    if (document.activeElement === event.currentTarget) {
      event.preventDefault();
    }
  };

  const applyToAllRows = useCallback(
    (field: keyof RowData, value: string | boolean | number | undefined) => {
      const studentIds = Object.keys(rowsByStudentId);
      if (studentIds.length === 0) return;

      setRowsByStudentId((prev) => {
        const next: Record<string, RowData> = {};
        studentIds.forEach((id) => {
          const nextRow = {
            ...prev[id],
            [field]: value,
          };
          next[id] = nextRow;
        });
        return next;
      });

      setPatchesByStudentId((prev) => {
        const next = { ...prev };
        studentIds.forEach((id) => {
          next[id] = {
            ...next[id],
            [field]: value,
          };
        });
        return next;
      });

      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        studentIds.forEach((id) => next.add(id));
        return next;
      });

      setRowStatusById((prev) => {
        const next = { ...prev };
        studentIds.forEach((id) => {
          next[id] = 'dirty';
        });
        return next;
      });

      setRowErrorById((prev) => {
        const next = { ...prev };
        studentIds.forEach((id) => {
          if (next[id]) delete next[id];
        });
        return next;
      });
    },
    [rowsByStudentId]
  );

  const getUniformRowValue = useCallback(
    <K extends keyof RowData>(field: K): RowData[K] | '' => {
      const ids = Object.keys(rowsByStudentId);
      if (ids.length === 0) return '';
      const first = rowsByStudentId[ids[0]]?.[field];
      for (let i = 1; i < ids.length; i += 1) {
        if (rowsByStudentId[ids[i]]?.[field] !== first) {
          return '';
        }
      }
      return first ?? '';
    },
    [rowsByStudentId]
  );

  useEffect(() => {
    const seasonValue = getUniformRowValue('testSeason') as FormData['testSeason'] | '';
    const cardioValue = getUniformRowValue('cardioTestType') as FormData['cardioTestType'] | '';
    const dateValue = (getUniformRowValue('testDate') as string) || '';

    setSeasonAll(seasonValue);
    setCardioAll(cardioValue);
    setDateAll(dateValue);
    prevSeasonAllRef.current = seasonValue;
    prevCardioAllRef.current = cardioValue;
    prevDateAllRef.current = dateValue;
  }, [getUniformRowValue]);

  const getSeasonLabel = (value: FormData['testSeason']) => {
    return SEASON_OPTIONS.find((option) => option.value === value)?.label || value;
  };

  const confirmApplyToAll = (
    field: keyof RowData,
    nextValue: string | boolean | number | undefined,
    displayValue: string,
    setValue: (value: any) => void,
    prevRef: React.MutableRefObject<any>
  ) => {
    const count = Object.keys(rowsByStudentId).length;
    if (count === 0) return false;
    const confirmed = window.confirm(
      `Apply ${displayValue} to ${count} student${count === 1 ? '' : 's'}?`
    );
    if (!confirmed) {
      setValue(prevRef.current);
      return false;
    }
    setValue(nextValue);
    prevRef.current = nextValue;
    applyToAllRows(field, nextValue);
    return true;
  };

  const hasClassCardioEntries = () =>
    Object.values(rowsByStudentId).some((row) => row.pacerOrMileRun !== undefined);

  const handleClassCardioChange = (nextValue: FormData['cardioTestType']) => {
    const hasEntries = hasClassCardioEntries();
    if (hasEntries) {
      const shouldContinue = window.confirm(
        'Switching cardio test will clear existing cardio scores for this class. Continue?'
      );
      if (!shouldContinue) {
        setCardioAll(prevCardioAllRef.current);
        return;
      }
    }

    setCardioAll(nextValue);
    prevCardioAllRef.current = nextValue;
    applyToAllRows('cardioTestType', nextValue);
    if (hasEntries) {
      applyToAllRows('pacerOrMileRun', undefined);
    }
  };

  const getMileParts = (totalSeconds?: number): { minutes: number | ''; seconds: number | '' } => {
    if (totalSeconds === undefined || totalSeconds === null) {
      return { minutes: '', seconds: '' };
    }
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    return {
      minutes: Math.floor(safeSeconds / 60),
      seconds: safeSeconds % 60,
    };
  };

  const handleMileTimeChange = (studentId: string, minutes: number | '', seconds: number | '') => {
    if (minutes === '' && seconds === '') {
      handleRowChange(studentId, 'pacerOrMileRun', undefined);
      return;
    }
    const safeMinutes = minutes === '' ? 0 : Math.max(0, Math.floor(Number(minutes)));
    const safeSeconds = seconds === '' ? 0 : Math.min(59, Math.max(0, Math.floor(Number(seconds))));
    const totalSeconds = safeMinutes * 60 + safeSeconds;
    handleRowChange(studentId, 'pacerOrMileRun', totalSeconds);
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

  const availableGrades = useMemo(
    () => Array.from(new Set(students.map((s) => s.currentGrade))).sort((a, b) => a - b),
    [students]
  );

  const gradeFilteredStudents = useMemo(
    () => (selectedGrade ? students.filter((s) => s.currentGrade === Number(selectedGrade)) : students),
    [selectedGrade, students]
  );

  const classroomFilteredStudents = useMemo(
    () =>
      gradeFilteredStudents.filter(
        (s) => !selectedClassroomTeacher || s.classroomTeacher === selectedClassroomTeacher
      ),
    [gradeFilteredStudents, selectedClassroomTeacher]
  );

  useEffect(() => {
    if (!selectedGrade || !selectedClassroomTeacher) {
      setRowsByStudentId({});
      setRowStatusById({});
      setRowErrorById({});
      setValidationErrorsById({});
      setPatchesByStudentId({});
      setDirtyRowIds(new Set());
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nextRows: Record<string, RowData> = {};
    const nextStatuses: Record<string, RowStatus> = {};
    const nextValidationErrors: Record<string, string[]> = {};

    classroomFilteredStudents.forEach((student) => {
      const existingTest = tests.find((test) => test.studentId === student.id);
      const cardioTestType = (existingTest?.cardioTestType as FormData['cardioTestType']) || 'PACER';
      const rawCardioValue = existingTest?.pacerOrMileRun ?? undefined;
      const cardioValue = cardioTestType === 'MileRun'
        ? normalizeMileValueToSeconds(rawCardioValue ?? undefined)
        : rawCardioValue ?? undefined;

      const testDate = existingTest?.testDate
        ? new Date(existingTest.testDate).toISOString().split('T')[0]
        : today;

      const row: RowData = {
        studentId: student.id,
        testDate,
        testSeason: existingTest?.testSeason || 'Fall',
        cardioTestType,
        pacerOrMileRun: cardioValue,
        pushups: existingTest?.pushups ?? undefined,
        situps: existingTest?.situps ?? undefined,
        sitAndReach: existingTest?.sitAndReach ?? undefined,
        shoulderStretchRight: existingTest?.shoulderStretchRight ?? undefined,
        shoulderStretchLeft: existingTest?.shoulderStretchLeft ?? undefined,
        height: existingTest?.height ?? undefined,
        weight: existingTest?.weight ?? undefined,
        trunkLift: existingTest?.trunkLift ?? undefined,
        notes: existingTest?.notes ?? undefined,
      };

      nextRows[student.id] = row;
      nextStatuses[student.id] = existingTest ? 'saved' : 'idle';

      const errors = validateRow(row);
      if (errors.length > 0) {
        nextValidationErrors[student.id] = errors;
      }
    });

    setRowsByStudentId(nextRows);
    setRowStatusById(nextStatuses);
    setRowErrorById({});
    setValidationErrorsById(nextValidationErrors);
    setPatchesByStudentId({});
    setDirtyRowIds(new Set());
  }, [classroomFilteredStudents, selectedGrade, selectedClassroomTeacher, tests]);

  const saveClass = useCallback(async () => {
    if (hasValidationErrors) {
      setError('Fix highlighted values before saving.');
      return;
    }

    const dirtyIds = Array.from(dirtyRowIds);
    if (dirtyIds.length === 0) return;

    setError('');
    setSuccess('');

    const items = dirtyIds.map((studentId) => {
      const baseRow = rowsByStudentId[studentId];
      const patch = patchesByStudentId[studentId];
      const merged = { ...baseRow, ...patch };
      return {
        studentId,
        testDate: merged.testDate,
        testSeason: merged.testSeason,
        testYear: deriveTestYear(merged.testDate),
        cardioTestType: merged.cardioTestType,
        pacerOrMileRun: merged.pacerOrMileRun,
        pushups: merged.pushups,
        situps: merged.situps,
        sitAndReach: merged.sitAndReach,
        shoulderStretchRight: merged.shoulderStretchRight,
        shoulderStretchLeft: merged.shoulderStretchLeft,
        height: merged.height,
        weight: merged.weight,
        trunkLift: merged.trunkLift,
        notes: merged.notes,
      };
    });

    setIsSavingClass(true);
    setRowStatusById((prev) => {
      const next = { ...prev };
      dirtyIds.forEach((id) => {
        next[id] = 'saving';
      });
      return next;
    });

    try {
      const response = await fetch('/api/admin/assessment/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to save class');
      }

      const data = await response.json();
      const results: Array<{ studentId: string; success: boolean; error?: string }> = data.results || [];
      const failedResults = results.filter((result) => !result.success);

      results.forEach((result) => {
        if (!result.success) {
          setRowStatusById((prev) => ({ ...prev, [result.studentId]: 'error' }));
          setRowErrorById((prev) => ({
            ...prev,
            [result.studentId]: 'Couldn’t Save — try again.',
          }));
        } else {
          setRowStatusById((prev) => ({ ...prev, [result.studentId]: 'saved' }));
        }
      });

      setPatchesByStudentId((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.success) delete next[result.studentId];
        });
        return next;
      });

      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        results.forEach((result) => {
          if (result.success) next.delete(result.studentId);
        });
        return next;
      });

      if (failedResults.length === 0) {
        setSuccess('Class saved successfully.');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`Saved with ${failedResults.length} error${failedResults.length === 1 ? '' : 's'}.`);
      }
    } catch (err: any) {
      const message = err.message || 'Failed to save class';
      console.log('Save class failed', message);
      setRowStatusById((prev) => {
        const next = { ...prev };
        dirtyIds.forEach((id) => {
          next[id] = 'error';
        });
        return next;
      });
      setRowErrorById((prev) => {
        const next = { ...prev };
        dirtyIds.forEach((id) => {
          next[id] = 'Couldn’t Save — try again.';
        });
        return next;
      });
    } finally {
      setIsSavingClass(false);
    }
  }, [dirtyRowIds, rowsByStudentId, patchesByStudentId, hasValidationErrors]);

  const retryFailed = useCallback(async () => {
    if (failedRowIds.length === 0) return;

    setError('');
    setSuccess('');

    const items = failedRowIds.map((studentId) => {
      const baseRow = rowsByStudentId[studentId];
      const patch = patchesByStudentId[studentId];
      const merged = { ...baseRow, ...patch };
      return {
        studentId,
        testDate: merged.testDate,
        testSeason: merged.testSeason,
        testYear: deriveTestYear(merged.testDate),
        cardioTestType: merged.cardioTestType,
        pacerOrMileRun: merged.pacerOrMileRun,
        pushups: merged.pushups,
        situps: merged.situps,
        sitAndReach: merged.sitAndReach,
        shoulderStretchRight: merged.shoulderStretchRight,
        shoulderStretchLeft: merged.shoulderStretchLeft,
        height: merged.height,
        weight: merged.weight,
        trunkLift: merged.trunkLift,
        notes: merged.notes,
      };
    });

    setIsSavingClass(true);
    setRowStatusById((prev) => {
      const next = { ...prev };
      failedRowIds.forEach((id) => {
        next[id] = 'saving';
      });
      return next;
    });

    try {
      const response = await fetch('/api/admin/assessment/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (err) {
        console.log('Retry failed: invalid response', err);
      }

      if (!response.ok) {
        console.log('Retry failed: request error', data?.error || data?.message);
        setRowStatusById((prev) => {
          const next = { ...prev };
          failedRowIds.forEach((id) => {
            next[id] = 'error';
          });
          return next;
        });
        setRowErrorById((prev) => {
          const next = { ...prev };
          failedRowIds.forEach((id) => {
            next[id] = 'Couldn’t Save — try again.';
          });
          return next;
        });
        return;
      }

      if (data?.error) {
        console.log('Retry failed: bulk error', data.error);
        setRowStatusById((prev) => {
          const next = { ...prev };
          failedRowIds.forEach((id) => {
            next[id] = 'error';
          });
          return next;
        });
        setRowErrorById((prev) => {
          const next = { ...prev };
          failedRowIds.forEach((id) => {
            next[id] = 'Couldn’t Save — try again.';
          });
          return next;
        });
        return;
      }

      const results: Array<{ studentId: string; success: boolean; error?: string }> = data?.results || [];
      const successIds = new Set<string>();
      const failedResults = results.filter((result) => !result.success);

      setRowStatusById((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.success) {
            next[result.studentId] = 'saved';
            successIds.add(result.studentId);
          } else {
            next[result.studentId] = 'error';
          }
        });
        return next;
      });

      setRowErrorById((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.success) {
            delete next[result.studentId];
          } else {
            next[result.studentId] = 'Couldn’t Save — try again.';
          }
        });
        return next;
      });

      setPatchesByStudentId((prev) => {
        const next = { ...prev };
        successIds.forEach((id) => {
          if (next[id]) delete next[id];
        });
        return next;
      });

      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        successIds.forEach((id) => next.delete(id));
        return next;
      });

      if (failedResults.length === 0) {
        setSuccess('Retry succeeded.');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`Retry saved with ${failedResults.length} error${failedResults.length === 1 ? '' : 's'}.`);
      }
    } catch (err: any) {
      console.log('Retry failed: request exception', err?.message || err);
      setRowStatusById((prev) => {
        const next = { ...prev };
        failedRowIds.forEach((id) => {
          next[id] = 'error';
        });
        return next;
      });
      setRowErrorById((prev) => {
        const next = { ...prev };
        failedRowIds.forEach((id) => {
          next[id] = 'Couldn’t Save — try again.';
        });
        return next;
      });
    } finally {
      setIsSavingClass(false);
    }
  }, [failedRowIds, rowsByStudentId, patchesByStudentId]);

  useEffect(() => {
    if (dirtyRowIds.size === 0) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyRowIds]);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (dirtyRowIds.size === 0) return;
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const shouldLeave = window.confirm('You have unsaved changes. Leave without saving?');
      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (dirtyRowIds.size === 0) return;
      const shouldLeave = window.confirm('You have unsaved changes. Leave without saving?');
      if (!shouldLeave) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dirtyRowIds]);

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
  };

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

    const min = 'min' in range ? (range.min ?? undefined) : undefined;
    const max = 'max' in range ? ((range as StandardsRange).max ?? undefined) : undefined;

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

  const navigateTab = (tab: 'enter' | 'view' | 'class-summary') => {
    if (dirtyRowIds.size > 0 && activeTab === 'enter' && tab !== 'enter') {
      const shouldLeave = window.confirm('You have unsaved changes. Leave without saving?');
      if (!shouldLeave) return;
    }
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const viewableTests = teacherInfo
    ? tests.filter(test => test.student.currentSchool === teacherInfo.school)
    : tests;

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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1">
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
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Assessment Sections</h2>
            <span className="text-sm text-gray-500">
              {activeTab === 'enter' && '1. Enter Test Data'}
              {activeTab === 'view' && '2. View/Edit Tests'}
              {activeTab === 'class-summary' && '3. Class Summary'}
            </span>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-1 inline-flex gap-2 flex-wrap">
            <button
              onClick={() => navigateTab('enter')}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'enter'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✏️ Enter Test Data
            </button>
            <button
              onClick={() => navigateTab('view')}
              className={`px-4 py-2 font-medium rounded transition ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              👁️ View/Edit Tests
            </button>
            <button
              onClick={() => navigateTab('class-summary')}
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
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-2xl font-bold mb-3">Enter FitnessGram Test Data</h2>

            {loading ? (
              <p className="text-gray-600">Loading students...</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Level *
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => {
                        setSelectedGrade(e.target.value);
                        setSelectedClassroomTeacher('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select grade level...</option>
                      {availableGrades.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Classroom Teacher *
                    </label>
                    <select
                      value={selectedClassroomTeacher}
                      onChange={(e) => setSelectedClassroomTeacher(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!selectedGrade}
                    >
                      <option value="">Select classroom teacher...</option>
                      {Array.from(
                        new Set(gradeFilteredStudents.filter((s) => s.classroomTeacher).map((s) => s.classroomTeacher))
                      ).sort().map((teacher) => (
                        <option key={teacher} value={teacher}>{teacher}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedGrade || !selectedClassroomTeacher ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Select a grade level and classroom teacher to load the class roster.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const derivedCardioTypes = new Set(
                        classroomFilteredStudents
                          .map((student) => rowsByStudentId[student.id]?.cardioTestType)
                          .filter((value): value is FormData['cardioTestType'] => Boolean(value))
                      );
                      const classCardioType = cardioAll || (derivedCardioTypes.size === 1
                        ? Array.from(derivedCardioTypes)[0]
                        : '');
                      const missingCardioStudents = classroomFilteredStudents
                        .filter((student) => {
                          const row = rowsByStudentId[student.id];
                          if (!row) return false;
                          const cardioType = row.cardioTestType || classCardioType;
                          if (cardioType !== 'PACER' && cardioType !== 'MileRun') return false;
                          return row.pacerOrMileRun === undefined || row.pacerOrMileRun === null;
                        })
                        .map((student) => `${student.firstName} ${student.lastName}`);

                      return (
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
                          <div className="flex flex-wrap items-center gap-6 text-gray-700">
                            <div>
                              <span className="font-medium text-gray-900">Total students:</span>{' '}
                              {classroomFilteredStudents.length}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">Cardio type:</span>{' '}
                              {classCardioType === 'PACER'
                                ? 'PACER'
                                : classCardioType === 'MileRun'
                                  ? 'MileRun'
                                  : 'Not set'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">Missing cardio:</span>{' '}
                              {missingCardioStudents.length}
                            </div>
                          </div>
                          {missingCardioStudents.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {missingCardioStudents.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <div className="text-xs text-gray-500 mb-1">These settings apply to the whole class.</div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                          <select
                            value={seasonAll}
                            onChange={(e) =>
                              confirmApplyToAll(
                                'testSeason',
                                e.target.value as FormData['testSeason'],
                                `Season: ${getSeasonLabel(e.target.value as FormData['testSeason'])}`,
                                setSeasonAll,
                                prevSeasonAllRef
                              )
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="" disabled>— Mixed —</option>
                            {SEASON_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cardio Test</label>
                          <select
                            value={cardioAll}
                            onChange={(e) => handleClassCardioChange(e.target.value as FormData['cardioTestType'])}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="" disabled>— Mixed —</option>
                            {CARDIO_TEST_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            PACER = laps · 1-Mile = minutes/seconds
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Test Date</label>
                          <input
                            type="date"
                            value={dateAll}
                            onChange={(e) =>
                              confirmApplyToAll(
                                'testDate',
                                e.target.value,
                                `Test Date: ${e.target.value || 'blank'}`,
                                setDateAll,
                                prevDateAllRef
                              )
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="overflow-auto border border-gray-200 rounded-lg"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                    >
                      <table className="min-w-full divide-y divide-gray-200 text-sm fitnessgram-entry-table fitnessgram-entry-table-compact">
                        <thead className="bg-gray-100 text-gray-700 sticky top-0 z-20">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Student</th>
                            <th className="px-3 py-2 text-left font-semibold">Test Date</th>
                            <th className="px-3 py-2 text-left font-semibold">Season</th>
                            <th className="px-3 py-2 text-left font-semibold">Cardio Test</th>
                            <th className="px-3 py-2 text-left font-semibold">PACER / 1-Mile</th>
                            <th className="px-3 py-2 text-left font-semibold">Push-ups</th>
                            <th className="px-3 py-2 text-left font-semibold">Sit-ups</th>
                            <th className="px-3 py-2 text-left font-semibold">Sit & Reach</th>
                            <th className="px-3 py-2 text-left font-semibold">Trunk Lift</th>
                            <th className="px-3 py-2 text-left font-semibold">Shoulder R</th>
                            <th className="px-3 py-2 text-left font-semibold">Shoulder L</th>
                            <th className="px-3 py-2 text-left font-semibold">Height</th>
                            <th className="px-3 py-2 text-left font-semibold">Weight</th>
                            <th className="px-3 py-2 text-left font-semibold">BMI</th>
                            <th className="px-3 py-2 text-left font-semibold">Notes</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {classroomFilteredStudents.map((student) => {
                            const row = rowsByStudentId[student.id];
                            const status = rowStatusById[student.id];
                            const hasRowError = Boolean(rowErrorById[student.id]);
                            const rowValidationErrors = validationErrorsById[student.id] || [];
                            const hasValidationError = rowValidationErrors.length > 0;
                            if (!row) return null;

                            const statusColor = rowValidationErrors.length > 0 || status === 'error'
                              ? 'text-red-600'
                              : status === 'saving'
                                ? 'text-amber-600'
                                : status === 'dirty'
                                  ? 'text-blue-600'
                                  : status === 'saved'
                                    ? 'text-green-600'
                                    : 'text-gray-500';

                            const mileParts = getMileParts(row.pacerOrMileRun);
                            const mileMinutes: number | '' = mileParts.minutes;
                            const mileSeconds: number | '' = mileParts.seconds;
                            const mileValidation = row.cardioTestType === 'MileRun'
                              ? validateMileTime(
                                mileMinutes === '' ? undefined : mileMinutes,
                                mileSeconds === '' ? undefined : mileSeconds
                              )
                              : { valid: true };
                            const pacerValidation = row.cardioTestType === 'PACER'
                              ? validateNumber('pacerLaps', row.pacerOrMileRun)
                              : { valid: true };
                            const curlUpValidation = validateNumber('curlUps', row.situps);
                            const trunkLiftValidation = validateNumber('trunkLift', row.trunkLift);

                            const effectiveTestDate = row.testDate || dateAll;
                            const rawAge =
                              effectiveTestDate && student.dateOfBirth
                                ? computeAgeOnTestDate(new Date(student.dateOfBirth), new Date(effectiveTestDate))
                                : null;
                            const age = rawAge !== null && Number.isFinite(rawAge) ? rawAge : null;
                            const thresholds = age !== null ? getHfzThresholds(student.sex, age) : null;
                            const sexLabel = thresholds ? getSexLabel(student.sex) : null;

                            const pacerStatus =
                              row.cardioTestType === 'PACER' && typeof row.pacerOrMileRun === 'number' && age !== null
                                ? isHFZ('PACER', row.pacerOrMileRun, { sex: student.sex, age })
                                : null;
                            const mileStatus =
                              row.cardioTestType === 'MileRun' && typeof row.pacerOrMileRun === 'number' && age !== null
                                ? isHFZ('MILE', row.pacerOrMileRun, { sex: student.sex, age })
                                : null;
                            const cardioStatus = row.cardioTestType === 'PACER' ? pacerStatus : mileStatus;
                            const cardioTitle = row.cardioTestType === 'PACER'
                              ? (thresholds?.pacer20mMin !== null && thresholds?.pacer20mMin !== undefined && sexLabel && age !== null
                                  ? `HFZ ${sexLabel} ${age}: min ${thresholds.pacer20mMin}`
                                  : undefined)
                              : (thresholds?.mileSlowTimeSeconds !== null && thresholds?.mileSlowTimeSeconds !== undefined && sexLabel && age !== null
                                  ? `HFZ ${sexLabel} ${age}: max ${formatSecondsAsTime(thresholds.mileSlowTimeSeconds)}`
                                  : undefined);

                            const pushupStatus =
                              typeof row.pushups === 'number' && age !== null
                                ? isHFZ('PUSHUP', row.pushups, { sex: student.sex, age })
                                : null;
                            const pushupTitle =
                              thresholds?.pushUpMin !== undefined && sexLabel && age !== null
                                ? `HFZ ${sexLabel} ${age}: min ${thresholds.pushUpMin}`
                                : undefined;

                            const curlupStatus =
                              typeof row.situps === 'number' && age !== null
                                ? isHFZ('CURLUP', row.situps, { sex: student.sex, age })
                                : null;
                            const curlupTitle =
                              thresholds?.curlUpMin !== undefined && sexLabel && age !== null
                                ? `HFZ ${sexLabel} ${age}: min ${thresholds.curlUpMin}`
                                : undefined;

                            const sitReachStatus =
                              typeof row.sitAndReach === 'number' && age !== null
                                ? isHFZ('SITREACH', row.sitAndReach, { sex: student.sex, age })
                                : null;
                            const sitReachTitle =
                              thresholds?.sitReachMin !== undefined && sexLabel && age !== null
                                ? `HFZ ${sexLabel} ${age}: min ${thresholds.sitReachMin}`
                                : undefined;

                            const trunkStatus =
                              typeof row.trunkLift === 'number' && age !== null
                                ? isHFZ('TRUNK', row.trunkLift, { sex: student.sex, age })
                                : null;
                            const trunkTitle =
                              thresholds?.trunkLiftMin !== undefined && sexLabel && age !== null
                                ? `HFZ ${sexLabel} ${age}: min ${thresholds.trunkLiftMin}`
                                : undefined;

                            const shoulderStatus =
                              age !== null
                                ? isHFZ('SHOULDER', undefined, {
                                    sex: student.sex,
                                    age,
                                    shoulderLeft: row.shoulderStretchLeft,
                                    shoulderRight: row.shoulderStretchRight,
                                  })
                                : null;
                            const shoulderTitle =
                              sexLabel && age !== null
                                ? `HFZ ${sexLabel} ${age}: both shoulders`
                                : undefined;

                            const bmiValue = calculateBMI_US(row.height, row.weight);
                            const bmiDisplay = typeof bmiValue === 'number' ? bmiValue.toFixed(1) : '';
                            const bmiRange = age !== null ? getBmiHfzRange(student.sex, age) : null;
                            const bmiRangeLabel = bmiRange ? formatBmiRangeLabel(bmiRange) : null;
                            const bmiStatus =
                              typeof bmiValue === 'number' && age !== null
                                ? isHFZ('BMI', bmiValue, { sex: student.sex, age })
                                : null;
                            const bmiTitle = bmiRangeLabel || undefined;

                            return (
                              <tr
                                key={student.id}
                                className={`bg-white ${hasValidationError ? 'bg-red-50' : ''}`}
                              >
                                <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                  {student.firstName} {student.lastName}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="date"
                                    value={row.testDate}
                                    onChange={(e) => handleRowChange(student.id, 'testDate', e.target.value)}
                                    className="w-36 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={row.testSeason}
                                    onChange={(e) => handleRowChange(student.id, 'testSeason', e.target.value as FormData['testSeason'])}
                                    className="w-28 px-2 py-1 border border-gray-300 rounded"
                                  >
                                    {SEASON_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={row.cardioTestType}
                                    onChange={(e) => {
                                      const nextType = e.target.value as FormData['cardioTestType'];
                                      handleRowPatch(student.id, {
                                        cardioTestType: nextType,
                                        pacerOrMileRun: undefined,
                                      });
                                    }}
                                    className="w-32 px-2 py-1 border border-gray-300 rounded"
                                  >
                                    {CARDIO_TEST_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  {row.cardioTestType === 'MileRun' ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min={0}
                                          placeholder="Min"
                                          value={mileMinutes}
                                          onFocus={selectAllOnFocus}
                                          onMouseDown={preventMouseDownDeselect}
                                          onChange={(e) => {
                                            const minutes: number | '' = e.target.value === '' ? '' : Number(e.target.value);
                                            handleMileTimeChange(student.id, minutes, mileSeconds);
                                          }}
                                          className={`w-16 px-2 py-1 border rounded ${
                                            mileValidation.valid ? 'border-gray-300' : 'border-red-500 bg-red-50'
                                          }`}
                                        />
                                        <span className="text-xs text-gray-500">:</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={59}
                                          placeholder="Sec"
                                          value={mileSeconds}
                                          onFocus={selectAllOnFocus}
                                          onMouseDown={preventMouseDownDeselect}
                                          onChange={(e) => {
                                            const seconds: number | '' = e.target.value === '' ? '' : Number(e.target.value);
                                            handleMileTimeChange(student.id, mileMinutes, seconds);
                                          }}
                                          className={`w-16 px-2 py-1 border rounded ${
                                            mileValidation.valid ? 'border-gray-300' : 'border-red-500 bg-red-50'
                                          }`}
                                        />
                                      </div>
                                      {renderHfzIndicator(cardioStatus, cardioTitle)}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="number"
                                        value={row.pacerOrMileRun ?? ''}
                                        onFocus={selectAllOnFocus}
                                        onMouseDown={preventMouseDownDeselect}
                                        onChange={(e) => {
                                          const value = normalizeNumberInput(e.target.value);
                                          handleRowChange(
                                            student.id,
                                            'pacerOrMileRun',
                                            value === undefined ? undefined : Math.round(value)
                                          );
                                        }}
                                        className={`w-24 px-2 py-1 border rounded ${
                                          pacerValidation.valid ? 'border-gray-300' : 'border-red-500 bg-red-50'
                                        }`}
                                      />
                                      {renderHfzIndicator(cardioStatus, cardioTitle)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.pushups ?? ''}
                                      onFocus={selectAllOnFocus}
                                      onMouseDown={preventMouseDownDeselect}
                                      onChange={(e) => handleRowChange(student.id, 'pushups', normalizeNumberInput(e.target.value))}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                                    />
                                    {renderHfzIndicator(pushupStatus, pushupTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.situps ?? ''}
                                      onFocus={selectAllOnFocus}
                                      onMouseDown={preventMouseDownDeselect}
                                      onChange={(e) => handleRowChange(student.id, 'situps', normalizeNumberInput(e.target.value))}
                                      className={`w-20 px-2 py-1 border rounded ${
                                        curlUpValidation.valid ? 'border-gray-300' : 'border-red-500 bg-red-50'
                                      }`}
                                    />
                                    {renderHfzIndicator(curlupStatus, curlupTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.sitAndReach ?? ''}
                                      onFocus={selectAllOnFocus}
                                      onMouseDown={preventMouseDownDeselect}
                                      onChange={(e) => handleRowChange(student.id, 'sitAndReach', normalizeNumberInput(e.target.value))}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                                    />
                                    {renderHfzIndicator(sitReachStatus, sitReachTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.trunkLift ?? ''}
                                      onFocus={selectAllOnFocus}
                                      onMouseDown={preventMouseDownDeselect}
                                      onChange={(e) => handleRowChange(student.id, 'trunkLift', normalizeNumberInput(e.target.value))}
                                      className={`w-20 px-2 py-1 border rounded ${
                                        trunkLiftValidation.valid ? 'border-gray-300' : 'border-red-500 bg-red-50'
                                      }`}
                                    />
                                    {renderHfzIndicator(trunkStatus, trunkTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={row.shoulderStretchRight || false}
                                      onChange={(e) => handleRowChange(student.id, 'shoulderStretchRight', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {renderHfzIndicator(shoulderStatus, shoulderTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={row.shoulderStretchLeft || false}
                                      onChange={(e) => handleRowChange(student.id, 'shoulderStretchLeft', e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {renderHfzIndicator(shoulderStatus, shoulderTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={row.height ?? ''}
                                    onFocus={selectAllOnFocus}
                                    onMouseDown={preventMouseDownDeselect}
                                    onChange={(e) => handleRowChange(student.id, 'height', normalizeNumberInput(e.target.value))}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={row.weight ?? ''}
                                    onFocus={selectAllOnFocus}
                                    onMouseDown={preventMouseDownDeselect}
                                    onChange={(e) => handleRowChange(student.id, 'weight', normalizeNumberInput(e.target.value))}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-900">{bmiDisplay}</span>
                                    {renderHfzIndicator(bmiStatus, bmiTitle)}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={row.notes ?? ''}
                                    onChange={(e) => handleRowChange(student.id, 'notes', e.target.value)}
                                    className="w-40 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className={`text-xs font-medium ${statusColor}`}>
                                    {rowValidationErrors.length > 0
                                      ? 'Fix Needed'
                                      : status === 'saving'
                                        ? 'Saving…'
                                        : status === 'error'
                                          ? 'Couldn’t Save'
                                          : status === 'dirty'
                                            ? 'Not Saved Yet'
                                            : status === 'saved'
                                              ? 'Saved'
                                                  : status === 'idle'
                                                    ? 'Ready'
                                                    : ''}
                                  </div>
                                  {rowValidationErrors.length > 0 && (
                                    <ul className="text-xs text-red-600 mt-1 space-y-1">
                                      {rowValidationErrors.map((message) => (
                                        <li key={message}>{message}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {(status === 'error' || hasRowError) && (
                                    <div className="text-xs text-red-600 mt-1">
                                      Couldn’t Save — click Save Class and try again.
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow">
                      <div className="text-sm text-gray-600">
                        Unsaved changes: <span className="font-semibold text-gray-900">{dirtyRowIds.size}</span>
                        {hasValidationErrors && (
                          <span className="ml-3 text-red-600">
                            Fix highlighted values before saving. ({invalidRowIds.length})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {failedCount > 0 && (
                          <button
                            type="button"
                            onClick={retryFailed}
                            disabled={isSavingClass}
                            className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded"
                          >
                            Retry Failed ({failedCount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={saveClass}
                          disabled={dirtyRowIds.size === 0 || isSavingClass || hasValidationErrors}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded"
                        >
                          {isSavingClass ? 'Saving Class…' : 'Save Class'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigateTab('view')}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
                  >
                    View/Edit Tests →
                  </button>
                </div>
              </div>
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
                              <td className="px-4 py-2">
                                  {test.cardioTestType === 'MileRun'
                                  ? formatMileTime(test.pacerOrMileRun ?? undefined)
                                  : test.pacerOrMileRun ?? '-'}
                              </td>
                              <td className="px-4 py-2">{test.height || '-'} in</td>
                              <td className="px-4 py-2">{test.weight || '-'} lbs</td>
                              <td className="px-4 py-2">{test.bmi ? test.bmi.toFixed(1) : '-'}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setSelectedGrade(String(test.student.currentGrade));
                                      setSelectedClassroomTeacher(test.student.classroomTeacher || '');
                                      navigateTab('enter');
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
                                      <p className="font-medium text-gray-900">
                                        {test.cardioTestType === 'MileRun'
                                          ? formatMileTime(test.pacerOrMileRun ?? undefined)
                                          : test.pacerOrMileRun ?? '-'}
                                      </p>
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
