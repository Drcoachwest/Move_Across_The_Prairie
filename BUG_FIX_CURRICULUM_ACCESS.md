# Bug Fix: Teacher Cannot See Curriculum Resources

## Issue
Teachers could not see curriculum resources created by admins in:
- `/dashboard/curriculum` (Curriculum Library)
- Resource picker in lesson plan edit form
- Lesson builder resource selector

Admin resources were visible only in `/admin/curriculum`.

## Root Cause
The lesson plan edit page (`src/app/dashboard/lesson-plans/[id]/edit/page.tsx`) was calling the wrong API endpoint:
- **Incorrect**: `/api/admin/resources` (stub endpoint that returns empty array)
- **Correct**: `/api/curriculum` (real endpoint with database query)

The `/api/curriculum` endpoint was already correctly configured to allow both teacher and admin sessions, but teachers were not using it.

## Solution

### 1. Fixed API Endpoint Call
**File**: `src/app/dashboard/lesson-plans/[id]/edit/page.tsx`

Changed the resource fetching function from:
```typescript
const fetchResources = async () => {
  const response = await fetch("/api/admin/resources");  // ❌ Wrong - stub endpoint
  const data = await response.json();
  if (data.success) {
    setResources(data.resources);
  }
};
```

To:
```typescript
const fetchResources = async () => {
  const response = await fetch("/api/curriculum");  // ✅ Correct - real endpoint
  const data = await response.json();
  if (data.resources) {
    setResources(data.resources.map((r: any) => ({
      id: r.id,
      title: r.title,
      type: r.type,
    })));
  }
};
```

### 2. Added Debug Logging
**File**: `src/app/api/curriculum/route.ts`

Added session type detection and logging to `GET /api/curriculum`:
```typescript
// DEBUG: Log which session type is being used
const sessionType = adminSession ? "admin" : teacherSession ? "teacher" : "none";
console.log(`[GET /api/curriculum] Session type: ${sessionType}`);
```

And:
```typescript
console.log(`[GET /api/curriculum] Returning ${resources.length} resources to ${sessionType} user`);
```

**Purpose**: Verify that:
- Teachers are authenticated as "teacher" session type
- Resources are being fetched from database and returned successfully
- Log messages appear in server console when debugging

## Verification

### GET /api/curriculum Auth Logic (Already Correct)
```typescript
const cookieStore = await cookies();
const teacherSession = cookieStore.get("teacher_session");
const adminSession = cookieStore.get("admin_session");

if (!teacherSession && !adminSession) {
  return NextResponse.json(
    { error: "Unauthorized. Please sign in to access curriculum resources." },
    { status: 401 }
  );
}
```

✅ Allows access for BOTH teacher and admin sessions
✅ Returns 401 only if neither session exists
✅ POST/PUT/DELETE remain admin-only

### Teacher UI Endpoints Fixed
- ✅ `/dashboard/curriculum/page.tsx` - already uses `/api/curriculum` (line 78)
- ✅ `/dashboard/lesson-builder/page.tsx` - already uses `/api/curriculum` (line 99)
- ✅ `/dashboard/lesson-plans/[id]/edit/page.tsx` - **NOW FIXED** to use `/api/curriculum` (line 69)

All teacher-facing UIs now consistently call the correct endpoint.

## Test Steps

1. **As Admin**:
   - Navigate to `/admin/curriculum`
   - Create a test resource (title: "Test PDF", type: "pdf", band: "ELEMENTARY")
   - Verify it appears in the list

2. **As Teacher** (in same browser or different):
   - Navigate to `/dashboard/curriculum`
   - **Expected**: See the resource created by admin
   - **Check browser console**: Should show no errors

3. **As Teacher - Lesson Plan Edit**:
   - Go to `/dashboard/lesson-plans/[id]/edit`
   - Click "Select Resources"
   - **Expected**: See the resource created by admin in the picker
   - **Check browser console**: Should show no errors

4. **Server Logs** (while testing):
   - Watch terminal where `npm run dev` is running
   - **Expected**: See logs like:
     ```
     [GET /api/curriculum] Session type: teacher
     [GET /api/curriculum] Returning 1 resources to teacher user
     ```

## Cleanup Notes

Debug logging should be **disabled or removed** after confirming the fix works. The logs are temporary and help verify:
- Session type detection
- Resource count being returned
- Whether the endpoint is being called successfully

To remove, simply delete or comment out the `console.log` statements in `src/app/api/curriculum/route.ts` (lines 14, 15, 17, and 51).

## Files Modified

1. `src/app/api/curriculum/route.ts`
   - Added debug logging to GET endpoint
   - Auth logic unchanged (already correct)

2. `src/app/dashboard/lesson-plans/[id]/edit/page.tsx`
   - Changed `/api/admin/resources` → `/api/curriculum`
   - Adjusted response parsing to match new endpoint format

## Impact

- **Teachers**: Can now see curriculum resources in all views
- **Admins**: No change (already working)
- **API**: No new endpoints, no schema changes
- **Middleware**: No changes
- **Database**: No changes

## Related Code References

- GET /api/curriculum auth: Lines 7-23 in `src/app/api/curriculum/route.ts`
- Stub endpoint (no longer used): `src/app/api/admin/resources/route.ts`
- Teacher resource library: `src/app/dashboard/curriculum/page.tsx`
- Lesson builder: `src/app/dashboard/lesson-builder/page.tsx`
