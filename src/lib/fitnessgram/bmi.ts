export function calculateBMI_US(
  heightIn: number | null | undefined,
  weightLb: number | null | undefined
): number | null {
  if (!heightIn || !weightLb) return null;
  if (heightIn <= 0 || weightLb <= 0) return null;

  const bmi = (weightLb / (heightIn * heightIn)) * 703;
  return Number(bmi.toFixed(1));
}
