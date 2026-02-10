# Verification Checklist - Curriculum Resource Access Fix

## Pre-Fix Status
- ❌ Teachers cannot see curriculum resources in `/dashboard/curriculum`
- ❌ Teachers cannot see resources in lesson plan edit resource picker
- ❌ Teachers cannot see resources in lesson builder
- ✅ Admins can see resources in `/admin/curriculum`

## Changes Made

### 1. API Authorization (✅ Already Correct - Verified)
**File**: `src/app/api/curriculum/route.ts` (Lines 7-23)
- GET endpoint accepts BOTH teacher_session AND admin_session cookies
- Returns 401 only if neither session exists
- POST/PUT/DELETE remain admin-only

### 2. Debug Logging Added (✅ Implemented)
**File**: `src/app/api/curriculum/route.ts`

Added two console.log statements:
- Line 15: Logs session type (admin/teacher/none) on every GET request
- Line 17: Logs access denial (for debugging 401 errors)
- Line 60: Logs resource count returned to user

Purpose: Verify which user type is accessing the endpoint and see resource counts.

### 3. Fixed Teacher UI Endpoint (✅ Implemented)
**File**: `src/app/dashboard/lesson-plans/[id]/edit/page.tsx`

Changed:
- FROM: `fetch("/api/admin/resources")` (stub, returns empty array)
- TO: `fetch("/api/curriculum")` (real endpoint with database)

This is the CRITICAL fix that was causing the issue.

## Verification Steps

### Step 1: Database Check
```bash
# Verify curriculum resources exist in database
sqlite3 prisma/dev.db "SELECT id, title, type FROM CurriculumResource LIMIT 5;"
```
Expected: Shows created resources

### Step 2: Admin API Check
```bash
curl -b "admin_session=test" http://localhost:3000/api/curriculum
```
Expected: Returns resources (if admin_session valid)

### Step 3: Teacher API Check
```bash
curl -b "teacher_session=test" http://localhost:3000/api/curriculum
```
Expected: Returns resources (if teacher_session valid)

### Step 4: No Session Check
```bash
curl http://localhost:3000/api/curriculum
```
Expected: Returns 401 Unauthorized

### Step 5: Browser Console Logs
When running `npm run dev`, you should see in the terminal:
```
[GET /api/curriculum] Session type: teacher
[GET /api/curriculum] Returning 3 resources to teacher user
```

### Step 6: Manual UI Testing

#### Test 6a: Admin Creates Resource
1. Login as admin
2. Go to `/admin/curriculum`
3. Click "Create New Resource"
4. Fill: title="Test Resource", type="pdf", band="ELEMENTARY"
5. Click Submit
6. **Expected**: Resource appears in list

#### Test 6b: Teacher Sees Resource
1. Logout, login as teacher
2. Go to `/dashboard/curriculum`
3. **Expected**: See "Test Resource" created by admin
4. **Check console logs**: Should show teacher session and resource count

#### Test 6c: Resource Picker
1. As teacher, go to `/dashboard/lesson-plans/1/edit`
2. Scroll to "Select Resources" section
3. Click "Select Resources" button
4. **Expected**: Resource picker opens and shows "Test Resource"
5. **Check browser console**: Should see successful fetch with no errors

#### Test 6d: No 401 Errors
1. Check browser Developer Tools (F12)
2. Go to Network tab
3. Perform tests above
4. **Expected**: No 401 responses for `/api/curriculum` calls

## Success Criteria

✅ All of the following must be true:

1. [ ] `/api/curriculum` GET accepts teacher_session cookie
2. [ ] `/api/curriculum` GET accepts admin_session cookie  
3. [ ] `/api/curriculum` GET returns 401 without any session
4. [ ] `/dashboard/curriculum` displays resources created by admin
5. [ ] `/dashboard/lesson-plans/[id]/edit` resource picker shows resources
6. [ ] `/dashboard/lesson-builder` resource selector shows resources
7. [ ] Console logs show `[GET /api/curriculum] Session type: teacher` when teacher accesses
8. [ ] Console logs show resource count in response
9. [ ] No TypeScript compilation errors
10. [ ] No 401 errors in browser network tab

## Cleanup Notes

Debug logging is **temporary** and should be disabled after verification:
- Comment out or remove lines 15, 17, 60 in `src/app/api/curriculum/route.ts`
- This cleans up server logs during production

To disable:
```typescript
// const sessionType = adminSession ? "admin" : teacherSession ? "teacher" : "none";
// console.log(`[GET /api/curriculum] Session type: ${sessionType}`);
```

## Rollback Plan

If issues occur, revert:
1. `git checkout src/app/api/curriculum/route.ts` (removes debug logs)
2. `git checkout src/app/dashboard/lesson-plans/[id]/edit/page.tsx` (reverts endpoint)

The changes are minimal and isolated.

## Related Files (Not Modified - For Reference)

- `src/app/api/admin/resources/route.ts` - Old stub endpoint (no longer used by teachers)
- `src/app/dashboard/curriculum/page.tsx` - Already uses `/api/curriculum` ✓
- `src/app/dashboard/lesson-builder/page.tsx` - Already uses `/api/curriculum` ✓
- `src/app/dashboard/lessons/[id]/edit/page.tsx` - Already uses `/api/curriculum` ✓

## Time to Fix
- Root cause identification: Traced wrong endpoint call in lesson-plans edit page
- Implementation: Simple endpoint swap + debug logging
- Testing: Follow verification steps above
- Expected impact: Minimal, isolated change

## Questions?

If teachers still cannot see resources:
1. Check server logs for `[GET /api/curriculum]` messages
2. Verify teacher_session cookie is being set (use browser DevTools → Application → Cookies)
3. Verify database has curriculum resources (use sqlite3 check above)
4. Check for any auth middleware that might be blocking requests
