// Improvement Tracker - Calculate significant improvement in PACER scores
// Compares Fall to Spring performance

export interface PacerComparison {
  fallLaps: number | undefined;
  springLaps: number | undefined;
  percentageChange: number;
  lapDifference: number;
  isSignificantImprovement: boolean;
  improvementStatus: 'improved' | 'declined' | 'no-change';
  improvementMessage: string;
}

export interface FitnessZone {
  zone: 'HFZ' | 'NeedImprovement' | 'NoData';
  min: number;
  max: number;
}

/**
 * Determine which fitness zone a PACER score falls into
 */
export function getZone(laps: number | undefined, fallMin: number, fallMax: number): FitnessZone {
  if (laps === undefined || laps === null) {
    return { zone: 'NoData', min: fallMin, max: fallMax };
  }
  
  if (laps >= fallMin && laps <= fallMax) {
    return { zone: 'HFZ', min: fallMin, max: fallMax };
  } else {
    return { zone: 'NeedImprovement', min: fallMin, max: fallMax };
  }
}

/**
 * Calculate improvement between Fall and Spring PACER scores
 * Criteria for "significant improvement":
 * - 10% or more increase in laps, OR
 * - Moved from "Improvement Needed" to "Healthy Fitness Zone" (HFZ)
 */
export function calculateImprovement(
  fallLaps: number | undefined,
  springLaps: number | undefined,
  fallMin: number,
  fallMax: number
): PacerComparison {
  // No data to compare
  if (!fallLaps || !springLaps) {
    return {
      fallLaps,
      springLaps,
      percentageChange: 0,
      lapDifference: 0,
      isSignificantImprovement: false,
      improvementStatus: 'no-change',
      improvementMessage: 'Missing Fall or Spring test data',
    };
  }

  const lapDifference = springLaps - fallLaps;
  const percentageChange = (lapDifference / fallLaps) * 100;

  // Get zones for both tests
  const fallZone = getZone(fallLaps, fallMin, fallMax);
  const springZone = getZone(springLaps, fallMin, fallMax);

  // Determine if significant improvement
  let isSignificantImprovement = false;
  let improvementStatus: 'improved' | 'declined' | 'no-change' = 'no-change';
  let improvementMessage = '';

  if (lapDifference > 0) {
    improvementStatus = 'improved';
    
    // Criteria 1: 10% or more increase
    if (percentageChange >= 10) {
      isSignificantImprovement = true;
      improvementMessage = `Significant improvement! +${lapDifference} laps (+${percentageChange.toFixed(1)}%)`;
    }
    // Criteria 2: Moved from "Improvement Needed" to "HFZ"
    else if (fallZone.zone === 'NeedImprovement' && springZone.zone === 'HFZ') {
      isSignificantImprovement = true;
      improvementMessage = `Moved to Healthy Fitness Zone! +${lapDifference} laps`;
    }
    // Criteria 3: Moderate improvement (5-10%)
    else if (percentageChange >= 5) {
      improvementMessage = `Good progress! +${lapDifference} laps (+${percentageChange.toFixed(1)}%)`;
    }
    // Criteria 4: Minor improvement (under 5%)
    else {
      improvementMessage = `Small improvement. +${lapDifference} laps (+${percentageChange.toFixed(1)}%)`;
    }
  } else if (lapDifference < 0) {
    improvementStatus = 'declined';
    improvementMessage = `Performance declined. ${lapDifference} laps (${percentageChange.toFixed(1)}%)`;
  } else {
    improvementStatus = 'no-change';
    improvementMessage = 'No change from Fall to Spring';
  }

  return {
    fallLaps,
    springLaps,
    percentageChange,
    lapDifference,
    isSignificantImprovement,
    improvementStatus,
    improvementMessage,
  };
}

/**
 * Get color for improvement status for UI display
 */
export function getImprovementColor(status: 'improved' | 'declined' | 'no-change', isSignificant: boolean): string {
  if (status === 'improved' && isSignificant) {
    return 'text-green-600 bg-green-50'; // Significant improvement
  } else if (status === 'improved') {
    return 'text-blue-600 bg-blue-50'; // Some improvement
  } else if (status === 'declined') {
    return 'text-orange-600 bg-orange-50'; // Declined
  } else {
    return 'text-gray-600 bg-gray-50'; // No change
  }
}

/**
 * Calculate class-wide improvement statistics
 */
export interface ClassImprovementStats {
  totalStudentsWithBothTests: number;
  studentsWithSignificantImprovement: number;
  studentsWithSomeImprovement: number;
  studentsWithNoChange: number;
  studentsWithDecline: number;
  percentageImproved: number;
  percentageSignificantlyImproved: number;
  averagePercentageChange: number;
}

export function calculateClassImprovementStats(
  comparisons: PacerComparison[]
): ClassImprovementStats {
  const withBothTests = comparisons.filter(c => c.fallLaps && c.springLaps);
  const total = withBothTests.length;

  if (total === 0) {
    return {
      totalStudentsWithBothTests: 0,
      studentsWithSignificantImprovement: 0,
      studentsWithSomeImprovement: 0,
      studentsWithNoChange: 0,
      studentsWithDecline: 0,
      percentageImproved: 0,
      percentageSignificantlyImproved: 0,
      averagePercentageChange: 0,
    };
  }

  const significant = withBothTests.filter(c => c.isSignificantImprovement).length;
  const someImprovement = withBothTests.filter(
    c => c.improvementStatus === 'improved' && !c.isSignificantImprovement
  ).length;
  const noChange = withBothTests.filter(c => c.improvementStatus === 'no-change').length;
  const declined = withBothTests.filter(c => c.improvementStatus === 'declined').length;

  const totalImproved = significant + someImprovement;
  const avgPercentage =
    withBothTests.reduce((sum, c) => sum + c.percentageChange, 0) / total;

  return {
    totalStudentsWithBothTests: total,
    studentsWithSignificantImprovement: significant,
    studentsWithSomeImprovement: someImprovement,
    studentsWithNoChange: noChange,
    studentsWithDecline: declined,
    percentageImproved: (totalImproved / total) * 100,
    percentageSignificantlyImproved: (significant / total) * 100,
    averagePercentageChange: avgPercentage,
  };
}
