'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import standards from '@/lib/fitnessgram-standards.json';
import { calculateBMI_US } from '@/lib/fitnessgram/bmi';
import { computeAgeOnTestDate, getBmiHfzRange, getHFZResults, getHfzThresholds, isHFZ } from '@/lib/fitnessgram/hfz';
import HFZRuleInfo from '@/components/fitnessgram/HFZRuleInfo';
import { FITNESSGRAM_LABELS } from '@/lib/fitnessgram/labels';
import { normalizeNumberInput } from '@/lib/fitnessgram/validation';
import {
  CARDIO_TEST_OPTIONS,
  CARDIO_TEST_TYPE,
  SEASON_OPTIONS,
  TEST_SEASON,
  type CardioTestType,
  type Sex,
  type TestSeason,
} from '@/lib/fitnessgram/constants';

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

interface FormData {
  studentId: string;
  testDate: string;
  testSeason: TestSeason;
  cardioTestType: CardioTestType;
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

type RowStatus = 'saved' | 'dirty' | 'saving' | 'error';

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

export default function SecondaryAssessmentPage() {
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
  const router = useRouter();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'enter' | 'view' | 'class-summary'>('enter');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [viewTestsPeriod, setViewTestsPeriod] = useState<string>('');
  const [viewTestsSeason, setViewTestsSeason] = useState<TestSeason | ''>('');
  const [rowsByStudentId, setRowsByStudentId] = useState<Record<string, RowData>>({});
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [patchesByStudentId, setPatchesByStudentId] = useState<Record<string, Partial<RowData>>>({});
  const [rowStatusById, setRowStatusById] = useState<Record<string, RowStatus>>({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [seasonAll, setSeasonAll] = useState<TestSeason | ''>('');
  const [cardioAll, setCardioAll] = useState<CardioTestType | ''>('');
  const [dateAll, setDateAll] = useState<string>('');
  const prevSeasonAllRef = useRef<TestSeason | ''>('');
  const prevCardioAllRef = useRef<CardioTestType | ''>('');
  const prevDateAllRef = useRef<string>('');

  const failedRowIds = useMemo(
    () => Object.keys(rowStatusById).filter((id) => rowStatusById[id] === 'error'),
    [rowStatusById]
  );
  const failedCount = failedRowIds.length;

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
            router.push('/teacher/assessment');
          } else {
            // No teacher in session, redirect to login
            router.push('/auth/teacher-signin');
          }
        } else {
          // Not authenticated, redirect to login
          router.push('/auth/teacher-signin');
        }
      } catch (err) {
        console.error('Failed to get teacher info:', err);
        router.push('/auth/teacher-signin');
      }
    };
    getTeacherInfo();
  }, [router]);

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

  // Load periods and tests on mount
  useEffect(() => {
    if (teacherInfo) {
      loadClassPeriods();
    }
  }, [teacherInfo, loadClassPeriods]);

  // Load students when period changes
  useEffect(() => {
    if (selectedPeriod && teacherInfo) {
      loadStudentsForPeriod(selectedPeriod);
      loadTests(selectedPeriod);
    }
  }, [selectedPeriod, teacherInfo]);

  useEffect(() => {
    if (!selectedPeriod || students.length === 0) {
      setRowsByStudentId({});
      setPatchesByStudentId({});
      setRowStatusById({});
      setRowErrorById({});
      setDirtyRowIds(new Set());
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const testsByStudent = new Map(tests.map((test) => [test.studentId, test]));
    const nextRows: Record<string, RowData> = {};
    const nextStatuses: Record<string, RowStatus> = {};

    students.forEach((student) => {
      const existing = testsByStudent.get(student.id);
      const testDate = existing?.testDate
        ? new Date(existing.testDate).toISOString().split('T')[0]
        : today;
      nextRows[student.id] = {
        studentId: student.id,
        testDate,
        testSeason: (existing?.testSeason as TestSeason) || TEST_SEASON.Fall,
        cardioTestType: (existing?.cardioTestType as CardioTestType) || CARDIO_TEST_TYPE.PACER,
        pacerOrMileRun: existing?.pacerOrMileRun ?? undefined,
        pushups: existing?.pushups ?? undefined,
        situps: existing?.situps ?? undefined,
        sitAndReach: existing?.sitAndReach ?? undefined,
        shoulderStretchRight: existing?.shoulderStretchRight ?? undefined,
        shoulderStretchLeft: existing?.shoulderStretchLeft ?? undefined,
        height: existing?.height ?? undefined,
        weight: existing?.weight ?? undefined,
        trunkLift: existing?.trunkLift ?? undefined,
        notes: existing?.notes ?? undefined,
      };
      nextStatuses[student.id] = 'saved';
    });

    setRowsByStudentId(nextRows);
    setPatchesByStudentId({});
    setRowStatusById(nextStatuses);
    setRowErrorById({});
    setDirtyRowIds(new Set());
  }, [selectedPeriod, students, tests]);

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

  const deriveTestYear = (testDate?: string) => {
    if (testDate) {
      const parsed = new Date(testDate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.getFullYear();
      }
    }
    return new Date().getFullYear();
  };


  const handleRowChange = (
    studentId: string,
    field: keyof RowData,
    value: string | boolean | number | undefined
  ) => {
    setRowsByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));

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

  const applyToAllRows = useCallback(
    (field: keyof RowData, value: string | boolean | number | undefined) => {
      const studentIds = Object.keys(rowsByStudentId);
      if (studentIds.length === 0) return;

      setRowsByStudentId((prev) => {
        const next: Record<string, RowData> = {};
        studentIds.forEach((id) => {
          next[id] = {
            ...prev[id],
            [field]: value,
          };
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

  const saveClass = useCallback(async () => {
    const dirtyIds = Array.from(dirtyRowIds);
    if (dirtyIds.length === 0) return;

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

      results.forEach((result) => {
        if (!result.success) {
          console.log('Save failed for student', result.studentId, result.error);
          setRowStatusById((prev) => ({ ...prev, [result.studentId]: 'error' }));
          setRowErrorById((prev) => ({
            ...prev,
            [result.studentId]: 'error',
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
          next[id] = 'error';
        });
        return next;
      });
    } finally {
      setIsSavingClass(false);
    }
  }, [dirtyRowIds, rowsByStudentId, patchesByStudentId]);

  const retryFailed = useCallback(async () => {
    if (failedRowIds.length === 0) return;

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
            console.log('Retry failed for student', result.studentId, result.error);
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

  const confirmNavigateIfDirty = (event: React.MouseEvent) => {
    if (dirtyRowIds.size === 0) {
      router.push('/teacher/dashboard');
      return;
    }
    const shouldLeave = window.confirm('You have unsaved changes. Leave without saving?');
    if (!shouldLeave) {
      event.preventDefault();
      return;
    }
    router.push('/teacher/dashboard');
  };

  const getStatusLabel = (status: 'HFZ' | 'NI' | 'NA') => {
    if (status === 'HFZ') return 'HFZ';
    if (status === 'NI') return 'Needs Improvement';
    return 'No Data';
  };

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
    const seasonValue = getUniformRowValue('testSeason') as TestSeason | '';
    const cardioValue = getUniformRowValue('cardioTestType') as CardioTestType | '';
    const dateValue = (getUniformRowValue('testDate') as string) || '';

    setSeasonAll(seasonValue);
    setCardioAll(cardioValue);
    setDateAll(dateValue);
    prevSeasonAllRef.current = seasonValue;
    prevCardioAllRef.current = cardioValue;
    prevDateAllRef.current = dateValue;
  }, [rowsByStudentId, getUniformRowValue]);

  const getSeasonLabel = (value: TestSeason) => {
    return SEASON_OPTIONS.find((option) => option.value === value)?.label || value;
  };

  const confirmApplyToAll = (
    field: keyof RowData,
    nextValue: string | boolean | number | undefined,
    displayValue: string,
    setValue: (value: any) => void,
    prevRef: React.MutableRefObject<any>
  ) => {
    if (students.length === 0) return false;
    const count = students.length;
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

  const handleClassCardioChange = (nextValue: CardioTestType) => {
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
      <div className="max-w-screen-2xl mx-auto pt-2 pb-1 px-4">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Assessment Manager</h1>
          <p className="text-gray-600">{teacherInfo.name} - {teacherInfo.department || 'Department'}</p>
          <p className="text-gray-600">{teacherInfo.school}</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* THREE TABS */}
        <div className="mb-2 flex gap-4 border-b border-gray-200">
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
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{FITNESSGRAM_LABELS.assessmentEntryTitle}</h2>

            {/* Period Selection */}
            <div className="mb-2">
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
              <div className="space-y-4">
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
                            e.target.value as TestSeason,
                            `Season: ${getSeasonLabel(e.target.value as TestSeason)}`,
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
                        onChange={(e) => handleClassCardioChange(e.target.value as CardioTestType)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>— Mixed —</option>
                        {CARDIO_TEST_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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

                {(() => {
                  const derivedCardioTypes = new Set(
                    students
                      .map((student) => rowsByStudentId[student.id]?.cardioTestType)
                      .filter((value): value is CardioTestType => Boolean(value))
                  );
                  const classCardioType = cardioAll || (derivedCardioTypes.size === 1
                    ? Array.from(derivedCardioTypes)[0]
                    : '');
                  const missingCardioStudents = students
                    .filter((student) => {
                      const row = rowsByStudentId[student.id];
                      if (!row) return false;
                      const cardioType = row.cardioTestType || classCardioType;
                      if (cardioType !== 'PACER' && cardioType !== 'MileRun') return false;
                      return row.pacerOrMileRun === undefined || row.pacerOrMileRun === null;
                    })
                    .map((student) => `${student.firstName} ${student.lastName}`);

                  return (
                    <div className="mb-2 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                      <div className="flex flex-wrap items-center gap-6 text-gray-700">
                        <div>
                          <span className="font-medium text-gray-900">Total students:</span>{' '}
                          {students.length}
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
                        <th className="px-3 py-2 text-left font-semibold">PACER/Mile</th>
                        <th className="px-3 py-2 text-left font-semibold">Push-ups</th>
                        <th className="px-3 py-2 text-left font-semibold">Sit-ups</th>
                        <th className="px-3 py-2 text-left font-semibold">Sit & Reach (cm)</th>
                        <th className="px-3 py-2 text-left font-semibold">Trunk Lift (in)</th>
                        <th className="px-3 py-2 text-left font-semibold">Shoulder R</th>
                        <th className="px-3 py-2 text-left font-semibold">Shoulder L</th>
                        <th className="px-3 py-2 text-left font-semibold">Height (in)</th>
                        <th className="px-3 py-2 text-left font-semibold">Weight (lb)</th>
                        <th className="px-3 py-2 text-left font-semibold">BMI</th>
                        <th className="px-3 py-2 text-left font-semibold">Notes</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => {
                        const row = rowsByStudentId[student.id];
                        const status = rowStatusById[student.id];
                        const hasRowError = Boolean(rowErrorById[student.id]);
                        if (!row) return null;

                        const statusColor = status === 'error'
                          ? 'text-red-600'
                          : status === 'saving'
                            ? 'text-amber-600'
                            : status === 'dirty'
                              ? 'text-blue-600'
                              : 'text-green-600';

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
                          <tr key={student.id} className="bg-white">
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
                                onChange={(e) => handleRowChange(student.id, 'testSeason', e.target.value as TestSeason)}
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
                                onChange={(e) => handleRowChange(student.id, 'cardioTestType', e.target.value as CardioTestType)}
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
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  value={row.pacerOrMileRun ?? ''}
                                  onChange={(e) =>
                                    handleRowChange(
                                      student.id,
                                      'pacerOrMileRun',
                                      normalizeNumberInput(e.target.value)
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                                />
                                {renderHfzIndicator(cardioStatus, cardioTitle)}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  value={row.pushups ?? ''}
                                  onChange={(e) =>
                                    handleRowChange(
                                      student.id,
                                      'pushups',
                                      normalizeNumberInput(e.target.value)
                                    )
                                  }
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
                                  onChange={(e) =>
                                    handleRowChange(
                                      student.id,
                                      'situps',
                                      normalizeNumberInput(e.target.value)
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                />
                                {renderHfzIndicator(curlupStatus, curlupTitle)}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  value={row.sitAndReach ?? ''}
                                  onChange={(e) =>
                                    handleRowChange(
                                      student.id,
                                      'sitAndReach',
                                      normalizeNumberInput(e.target.value)
                                    )
                                  }
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
                                  onChange={(e) =>
                                    handleRowChange(
                                      student.id,
                                      'trunkLift',
                                      normalizeNumberInput(e.target.value)
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                />
                                {renderHfzIndicator(trunkStatus, trunkTitle)}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={row.shoulderStretchRight || false}
                                  onChange={(e) =>
                                    handleRowChange(student.id, 'shoulderStretchRight', e.target.checked)
                                  }
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
                                  onChange={(e) =>
                                    handleRowChange(student.id, 'shoulderStretchLeft', e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                {renderHfzIndicator(shoulderStatus, shoulderTitle)}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.height ?? ''}
                                onChange={(e) =>
                                  handleRowChange(
                                    student.id,
                                    'height',
                                    normalizeNumberInput(e.target.value)
                                  )
                                }
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.weight ?? ''}
                                onChange={(e) =>
                                  handleRowChange(
                                    student.id,
                                    'weight',
                                    normalizeNumberInput(e.target.value)
                                  )
                                }
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
                                {status === 'saving'
                                  ? 'Saving…'
                                  : status === 'error'
                                    ? 'Couldn’t Save'
                                    : status === 'dirty'
                                      ? 'Not Saved Yet'
                                      : status === 'saved'
                                        ? 'Saved'
                                        : ''}
                              </div>
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
                      disabled={dirtyRowIds.size === 0 || isSavingClass}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded"
                    >
                      {isSavingClass ? 'Saving Class…' : 'Save Class'}
                    </button>
                  </div>
                </div>
              </div>
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
                    onChange={(e) => setViewTestsSeason(e.target.value as TestSeason | '')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- All Seasons --</option>
                  {SEASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTests.length === 0 ? (
                <p className="text-gray-600">No tests found</p>
              ) : (
                filteredTests.map(test => {
                  const student = students.find(s => s.id === test.studentId);
                  const hfzOverall = student
                    ? getHFZResults({
                        student,
                        test: {
                          testDate: test.testDate,
                          cardioTestType: test.cardioTestType,
                          pacerOrMileRun: test.pacerOrMileRun,
                          pushups: test.pushups,
                          situps: test.situps,
                          sitAndReach: test.sitAndReach,
                          trunkLift: test.trunkLift,
                          height: test.height,
                          weight: test.weight,
                        },
                        standards: standards as StandardsData,
                      }).overall
                    : 'NA';

                  return (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {test.student.firstName} {test.student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {test.testSeason} {new Date(test.testDate).getFullYear()} - {new Date(test.testDate).toLocaleDateString()}
                        </p>
                        <div className="text-sm text-gray-600">
                          <p>
                            Status: {getStatusLabel(hfzOverall)}
                          </p>
                          <HFZRuleInfo />
                        </div>
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
                          <p className="text-sm font-medium text-gray-700">Sit and Reach (cm): <span className="font-normal">{test.sitAndReach}</span></p>
                          <p className="text-sm font-medium text-gray-700">Trunk Lift (in): <span className="font-normal">{test.trunkLift}</span></p>
                          <p className="text-sm font-medium text-gray-700">BMI: <span className="font-normal">{test.bmi?.toFixed(1)}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                );
                })
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
          <button
            onClick={confirmNavigateIfDirty}
            className="text-blue-600 hover:text-blue-900 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
