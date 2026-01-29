# Code Cleanup Summary

## Status: Code Commented Out (Phase 1)
All unnecessary code has been commented out. Run the app to verify nothing is broken, then we can delete the unused code.

## Items Commented Out

### 1. Debug Console Logs (Production Code)
Commented out `console.log()` statements in the following files:
- `src/app/auth/admin-login/page.tsx` - 4 console.log statements
- `src/app/api/admin/resources/route.ts` - 1 console.log statement  
- `src/app/dashboard/lesson-plans/[id]/page.tsx` - 2 console.log statements
- `src/app/api/lessons/[id]/route.ts` - 2 console.log statements

**Note**: `console.error()` statements were left intact as they're useful for debugging production errors.

### 2. TODO Comments with Missing Implementation
Commented and noted in `src/app/api/admin/resources/route.ts`:
- `// TODO: Save file if uploaded`
- `// TODO: Save resource to database`
- **Status**: This endpoint is stubbed - implementation not started

### 3. Deprecated Pages

#### `/auth/signin` (Page & API)
- **Status**: DEPRECATED - Teachers now use `/auth/teacher-signin`
- **Impact**: Main page (`src/app/page.tsx`) already directs to `/auth/teacher-signin`
- **Location**: 
  - `src/app/auth/signin/page.tsx`
  - `src/app/api/auth/signin/route.ts`
- **Action**: Can be deleted after verifying it's not used elsewhere

## Tests Completed

### Before Changes:
- Application builds without errors
- All authentication flows working
- Teacher assessment page functional

### Changes Made:
- Commented out 9 debug console.log statements
- Added DEPRECATED notices to old signin endpoints
- Added notes to unimplemented resource endpoints

## Next Steps (After Verification)

Once you've confirmed the app still works properly with these changes commented out:

1. **Delete deprecated pages**:
   - `src/app/auth/signin/page.tsx`
   - `src/app/api/auth/signin/route.ts`
   - Remove references from documentation files

2. **Delete stub API endpoints** (if not planned for future use):
   - `src/app/api/admin/resources/route.ts` - This endpoint isn't used anywhere

3. **Remove debug imports** (if any become unused):
   - Check if `console` object needs to be imported anywhere after deletion

4. **Update documentation**:
   - Review README.md and other docs for outdated endpoints
   - Update any developer guides

## Files Needing Attention

### Safe to Delete:
- `src/app/auth/signin/page.tsx` - Replaced by `/auth/teacher-signin`
- `src/app/api/auth/signin/route.ts` - Replaced by `/api/auth/teacher-signin`

### Likely Unused:
- `src/app/api/admin/resources/route.ts` - Stubbed implementation, no references in codebase

### Keep As-Is:
- All error logging (`console.error`)
- All active API endpoints
- All active pages

## Verification Checklist

- [ ] Application starts without errors
- [ ] Home page loads and sign-in button works
- [ ] Teacher signin flow works (email → password)
- [ ] Admin login works
- [ ] Teacher dashboard loads
- [ ] FitnessGram assessment page loads
- [ ] Assessment filtering works
- [ ] Test data entry works
- [ ] Class summary shows correct data
