# Teacher Signin Flow with Password Setup

## Overview
Implemented a two-phase authentication system for teachers:
1. **Initial Login**: Email + Activation Code
2. **Password Setup**: After first successful login, teachers create a password
3. **Future Logins**: Email + Password (no activation code needed)

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
Added `password` field to User model:
```prisma
password String? // bcrypt hash - null until user sets it
```

### 2. Password Utilities (`src/lib/password.ts`)
New file with password hashing functions:
- `hashPassword(password: string)` - Hash password using bcrypt
- `comparePassword(password: string, hash: string)` - Verify password

### 3. Teacher Signin Page (`src/app/auth/signin/page.tsx`)
Enhanced to:
- Check if user has already set a password (via `/api/auth/check-password`)
- Display activation code field for new users
- Display password field for returning users
- Show loading state while checking user status
- Auto-detect which authentication method to use

### 4. Set Password Page (`src/app/auth/set-password/page.tsx`)
New page that:
- Appears after first successful activation code login
- Requires 8+ character password
- Confirms password match
- Redirects to dashboard after successful password setup

### 5. Signin API Endpoint (`src/app/api/auth/signin/route.ts`)
Updated to handle:
- **New user with activation code**:
  - Verify activation code validity
  - Create new user record
  - Mark as activated
  - Increment code usage count
  - Return `needsPasswordSetup: true` flag
- **Existing user with password**:
  - Compare provided password with stored hash
  - Validate credentials
- **Error handling**: Validates both activation code and password scenarios

### 6. Check Password API (`src/app/api/auth/check-password/route.ts`)
New endpoint that:
- Accepts email address
- Returns whether user has already set a password
- Called from signin page to determine which form to display

### 7. Set Password API (`src/app/api/auth/set-password/route.ts`)
New endpoint that:
- Requires active session (teacher_session cookie)
- Validates password strength (min 8 characters)
- Hashes and stores password
- Returns success

## Authentication Flow

### First Time Teacher Login
```
1. Teacher enters email + activation code on signin page
2. Signin API:
   - Validates activation code
   - Creates user record
   - Increments code usage
   - Sets session cookie
   - Returns needsPasswordSetup: true
3. Frontend redirects to /auth/set-password
4. Teacher enters and confirms password
5. Set Password API:
   - Hashes password
   - Stores in database
   - Confirms success
6. Frontend redirects to /dashboard
```

### Returning Teacher Login
```
1. Teacher enters email on signin page
2. Check Password API confirms user has password
3. Signin page displays password field instead of activation code
4. Teacher enters password
5. Signin API:
   - Finds user by email
   - Compares password
   - Sets session cookie
   - Returns success
6. Frontend redirects to /dashboard
```

## Dependencies Added
- `bcryptjs` - Secure password hashing

## Session Management
- Session cookie: `teacher_session`
- Duration: 8 hours
- Security: httpOnly, sameSite=lax

## Validation Rules
- Email must end with `@gpisd.org`
- Activation code must exist and be active
- Activation code must not be expired
- Activation code must have uses remaining
- Password must be at least 8 characters
- Password must be confirmed correctly
