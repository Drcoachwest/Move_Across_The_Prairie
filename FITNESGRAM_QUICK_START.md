# FitnesGram Assessment Module - Quick Start Guide

## Getting Started

### Step 1: Access the Assessment Module

**Admin Access:**
1. Log in to `/auth/admin` with your admin credentials
2. Go to Admin Dashboard
3. Click "FitnesGram Assessment" card (💪 icon)
4. You'll see two tabs: "Import Students" and "Enter Test Data"

**Teacher Access:**
1. Log in to `/auth/signin` with your teacher credentials
2. Click "Assessment Data" card (📊 icon) on your dashboard
3. View all student test results and progress

---

## Phase 1: Import Students

### Getting the CSV Template

1. Go to `/admin/assessment`
2. Click "Import Students" tab
3. Click **"Download Template"** button
4. Opens a file with example format:

```csv
districtId,firstName,lastName,dateOfBirth,grade,school,peTeacher
STU001,John,Doe,2010-05-15,6,Central Elementary,Ms. Smith
STU002,Jane,Smith,2009-08-22,7,Central Elementary,Mr. Johnson
STU003,Bob,Johnson,2008-03-10,8,Lincoln Middle School,Ms. Garcia
```

### Required Columns

| Column | Format | Example | Notes |
|--------|--------|---------|-------|
| districtId | Text | STU001 | Must be unique across all schools |
| firstName | Text | John | Student first name |
| lastName | Text | Doe | Student last name |
| dateOfBirth | YYYY-MM-DD | 2010-05-15 | Date in this format |
| grade | Number | 6 | Must be 3-12 |
| school | Text | Central Elementary | School name |
| peTeacher | Text | Ms. Smith | PE teacher name |

### Uploading Students

1. Prepare your CSV file with all students
2. Go to `/admin/assessment` → "Import Students" tab
3. Click **"Select CSV File"** button
4. Choose your prepared CSV file
5. Click **"Import Students"** button
6. You'll see:
   - ✅ Number of students imported
   - ⚠️ Number of errors/skipped
   - 📋 Detailed error list (if any)

### Common Import Errors

| Error | Solution |
|-------|----------|
| Missing required field | Ensure all 7 columns are present |
| Grade must be between 3 and 12 | Use only 3-12 for grade column |
| Invalid date format | Use YYYY-MM-DD (e.g., 2010-05-15) |
| Grade already exists in year | Student is already imported |

---

## Phase 2: Enter Test Data

### Basic Process

1. Go to `/admin/assessment` → "Enter Test Data" tab
2. **Select Student** - Choose from dropdown (all imported students)
3. **Set Test Date** - Pick the date of the test
4. **Choose Season** - Fall or Spring
5. **Enter Metrics** - Input any/all fitness test results
6. **Save** - Click "Save Test Data"

### Test Metrics Explained

#### Running Test (PACER or 1-Mile Run)
- **PACER:** Count of laps completed in 20m shuttle run
- **1-Mile Run:** Time in minutes to complete 1 mile
- **Example:** 42 (laps) or 8.5 (minutes)

#### Muscular Strength
- **Pushups:** Number completed in 60 seconds
- **Situps:** Number completed in 60 seconds
- **Range:** 0-100+

#### Flexibility
- **Sit and Reach:** Distance in cm (positive = stretches past toes, negative = cannot reach toes)
- **Shoulder Stretch:** Check "pass" if student can touch hands behind back
  - Check BOTH right and left separately
- **Trunk Lift:** Distance in cm student can lift from lying position

#### Body Composition
- **Height:** In centimeters
- **Weight:** In kilograms
- **Note:** BMI is **automatically calculated** (no need to enter manually)

### Data Entry Tips

✅ All fields are **optional** - enter what you have
✅ You can update a test later if you entered incomplete data
✅ Leave blank any metrics not tested
✅ Use **Notes** field for special circumstances

### Example Entry

```
Student: John Doe (STU001, Grade 6)
Test Date: 2024-10-15
Season: Fall
Test Data:
  - PACER/Mile Run: 42 laps
  - Pushups: 18
  - Situps: 28
  - Sit and Reach: 5.5 cm
  - Shoulder Stretch R: ✓ Pass
  - Shoulder Stretch L: ✓ Pass
  - Height: 145 cm
  - Weight: 42 kg
  - [BMI auto-calculated: 19.9]
  - Trunk Lift: 9 cm
  - Notes: Student had minor shoulder discomfort during stretch tests
```

---

## Phase 3: Viewing Results (Teacher)

### Accessing Assessment Data

1. Go to `/dashboard/assessment`
2. See all students' fitness tests
3. Use filters at top:
   - **Year:** Select academic year
   - **Season:** Select Fall or Spring
4. Results automatically update based on filters

### Reading the Comparison Table

For each student, you see:

| Column | Meaning |
|--------|---------|
| Metric | Name of fitness test |
| Fall | Fall test result |
| Spring | Spring test result |
| Progress | Change from Fall to Spring |

**Progress Indicator Format:**
- `+5.0 (50%)` = Improved by 5 units (50% gain)
- `-2.0 (-12%)` = Declined by 2 units (12% loss)
- Green = Improvement
- Red = Decline
- — = No data for comparison

### Example Results

```
Student: Jane Smith (STU002, Grade 7)
Year: 2024

Metric                   Fall        Spring      Progress
PACER/Mile Run          35 laps     42 laps     +7 (+20%) ✓
Pushups                 12          16          +4 (+33%) ✓
Situps                  24          28          +4 (+17%) ✓
Sit and Reach           2.5 cm      4.0 cm      +1.5 (+60%) ✓
Height                  152 cm      153 cm      —
Weight                  48 kg       49 kg       —
BMI                     20.8        21.0        —
Trunk Lift              7 cm        8 cm        +1 (+14%) ✓
```

---

## Managing Multiple Years

### Year 1 (2024)
1. Import students (Oct 2024)
2. Give Fall tests (Oct 2024)
3. Give Spring tests (April 2025)
4. View comparisons - "2024" year selected

### Year 2 (2025)
1. Same students imported (already exist - will update)
2. Give Fall tests (Oct 2025)
3. Give Spring tests (April 2026)
4. Teachers select year "2025" to see new results
5. Previous year data still available for year-over-year tracking

---

## Data Portability (School Transfers)

### When a Student Transfers Schools

**Automatic Handling:**
1. Student remains in system with same district ID
2. Create new StudentHistory record in admin (future feature)
3. Teacher can still see all historical data
4. New school's teachers can immediately see fitness history

**Benefits:**
- No data loss when students change schools
- Complete fitness journey visible
- Transferable assessment history

---

## FAQs

### Q: Can I edit a test after saving?
**A:** Yes - update the form with same student/date/season and save. It will update existing data.

### Q: What if I don't have all metrics?
**A:** That's fine! Leave blank any metrics you don't have. Save what you do have.

### Q: Can I enter multiple tests per season?
**A:** No - the system allows 2 tests per academic year (Fall + Spring). Saving a second Fall test will update the first.

### Q: Who can see assessment data?
**A:** 
- Admins: Can view all data and make entries
- Teachers: Can view read-only assessment data
- Students/Parents: Not yet (future feature)

### Q: How do I compare years?
**A:** As a teacher:
1. Use "Year" dropdown to select first year
2. View all results
3. Change "Year" to second year
4. View new results for comparison

### Q: What if the BMI calculation is wrong?
**A:** BMI is calculated as: weight (kg) / [height (m)]²
Example: 42 kg ÷ (1.45 m)² = 19.9 BMI

---

## Troubleshooting

### CSV Import Fails
- ✅ Check all 7 columns present
- ✅ Check date format is YYYY-MM-DD
- ✅ Check grade is 3-12
- ✅ Check districtId has no duplicates in file

### Student Not in Dropdown
- ✅ You may not have imported them yet
- ✅ Go to "Import Students" tab
- ✅ Download template and add the student
- ✅ Re-import

### Test Won't Save
- ✅ Make sure student is selected
- ✅ Make sure test date is valid
- ✅ Check season is Fall or Spring
- ✅ Look for error message at top of page

### Can't See Assessment Link
- ✅ Make sure you're logged in
- ✅ Admin: Log in at `/auth/admin`
- ✅ Teacher: Log in at `/auth/signin`

---

## Best Practices

### Testing Tips
✅ Have students re-test within same season if first attempt invalid
✅ Take notes on unusual circumstances (illness, injury, etc.)
✅ Test in similar conditions for accurate comparisons
✅ Keep at least 4-month gap between Fall and Spring tests

### Data Management
✅ Import all students at start of year
✅ Conduct Fall tests Oct-Nov
✅ Conduct Spring tests April-May
✅ Archive previous year data regularly
✅ Use unique, consistent district IDs

### Teacher Tips
✅ Filter by grade level to focus on your classes
✅ Use progress % to identify students needing attention
✅ Review notes for context on results
✅ Share positive progress with students for motivation

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Move between form fields |
| Enter | Submit form on button focus |
| Esc | Close error/success messages |

---

**Need Help?** Check the System Documentation or contact your administrator.

**Last Updated:** January 2025
**Version:** 1.0
