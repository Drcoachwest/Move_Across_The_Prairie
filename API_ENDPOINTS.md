# Authentication API Endpoints

## POST `/api/auth/signin`

### Request
```json
{
  "email": "teacher@gpisd.org",
  // One of:
  "activationCode": "ABC123",  // for first login
  // OR
  "password": "myPassword123"    // for returning users
}
```

### Response - Success (New User)
```json
{
  "success": true,
  "message": "Sign in successful",
  "needsPasswordSetup": true,
  "user": {
    "id": "user-id",
    "email": "teacher@gpisd.org"
  }
}
```

### Response - Success (Returning User)
```json
{
  "success": true,
  "message": "Sign in successful",
  "user": {
    "id": "user-id",
    "email": "teacher@gpisd.org"
  }
}
```

### Response - Error
```json
{
  "success": false,
  "message": "Invalid or expired activation code"
}
```

### Status Codes
- `200` - Success
- `400` - Invalid email format, activation code, or credentials
- `500` - Server error

---

## POST `/api/auth/check-password`

### Purpose
Check if a user has already set a password (called by signin form to determine which field to display)

### Request
```json
{
  "email": "teacher@gpisd.org"
}
```

### Response
```json
{
  "success": true,
  "hasPassword": false  // or true if user has set password
}
```

---

## POST `/api/auth/set-password`

### Purpose
Set password for a new user after initial activation code login

### Request
```json
{
  "password": "myNewPassword123"
}
```

### Response
```json
{
  "success": true,
  "message": "Password set successfully",
  "user": {
    "id": "user-id",
    "email": "teacher@gpisd.org"
  }
}
```

### Status Codes
- `200` - Success
- `400` - Password too short (must be 8+ characters)
- `401` - Not authenticated (no session cookie)
- `500` - Server error

---

## POST `/api/auth/signout`

### Request
No body required

### Response
Redirects to `/` with session cookie cleared

---

## Database Schema (User)

```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  name      String?
  password  String?    // bcrypt hash - null until user sets it
  activated Boolean    @default(false)
  activatedAt DateTime?
  activationCodeUsed String? // code that was used to activate
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  lessonPlans LessonPlan[]
}
```

## Password Security
- Passwords are hashed using bcryptjs with salt rounds = 10
- Only hashed passwords are stored in database
- Comparison is done using bcrypt's constant-time comparison
