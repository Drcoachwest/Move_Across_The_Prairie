# PACER Improvement Tracker Feature

**Status**: ✅ Implemented  
**Date**: February 3, 2026  
**Purpose**: Compare Fall vs Spring PACER scores to identify significant student improvement

---

## Overview

The PACER Improvement Tracker allows teachers to:
- Compare Fall and Spring PACER test results for each student
- Identify students with **significant improvement**
- View class-wide improvement statistics
- Track fitness growth over the school year

---

## How It Works

### Significant Improvement Criteria

A student is marked as having **SIGNIFICANT IMPROVEMENT** if **ANY** of these conditions are met:

| Criteria | Threshold | Example |
|----------|-----------|---------|
| **Percentage Increase** | 10% or more | 40 laps → 44+ laps |
| **Zone Change** | Moved from "Improvement Needed" to "Healthy Fitness Zone" | Failed in Fall → Passed in Spring |

### Additional Improvement Levels

| Status | Criteria | Color |
|--------|----------|-------|
| **Significant Improvement** | 10%+ increase OR moved to HFZ | 🟢 Green |
| **Good Progress** | 5-10% increase | 🔵 Blue |
| **Small Improvement** | 1-5% increase | 🔵 Blue |
| **No Change** | 0% change | ⚫ Gray |
| **Declined** | Any decrease | 🟠 Orange |

---

## How to Use

### Step 1: Go to PACER Improvement Tracker
- From Teacher Dashboard, click **📈 PACER Improvement Tracker**
- Or navigate to `/teacher/dashboard/pacer-comparison`

### Step 2: Select Grade Level
- Choose Grade 3, 4, or 5
- System will load all students in that grade with both Fall and Spring tests

### Step 3: View Results
- **Class Summary**: See overall improvement statistics
  - % with significant improvement
  - % with any improvement
  - Average % change across class
  - Number who declined
- **Student Table**: Individual student comparisons
  - Fall PACER score
  - Spring PACER score
  - Change in laps
  - % change
  - Improvement status

### Step 4: View Detailed Insights
- Below the table, see detailed improvement message for each student
- Understand why they were or weren't marked as "significant"

---

## Example Scenarios

### Scenario 1: Significant Improvement (10%+)
```
Student: Aiden Martinez
Fall: 30 laps
Spring: 33 laps
Change: +3 laps (+10%)
Status: ✓ SIGNIFICANT IMPROVEMENT
Reason: Reached the 10% threshold
```

### Scenario 2: Moved to Healthy Zone
```
Student: Bella Johnson
Fall: 20 laps (Below HFZ of 23-61)
Spring: 25 laps (Within HFZ)
Change: +5 laps (+25%)
Status: ✓ SIGNIFICANT IMPROVEMENT
Reason: Moved from "Improvement Needed" to "Healthy Fitness Zone"
```

### Scenario 3: Good Progress (Under 10%)
```
Student: Carlos Rodriguez
Fall: 35 laps
Spring: 36 laps
Change: +1 lap (+2.9%)
Status: Improved (not significant)
Reason: Less than 10% increase
```

### Scenario 4: No Data
```
Student: Diana Lee
Fall: No test
Spring: 28 laps
Change: Cannot compare
Status: No Data
Reason: Missing Fall test result
```

---

## Class Statistics Explained

| Metric | What It Means |
|--------|---------------|
| **Significant Improvement %** | Percentage of students with 10%+ increase OR moved to HFZ |
| **Any Improvement %** | Percentage with ANY positive change (includes small gains) |
| **Average % Change** | Average percentage increase/decrease across all students |
| **Declined** | Count of students who performed worse in Spring |

### Example Class Results
```
Class Statistics (Grade 5):
- Significant Improvement: 68% (17 of 25 students)
- Any Improvement: 84% (21 of 25 students)
- Average % Change: +12.3%
- Declined: 2 students
```

---

## Data Requirements

### For Comparison to Work
- Student must have **BOTH** Fall and Spring tests
- Tests must have valid PACER/mile run scores
- Student must have valid sex and date of birth (for standards lookup)

**Note**: Only tests marked as **PACER** (laps) are included in comparisons. 
1-mile run (minutes) is excluded from PACER improvement tracking.

### If Data is Missing
- Comparison shows "—" for missing values
- Status shows "No Data"
- Student still visible but not counted in class stats

---

## Implementation Details

### Files Added
- [/src/lib/improvement-tracker.ts](src/lib/improvement-tracker.ts) - Core improvement calculation logic
- [/src/app/teacher/dashboard/pacer-comparison/page.tsx](src/app/teacher/dashboard/pacer-comparison/page.tsx) - UI page

### Key Functions
- `calculateImprovement()` - Determines if improvement is significant
- `calculateClassImprovementStats()` - Aggregates class-wide statistics
- `getImprovementColor()` - Returns color for UI display
- `getZone()` - Determines HFZ/Improvement Needed status

### Standards Used
- Loads FitnessGram standards from `src/lib/fitnessgram-standards.json`
- Uses 20-meter PACER standards
- Adjusts for student age and sex

---

## Future Enhancements

Possible additions:
- [ ] Export improvement data to PDF for principal/parents
- [ ] Trend charts showing improvement over time
- [ ] Individual student improvement goals
- [ ] Class-wide benchmarks/goals
- [ ] Notification alerts for students declining
- [ ] Multi-class comparison view
- [ ] Historical tracking (year-over-year)

---

## Troubleshooting

### No Students Showing
**Problem**: Selected grade but no students appear
**Solution**: 
- Ensure students have BOTH Fall and Spring tests entered
- Check that Fall and Spring tests are marked with correct testSeason
- Verify students are assigned to correct grade level

### Incorrect Improvement Calculation
**Problem**: A student shows as not significant but should be
**Solution**:
- Verify Fall PACER score is correct (check data entry)
- Verify Spring PACER score is correct
- Check student's age and sex for correct standards

### Standards Not Loading
**Problem**: "No Standard" appears for students
**Solution**:
- Student may be age 8 or 17+ (outside FitnessGram age range)
- Check `fitnessgram-standards.json` for age/sex combination

---

## Notes

- Changes to PACER scores automatically update the comparison
- Refresh page to see latest data after entering new tests
- Comparison is read-only; edit tests from Assessment page
- Data is stored in FitnessTest table with testSeason field

---

**Questions?** Check the [Assessment Page](src/app/teacher/assessment/page.tsx) for test entry instructions.
