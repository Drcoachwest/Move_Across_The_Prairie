export const SEX = {
  M: 'M',
  F: 'F',
} as const;

export const TEST_SEASON = {
  Fall: 'Fall',
  Spring: 'Spring',
} as const;

export const CARDIO_TEST_TYPE = {
  PACER: 'PACER',
  MileRun: 'MileRun',
} as const;

export type Sex = (typeof SEX)[keyof typeof SEX];
export type TestSeason = (typeof TEST_SEASON)[keyof typeof TEST_SEASON];
export type CardioTestType = (typeof CARDIO_TEST_TYPE)[keyof typeof CARDIO_TEST_TYPE];

export const SEX_OPTIONS = [
  { value: SEX.M, label: 'M' },
  { value: SEX.F, label: 'F' },
] as const;

export const SEASON_OPTIONS = [
  { value: TEST_SEASON.Fall, label: 'Fall' },
  { value: TEST_SEASON.Spring, label: 'Spring' },
] as const;

export const CARDIO_TEST_OPTIONS = [
  { value: CARDIO_TEST_TYPE.PACER, label: 'PACER (laps)' },
  { value: CARDIO_TEST_TYPE.MileRun, label: 'Mile Run (time)' },
] as const;

const sexValues = new Set<string>(SEX_OPTIONS.map((option) => option.value));
const seasonValues = new Set<string>(SEASON_OPTIONS.map((option) => option.value));
const cardioValues = new Set<string>(CARDIO_TEST_OPTIONS.map((option) => option.value));

export const isSex = (value: string): value is Sex => sexValues.has(value);
export const isTestSeason = (value: string): value is TestSeason => seasonValues.has(value);
export const isCardioTestType = (value: string): value is CardioTestType => cardioValues.has(value);
