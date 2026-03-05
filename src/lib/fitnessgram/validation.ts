export type ValidationResult = { valid: boolean; message?: string };

type FieldRule = {
  min: number;
  max: number;
  integerOnly: boolean;
  label: string;
};

export const FIELD_RULES: Record<
  'pacerLaps' | 'curlUps' | 'trunkLift' | 'mileMinutes' | 'mileSeconds',
  FieldRule
> = {
  pacerLaps: { min: 0, max: 247, integerOnly: true, label: 'PACER laps' },
  curlUps: { min: 0, max: 75, integerOnly: true, label: 'Curl-ups' },
  trunkLift: { min: 0, max: 12, integerOnly: true, label: 'Trunk lift' },
  mileMinutes: { min: 0, max: 30, integerOnly: true, label: '1-Mile minutes' },
  mileSeconds: { min: 0, max: 59, integerOnly: true, label: '1-Mile seconds' },
};

export const normalizeNumberInput = (raw: string): number | undefined => {
  if (raw.trim() === '') return undefined;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
};

export const validateNumber = (
  fieldKey: keyof typeof FIELD_RULES,
  value: number | undefined
): ValidationResult => {
  if (value === undefined) return { valid: true };

  if (Number.isNaN(value)) {
    return { valid: false, message: 'Enter a valid number.' };
  }

  const rule = FIELD_RULES[fieldKey];
  if (value < rule.min) {
    return { valid: false, message: `${rule.label} cannot be negative.` };
  }

  if (rule.integerOnly && !Number.isInteger(value)) {
    return { valid: false, message: `${rule.label} must be a whole number.` };
  }

  if (value > rule.max) {
    return { valid: false, message: `${rule.label} must be ${rule.max} or less.` };
  }

  return { valid: true };
};

export const validateMileTime = (
  minutes: number | undefined,
  seconds: number | undefined,
  dnf?: boolean
): ValidationResult => {
  if (dnf) return { valid: true };

  const minutesResult = validateNumber('mileMinutes', minutes);
  if (!minutesResult.valid) return minutesResult;

  const secondsResult = validateNumber('mileSeconds', seconds);
  if (!secondsResult.valid) return secondsResult;

  if (minutes === undefined && seconds === undefined) {
    return { valid: true };
  }

  const safeMinutes = minutes ?? 0;
  const safeSeconds = seconds ?? 0;
  const totalSeconds = safeMinutes * 60 + safeSeconds;

  if (totalSeconds > 30 * 60) {
    return { valid: false, message: '1-Mile time must be 30:00 or less.' };
  }

  if (safeMinutes === 30 && safeSeconds !== 0) {
    return { valid: false, message: '30:00 is the maximum allowed time.' };
  }

  return { valid: true };
};
