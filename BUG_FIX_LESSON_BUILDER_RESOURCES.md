# Bug Fix: Lesson Builder Cannot Display Curriculum Resources

## Issue
Teachers viewing the lesson builder at `/dashboard/lesson-builder` see the resource attachment panel with filters, but it always shows "No resources match your filters." even though admin has created resources.

## Root Cause
**File**: `src/app/dashboard/lesson-builder/page.tsx`, line 106

The component was incorrectly accessing the API response:
```typescript
setAllResources(data.curriculum || []);  // ❌ WRONG - API returns `data.resources`
```

The `/api/curriculum` endpoint returns `{ resources: [...] }` but the code was looking for `data.curriculum`, which doesn't exist, so resources were never loaded.

## Solution
Changed lines 103-106 to correctly extract resources from the API response:

```diff
- const curriculumUnits: string[] = Array.from(
-   new Set((data.curriculum || data.resources || []).map((item: any) => item.unit).filter(Boolean))
- );
- setUnits(curriculumUnits.sort());
- setAllResources(data.curriculum || []);

+ const resources = data.resources || [];
+ const curriculumUnits: string[] = Array.from(
+   new Set(resources.map((item: any) => item.unit).filter(Boolean))
+ );
+ setUnits(curriculumUnits.sort());
+ setAllResources(resources);
```

## Impact
- ✅ Teachers now see curriculum resources in lesson builder resource picker
- ✅ Filters (Level, Grade, Unit, Search) now work correctly
- ✅ Resource selection checkbox works as expected
- ✅ Resources saved with lesson

## Files Modified
- `src/app/dashboard/lesson-builder/page.tsx` - Fixed resource loading

## Testing
1. Login as admin
2. Create a resource: `/admin/curriculum` → "Create New Resource" → Fill and submit
3. Logout, login as teacher
4. Go to `/dashboard/lesson-builder`
5. Click "+ Add Resources" button
6. **Expected**: See the resource created by admin in the list
7. **Filter test**: Try filtering by Level, Grade, Unit - should work

## Success Criteria
✅ Resources display in the lesson builder resource picker
✅ Filters work correctly (no empty results when resources exist)
✅ Checkboxes allow selection
✅ Resources can be saved with lesson

## Related Files
- `src/app/api/curriculum/route.ts` - API endpoint (returns `{resources: [...]}`)
- `src/app/dashboard/curriculum/page.tsx` - Teacher library (already working)
- `src/app/dashboard/lesson-plans/[id]/edit/page.tsx` - Lesson plan edit (already fixed in previous update)
