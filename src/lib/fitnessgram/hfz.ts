import { calculateBMI_US } from "@/lib/fitnessgram/bmi";
import {
  CARDIO_TEST_TYPE,
  isCardioTestType,
  isSex,
  type CardioTestType,
  type Sex,
} from "@/lib/fitnessgram/constants";

export type HFZStatus = "HFZ" | "NI" | "NA";
export type HFZResult = {
  overall: HFZStatus;
  components: Record<string, HFZStatus>;
};

type StandardsRange = { min?: number | null; max?: number | null };

type StandardsData = {
  boys: {
    cardio: Record<string, { pacer20?: StandardsRange; oneMilleRun?: StandardsRange; bmi?: StandardsRange }>;
    muscular: Record<
      string,
      {
        curlup?: StandardsRange;
        trunkLift?: StandardsRange;
        pushup90?: StandardsRange;
        sitAndReach?: { min?: number | null };
      }
    >;
  };
  girls: {
    cardio: Record<string, { pacer20?: StandardsRange; oneMilleRun?: StandardsRange; bmi?: StandardsRange }>;
    muscular: Record<
      string,
      {
        curlup?: StandardsRange;
        trunkLift?: StandardsRange;
        pushup90?: StandardsRange;
        sitAndReach?: { min?: number | null };
      }
    >;
  };
};

export const BMI_HFZ_RANGE: {
  boys: Record<number | '17+', { min: number; max: number }>;
  girls: Record<number | '17+', { min: number; max: number }>;
} = {
  boys: {
    10: { min: 14.0, max: 21.0 },
    11: { min: 14.3, max: 21.0 },
    12: { min: 14.6, max: 22.0 },
    13: { min: 15.1, max: 23.0 },
    14: { min: 15.6, max: 24.5 },
    15: { min: 16.2, max: 25.0 },
    16: { min: 16.6, max: 26.5 },
    17: { min: 17.3, max: 27.0 },
    '17+': { min: 17.8, max: 27.8 },
  },
  girls: {
    10: { min: 13.7, max: 23.5 },
    11: { min: 14.0, max: 24.0 },
    12: { min: 14.5, max: 24.5 },
    13: { min: 14.9, max: 24.5 },
    14: { min: 15.4, max: 25.0 },
    15: { min: 16.0, max: 25.0 },
    16: { min: 16.4, max: 25.0 },
    17: { min: 16.8, max: 26.0 },
    '17+': { min: 17.2, max: 27.3 },
  },
};

// Quick-check (BMI HFZ range): Boys 13 = 15.1–23.0, Girls 13 = 14.9–24.5 (matches chart)

export function getAgeOnTestDate(
  dob: Date | string | null | undefined,
  testDate: Date | string | null | undefined
): number | null {
  if (!dob || !testDate) return null;
  const dobDate = dob instanceof Date ? dob : new Date(dob);
  const test = testDate instanceof Date ? testDate : new Date(testDate);
  if (Number.isNaN(dobDate.getTime()) || Number.isNaN(test.getTime())) return null;
  let age = test.getFullYear() - dobDate.getFullYear();
  const monthDiff = test.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < dobDate.getDate())) {
    age -= 1;
  }
  return age;
}

const getStatusFromRange = (value: number, range?: StandardsRange, isInverse = false): HFZStatus => {
  if (!range) return "NA";
  const min = range.min;
  const max = range.max;

  if (typeof min === "number" && typeof max === "number") {
    if (isInverse) {
      return value >= min && value <= max ? "HFZ" : "NI";
    }
    return value >= min && value <= max ? "HFZ" : "NI";
  }

  if (typeof max === "number" && (min === null || min === undefined)) {
    return value <= max ? "HFZ" : "NI";
  }

  if (typeof min === "number" && (max === null || max === undefined)) {
    return value >= min ? "HFZ" : "NI";
  }

  return "NA";
};

/**
 * Overall HFZ rule:
 * - If all components are NA => overall NA
 * - Otherwise, if HFZ components are a strict majority of available components => overall HFZ
 * - Else overall NI
 */
export function getHFZResults(params: {
  student: { sex: Sex | string; dateOfBirth: string | Date | null | undefined };
  test: {
    testDate?: string | Date;
    cardioTestType?: CardioTestType | string | null;
    pacerOrMileRun?: number | null;
    pushups?: number | null;
    situps?: number | null;
    sitAndReach?: number | null;
    trunkLift?: number | null;
    height?: number | null;
    weight?: number | null;
  };
  standards: StandardsData;
}): HFZResult {
  const { student, test, standards } = params;
  const age = getAgeOnTestDate(student.dateOfBirth, test.testDate);

  const components: Record<string, HFZStatus> = {
    cardio: "NA",
    pushups: "NA",
    situps: "NA",
    sitAndReach: "NA",
    trunkLift: "NA",
    bmi: "NA",
  };

  if (age === null) {
    return { overall: "NA", components };
  }

  const sexValue = String(student.sex).toUpperCase();
  if (!isSex(sexValue)) {
    return { overall: "NA", components };
  }

  const sexKey = sexValue === "F" ? "girls" : "boys";
  const ageKey = age >= 17 ? "17+" : String(age);
  const sexData = standards?.[sexKey as keyof StandardsData];

  const cardioStandards = sexData?.cardio?.[ageKey];
  const muscularStandards = sexData?.muscular?.[ageKey];

  if (typeof test.pacerOrMileRun === "number" && isCardioTestType(String(test.cardioTestType))) {
    const cardioType = test.cardioTestType as CardioTestType;
    if (cardioType === CARDIO_TEST_TYPE.MileRun) {
      components.cardio = getStatusFromRange(test.pacerOrMileRun, cardioStandards?.oneMilleRun, true);
    } else if (cardioType === CARDIO_TEST_TYPE.PACER) {
      components.cardio = getStatusFromRange(test.pacerOrMileRun, cardioStandards?.pacer20);
    }
  }

  if (typeof test.pushups === "number") {
    components.pushups = getStatusFromRange(test.pushups, muscularStandards?.pushup90);
  }

  if (typeof test.situps === "number") {
    components.situps = getStatusFromRange(test.situps, muscularStandards?.curlup);
  }

  if (typeof test.sitAndReach === "number") {
    const min = muscularStandards?.sitAndReach?.min;
    if (typeof min === "number") {
      components.sitAndReach = test.sitAndReach >= min ? "HFZ" : "NI";
    }
  }

  if (typeof test.trunkLift === "number") {
    components.trunkLift = getStatusFromRange(test.trunkLift, muscularStandards?.trunkLift);
  }

  const bmi = calculateBMI_US(test.height, test.weight);
  if (typeof bmi === "number") {
    components.bmi = getStatusFromRange(bmi, cardioStandards?.bmi);
  }

  const available = Object.values(components).filter((v) => v !== "NA");
  if (available.length === 0) {
    return { overall: "NA", components };
  }

  const hfzCount = available.filter((v) => v === "HFZ").length;
  const overall = hfzCount > available.length / 2 ? "HFZ" : "NI";

  return { overall, components };
}

/**
 * Developer verification examples (expected behavior):
 * 1) Age off-by-one: dob=2010-02-20, testDate=2026-02-19 -> age 15
 * 2) Age boundary: dob=2010-02-19, testDate=2026-02-19 -> age 16
 * 3) Missing standards: valid inputs + empty standards -> all components NA, overall NA
 * 4) Unknown cardioTestType: pacerOrMileRun=20 + cardioTestType="Unknown" -> cardio NA
 * 5) Missing dob/testDate: dob=null or testDate=null -> all components NA, overall NA
 * 6) BMI missing: height or weight null -> bmi NA (other components unaffected)
 */

export type HFZThresholds = {
  pacer20mMin: number | null;
  mileSlowTimeSeconds: number | null;
  curlUpMin: number;
  trunkLiftMin: number;
  pushUpMin: number;
  sitReachMin: number;
};

type HFZTable = Record<number, HFZThresholds>;

export const parseTimeToSeconds = (time: string): number => {
  const [minPart, secPart] = time.split(':');
  const minutes = Number(minPart);
  const seconds = Number(secPart);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return minutes * 60 + seconds;
};

export const HFZ_TABLES: { BOYS: HFZTable; GIRLS: HFZTable } = {
  BOYS: {
    5: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 2, trunkLiftMin: 6, pushUpMin: 3, sitReachMin: 8 },
    6: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 2, trunkLiftMin: 6, pushUpMin: 3, sitReachMin: 8 },
    7: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 4, trunkLiftMin: 6, pushUpMin: 4, sitReachMin: 8 },
    8: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 6, trunkLiftMin: 6, pushUpMin: 5, sitReachMin: 8 },
    9: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 9, trunkLiftMin: 6, pushUpMin: 6, sitReachMin: 8 },
    10: { pacer20mMin: 21, mileSlowTimeSeconds: parseTimeToSeconds('13:46'), curlUpMin: 10, trunkLiftMin: 6, pushUpMin: 5, sitReachMin: 8 },
    11: { pacer20mMin: 24, mileSlowTimeSeconds: parseTimeToSeconds('12:33'), curlUpMin: 12, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 8 },
    12: { pacer20mMin: 29, mileSlowTimeSeconds: parseTimeToSeconds('11:53'), curlUpMin: 15, trunkLiftMin: 6, pushUpMin: 10, sitReachMin: 8 },
    13: { pacer20mMin: 34, mileSlowTimeSeconds: parseTimeToSeconds('11:15'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 12, sitReachMin: 8 },
    14: { pacer20mMin: 39, mileSlowTimeSeconds: parseTimeToSeconds('10:41'), curlUpMin: 21, trunkLiftMin: 6, pushUpMin: 14, sitReachMin: 8 },
    15: { pacer20mMin: 44, mileSlowTimeSeconds: parseTimeToSeconds('10:07'), curlUpMin: 24, trunkLiftMin: 6, pushUpMin: 16, sitReachMin: 8 },
    16: { pacer20mMin: 49, mileSlowTimeSeconds: parseTimeToSeconds('9:41'), curlUpMin: 24, trunkLiftMin: 6, pushUpMin: 18, sitReachMin: 8 },
    17: { pacer20mMin: 54, mileSlowTimeSeconds: parseTimeToSeconds('9:15'), curlUpMin: 24, trunkLiftMin: 6, pushUpMin: 18, sitReachMin: 8 },
  },
  GIRLS: {
    5: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 2, trunkLiftMin: 6, pushUpMin: 3, sitReachMin: 9 },
    6: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 2, trunkLiftMin: 6, pushUpMin: 3, sitReachMin: 9 },
    7: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 4, trunkLiftMin: 6, pushUpMin: 4, sitReachMin: 9 },
    8: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 6, trunkLiftMin: 6, pushUpMin: 5, sitReachMin: 9 },
    9: { pacer20mMin: null, mileSlowTimeSeconds: null, curlUpMin: 9, trunkLiftMin: 6, pushUpMin: 6, sitReachMin: 9 },
    10: { pacer20mMin: 15, mileSlowTimeSeconds: parseTimeToSeconds('15:11'), curlUpMin: 10, trunkLiftMin: 6, pushUpMin: 5, sitReachMin: 9 },
    11: { pacer20mMin: 17, mileSlowTimeSeconds: parseTimeToSeconds('14:20'), curlUpMin: 12, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 10 },
    12: { pacer20mMin: 19, mileSlowTimeSeconds: parseTimeToSeconds('13:44'), curlUpMin: 15, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 10 },
    13: { pacer20mMin: 21, mileSlowTimeSeconds: parseTimeToSeconds('13:18'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 10 },
    14: { pacer20mMin: 23, mileSlowTimeSeconds: parseTimeToSeconds('12:57'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 10 },
    15: { pacer20mMin: 25, mileSlowTimeSeconds: parseTimeToSeconds('12:41'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 12 },
    16: { pacer20mMin: 27, mileSlowTimeSeconds: parseTimeToSeconds('12:22'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 12 },
    17: { pacer20mMin: 29, mileSlowTimeSeconds: parseTimeToSeconds('12:11'), curlUpMin: 18, trunkLiftMin: 6, pushUpMin: 7, sitReachMin: 12 },
  },
};

/**
 * Quick chart check (HFZ thresholds):
 * Boys age 13: PACER 34, Mile 11:15, Curl-up 18, Trunk 6, Push-up 12, Sit & Reach 8
 * Girls age 13: PACER 21, Mile 13:18, Curl-up 18, Trunk 6, Push-up 7, Sit & Reach 10
 */

const normalizeSex = (value: string): 'boys' | 'girls' | null => {
  const normalized = value.trim().toLowerCase();
  if (['m', 'male', 'boy', 'boys'].includes(normalized)) return 'boys';
  if (['f', 'female', 'girl', 'girls'].includes(normalized)) return 'girls';
  return null;
};

export const computeAgeOnTestDate = (dateOfBirth: Date, testDate: Date): number => {
  const dob = new Date(dateOfBirth);
  const test = new Date(testDate);
  let age = test.getFullYear() - dob.getFullYear();
  const monthDiff = test.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 5) return 5;
  if (age >= 17) return 17;
  return age;
};

export const getHfzThresholds = (sex: string, age: number): HFZThresholds | null => {
  const normalizedSex = normalizeSex(sex);
  if (!normalizedSex) return null;
  const table = normalizedSex === 'boys' ? HFZ_TABLES.BOYS : HFZ_TABLES.GIRLS;
  const clampedAge = age >= 17 ? 17 : Math.max(5, age);
  return table[clampedAge] ?? null;
};

export const getBmiHfzRange = (sex: string, age: number): StandardsRange | null => {
  const normalizedSex = normalizeSex(sex);
  if (!normalizedSex) return null;
  if (age < 10) return null;
  const table = normalizedSex === "boys" ? BMI_HFZ_RANGE.boys : BMI_HFZ_RANGE.girls;
  const ageBucket = age >= 17 ? '17+' : age;
  const range = table[ageBucket];
  if (!range) return null;
  return { min: range.min, max: range.max };
};

type SimpleHFZKey = 'PACER' | 'MILE' | 'CURLUP' | 'PUSHUP' | 'TRUNK' | 'SITREACH' | 'SHOULDER' | 'BMI';

export const isHFZ = (
  testKey: SimpleHFZKey,
  value: number | undefined,
  context: { sex: string; age: number; shoulderRight?: boolean; shoulderLeft?: boolean }
): boolean | null => {
  const thresholds = getHfzThresholds(context.sex, context.age);
  if (!thresholds) return null;

  if (testKey === 'SHOULDER') {
    if (typeof context.shoulderLeft !== 'boolean' || typeof context.shoulderRight !== 'boolean') {
      return null;
    }
    return context.shoulderLeft && context.shoulderRight;
  }

  if (value === undefined) return null;

  switch (testKey) {
    case 'PACER':
      return thresholds.pacer20mMin === null ? null : value >= thresholds.pacer20mMin;
    case 'MILE':
      return thresholds.mileSlowTimeSeconds === null ? null : value <= thresholds.mileSlowTimeSeconds;
    case 'CURLUP':
      return value >= thresholds.curlUpMin;
    case 'PUSHUP':
      return value >= thresholds.pushUpMin;
    case 'TRUNK':
      return value >= thresholds.trunkLiftMin;
    case 'SITREACH':
      return value >= thresholds.sitReachMin;
    case 'BMI': {
      const bmiRange = getBmiHfzRange(context.sex, context.age);
      if (!bmiRange || typeof bmiRange.min !== 'number' || typeof bmiRange.max !== 'number') return null;
      return value >= bmiRange.min && value <= bmiRange.max;
    }
    default:
      return null;
  }
};
