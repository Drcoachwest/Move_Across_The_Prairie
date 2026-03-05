export default function HFZRuleInfo() {
  return (
    <p className="text-xs text-gray-500 mt-1">
      <strong>Healthy Fitness Zone (HFZ)</strong>{' '}
      Each test component is evaluated using age- and sex-specific FitnessGram standards. A student is considered in the HFZ for a component if their score meets or exceeds the criterion standard. Overall HFZ in this app is calculated as a strict majority of available component HFZ results (excluding components not tested). NA = not tested / not entered (excluded from overall).
    </p>
  );
}
