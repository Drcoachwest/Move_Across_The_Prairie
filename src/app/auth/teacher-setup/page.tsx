'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'schoolLevel' | 'elementary' | 'secondary'>('schoolLevel');
  const [schoolLevel, setSchoolLevel] = useState<'ELEMENTARY' | 'SECONDARY' | ''>('');
  const [grade, setGrade] = useState('');
  const [department, setDepartment] = useState('');
  const [periods, setPeriods] = useState<number[]>([1, 2, 3]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already setup
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (response.ok) {
          const data = await response.json();
          if (data.teacher && data.teacher.schoolLevel) {
            // Already setup, redirect to dashboard
            router.push('/teacher/dashboard');
          }
        }
      } catch (err) {
        console.error('Setup check failed:', err);
      }
    };

    checkSetup();
  }, [router]);

  const handleSchoolLevelSelect = (level: 'ELEMENTARY' | 'SECONDARY') => {
    setSchoolLevel(level);
    if (level === 'ELEMENTARY') {
      setStep('elementary');
    } else {
      setStep('secondary');
    }
  };

  const handleElementarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) {
      setError('Please select a grade level');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/teacher-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: 'ELEMENTARY',
          grade: Number(grade),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Setup failed');
      }

      // Redirect to dashboard
      router.push('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSecondarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
      setError('Please select a department');
      return;
    }
    if (periods.length === 0) {
      setError('Please select at least one class period');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/teacher-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolLevel: 'SECONDARY',
          department,
          periods,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Setup failed');
      }

      // Redirect to dashboard
      router.push('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const togglePeriod = (periodNum: number) => {
    setPeriods(prev =>
      prev.includes(periodNum)
        ? prev.filter(p => p !== periodNum)
        : [...prev, periodNum].sort((a, b) => a - b)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FitnessGram</h1>
        <p className="text-gray-600 mb-8">Let&apos;s set up your teacher profile</p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Step 1: School Level Selection */}
        {step === 'schoolLevel' && (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-900 mb-6">What school level do you teach?</p>
            <button
              onClick={() => handleSchoolLevelSelect('ELEMENTARY')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="font-bold text-lg text-gray-900">Elementary School</div>
              <div className="text-sm text-gray-600 mt-2">Grades K-5 with classroom teachers</div>
            </button>
            <button
              onClick={() => handleSchoolLevelSelect('SECONDARY')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="font-bold text-lg text-gray-900">Secondary School</div>
              <div className="text-sm text-gray-600 mt-2">Grades 6-12 with class periods</div>
            </button>
          </div>
        )}

        {/* Step 2: Elementary Setup */}
        {step === 'elementary' && (
          <form onSubmit={handleElementarySubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('schoolLevel')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
            >
              ← Back
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What grade do you teach?
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a grade</option>
                <option value="3">3rd Grade</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        )}

        {/* Step 3: Secondary Setup */}
        {step === 'secondary' && (
          <form onSubmit={handleSecondarySubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('schoolLevel')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
            >
              ← Back
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What department do you teach?
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a department</option>
                <option value="PE">Physical Education</option>
                <option value="Math">Mathematics</option>
                <option value="English">English/Language Arts</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Arts">Arts</option>
                <option value="Music">Music</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your class periods:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((periodNum) => (
                  <button
                    key={periodNum}
                    type="button"
                    onClick={() => togglePeriod(periodNum)}
                    className={`p-3 rounded-lg font-semibold transition ${
                      periods.includes(periodNum)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {periodNum}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Selected: {periods.length > 0 ? periods.join(', ') : 'None'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
