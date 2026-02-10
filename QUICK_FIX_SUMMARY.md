# Quick Fix Summary: Curriculum Resource Access

## The Problem
Teachers could not see curriculum resources in:
- `/dashboard/curriculum` resource library
- `/dashboard/lesson-plans/[id]/edit` resource picker
- Lesson builder resource selector

Admins could see resources in `/admin/curriculum`.

## Root Cause (ONE LINE)
`src/app/dashboard/lesson-plans/[id]/edit/page.tsx` was calling `/api/admin/resources` (a stub endpoint that returns `[]`) instead of `/api/curriculum` (the real endpoint with database query).

## The Fix (TWO CHANGES)

### Change 1: Fix the Endpoint
**File**: `src/app/dashboard/lesson-plans/[id]/edit/page.tsx`, line 63

```diff
- const response = await fetch("/api/admin/resources");
+ const response = await fetch("/api/curriculum");
```

Also updated response parsing to match endpoint format:
```diff
- if (data.success) { setResources(data.resources); }
+ if (data.resources) { setResources(data.resources.map((r: any) => ({ id: r.id, title: r.title, type: r.type }))); }
```

### Change 2: Add Debug Logging
**File**: `src/app/api/curriculum/route.ts`

Added session type detection (helps verify the fix):
```typescript
const sessionType = adminSession ? "admin" : teacherSession ? "teacher" : "none";
console.log(`[GET /api/curriculum] Session type: ${sessionType}`);
```

Added resource count logging:
```typescript
console.log(`[GET /api/curriculum] Returning ${resources.length} resources to ${sessionType} user`);
```

## Why This Works

The `/api/curriculum` endpoint already had the correct auth logic:
```typescript
if (!teacherSession && !adminSession) {
  return 401;
}
```

So teachers could access it all along—they just weren't calling it! The lesson-plans edit page was the only place still using the wrong endpoint.

## Endpoints Summary

| Endpoint | Purpose | Auth | Response |
|----------|---------|------|----------|
| `GET /api/curriculum` | Fetch resources | teacher OR admin | `{resources: [...]}` |
| `GET /api/admin/resources` | STUB (old) | none | `{resources: []}` (empty) |
| `POST /api/curriculum` | Create resource | admin only | `{success: true, resource}` |

## Testing

1. **As Admin**: Create a test resource in `/admin/curriculum`
2. **As Teacher**: Go to `/dashboard/curriculum` → Should see it
3. **As Teacher**: Edit lesson in `/dashboard/lesson-plans/[id]/edit` → Resource picker should show it
4. **Server logs**: Should show `[GET /api/curriculum] Session type: teacher`

## Impact
- ✅ Teachers now see curriculum resources everywhere
- ✅ No database changes
- ✅ No auth logic changes (already correct)
- ✅ No API changes (just routing to existing endpoint)
- ✅ No middleware changes

## Files Modified
1. `src/app/api/curriculum/route.ts` - Added debug logging only
2. `src/app/dashboard/lesson-plans/[id]/edit/page.tsx` - Fixed endpoint call

## What NOT to Change
- Prisma schema (unnecessary)
- Middleware routing (unnecessary, already correct)
- POST/PUT/DELETE auth (already correct)
- Admin pages (working fine)
