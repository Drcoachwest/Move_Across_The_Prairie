# Admin Users Management - API Reference

## Overview
API endpoints for managing teacher accounts in the admin panel.

## Authentication
All endpoints require `admin_session` cookie. If missing or invalid, returns:
```json
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}
```

## Endpoints

### 1. Get All Teachers
Fetch list of registered teachers with optional search/filtering.

```
GET /api/admin/students
```

**Query Parameters:**
- `search` (optional): Filter by email, name, or school (case-insensitive)

**Example Requests:**
```bash
# Get all teachers
curl -X GET "http://localhost:3000/api/admin/students" \
  -H "Cookie: admin_session=..."

# Search by email
curl -X GET "http://localhost:3000/api/admin/students?search=john@example.com" \
  -H "Cookie: admin_session=..."

# Search by name
curl -X GET "http://localhost:3000/api/admin/students?search=Smith" \
  -H "Cookie: admin_session=..."

# Search by school
curl -X GET "http://localhost:3000/api/admin/students?search=Lincoln+High" \
  -H "Cookie: admin_session=..."
```

**Successful Response (200):**
```json
{
  "success": true,
  "teachers": [
    {
      "id": "clv1x9y3m000108jz5h9k9q9z",
      "email": "john.smith@example.com",
      "name": "John Smith",
      "school": "Lincoln High School",
      "activated": true,
      "activatedAt": "2024-01-15T14:30:00.000Z",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "locked": false
    },
    {
      "id": "clv1x9y3m000208jz5h9k9q9z",
      "email": "sarah.jones@example.com",
      "name": "Sarah Jones",
      "school": "Lincoln High School",
      "activated": false,
      "activatedAt": null,
      "createdAt": "2024-01-20T09:15:00.000Z",
      "locked": false
    }
  ]
}
```

**Response Fields:**
- `id` (string): Unique teacher identifier
- `email` (string): Teacher email (unique)
- `name` (string): Teacher full name
- `school` (string): School name
- `activated` (boolean): Whether account is activated
- `activatedAt` (string|null): ISO timestamp of activation
- `createdAt` (string): ISO timestamp of registration
- `locked` (boolean): Whether account is temporarily locked

---

### 2. Update Teacher Status
Modify teacher account properties (activate, deactivate, lock, unlock).

```
PATCH /api/admin/students
```

**Request Body:**
```json
{
  "email": "john.smith@example.com",
  "action": "activate"
}
```

**Actions Available:**

#### Action: `activate`
Activates an inactive teacher account.
- Sets `activated` = true
- Sets `activatedAt` = current timestamp
- Teacher can now log in

```bash
curl -X PATCH "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com",
    "action": "activate"
  }'
```

#### Action: `deactivate`
Deactivates an active teacher account (reversible).
- Sets `activated` = false
- Teacher cannot log in
- Account data is preserved
- Can be reactivated later

```bash
curl -X PATCH "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com",
    "action": "deactivate"
  }'
```

#### Action: `lock`
Temporarily locks a teacher account (different from deactivation).
- Sets `locked` = true
- Teacher cannot log in
- Used for security reasons or account suspensions
- Can be unlocked to restore access

```bash
curl -X PATCH "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com",
    "action": "lock"
  }'
```

#### Action: `unlock`
Removes temporary lock from a teacher account.
- Sets `locked` = false
- Teacher can log in again
- Restores full access

```bash
curl -X PATCH "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com",
    "action": "unlock"
  }'
```

#### Action: `resend-activation`
Triggers resend of activation email (placeholder - requires email service).
- Marks activation email as resent
- Teacher receives email with activation code
- Only relevant for inactive teachers

```bash
curl -X PATCH "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com",
    "action": "resend-activation"
  }'
```

**Successful Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**

Missing email or action (400):
```json
{
  "success": false,
  "message": "Missing email or action",
  "status": 400
}
```

Teacher not found (404):
```json
{
  "success": false,
  "message": "Teacher not found",
  "status": 404
}
```

Invalid action (400):
```json
{
  "success": false,
  "message": "Invalid action",
  "status": 400
}
```

Unauthorized (401):
```json
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}
```

---

### 3. Delete Teacher
Permanently delete a teacher account (irreversible).

```
DELETE /api/admin/students
```

**Request Body:**
```json
{
  "email": "john.smith@example.com"
}
```

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/students" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com"
  }'
```

**Successful Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**

Missing email (400):
```json
{
  "success": false,
  "message": "Missing email",
  "status": 400
}
```

Teacher not found (404):
```json
{
  "success": false,
  "message": "Teacher not found",
  "status": 404
}
```

Unauthorized (401):
```json
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}
```

⚠️ **WARNING**: This action is permanent and cannot be undone. The teacher record and all associated data is deleted from the database.

---

### 4. Send Password Reset Link
Initiate password reset process for a teacher.

```
POST /api/admin/reset-password
```

**Request Body:**
```json
{
  "email": "john.smith@example.com"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/admin/reset-password" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "email": "john.smith@example.com"
  }'
```

**Successful Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent"
}
```

**Current Behavior:**
- Currently a placeholder that returns success without sending email
- Requires email service integration for production use

**Future Implementation Will:**
- Generate secure reset token with expiration
- Store token in database
- Send email with reset link containing token
- Token should expire after 1 hour
- Validate token on reset page

**Error Responses:**

Missing email (400):
```json
{
  "success": false,
  "message": "Missing email",
  "status": 400
}
```

Teacher not found (404):
```json
{
  "success": false,
  "message": "Teacher not found",
  "status": 404
}
```

Unauthorized (401):
```json
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}
```

---

## Database Schema

### Teacher Model
```prisma
model Teacher {
  id                String     @id @default(cuid())
  email             String     @unique
  name              String
  school            String
  password          String     // bcrypt hash
  activated         Boolean    @default(false)
  activatedAt       DateTime?
  activationCodeUsed String?
  locked            Boolean    @default(false)  // NEW: Added for account locking
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  @@map("teachers")
}
```

---

## Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing parameters, invalid action |
| 401 | Unauthorized | Missing or invalid admin session |
| 404 | Not Found | Teacher email not in database |
| 500 | Server Error | Database error or unexpected issue |

---

## Common Workflows

### Complete Activation Workflow
```
1. GET /api/admin/students (find teacher with activated=false)
2. PATCH /api/admin/students (action: activate)
3. Teacher can now log in
```

### Password Reset Workflow
```
1. POST /api/admin/reset-password (send reset)
2. Teacher receives reset email
3. Teacher clicks link and sets new password
4. Teacher logs in with new password
```

### Security Lock Workflow
```
1. PATCH /api/admin/students (action: lock)
2. Teacher locked out, cannot log in
3. Investigation/resolution occurs
4. PATCH /api/admin/students (action: unlock)
5. Teacher can log in again
```

### Account Removal Workflow
```
1. GET /api/admin/students (find teacher)
2. DELETE /api/admin/students (delete teacher)
3. Teacher record permanently removed
4. Teacher cannot log in (email not in system)
```

---

## Rate Limiting
Currently no rate limiting implemented. Recommended for production:
- 100 requests per minute per admin session
- 10 password reset attempts per hour per email

---

## Logging
All admin actions are logged with:
- Admin user ID
- Action type (create, update, delete)
- Affected teacher email
- Timestamp
- Request IP address
- Result (success/failure)

Recommendation: Implement audit trail table in database.

---

## Future Enhancements

- [ ] Add bulk operations (activate/deactivate multiple)
- [ ] Add date range filtering
- [ ] Add activity log viewing
- [ ] Add 2FA requirement for sensitive actions
- [ ] Add email notification to teachers of account changes
- [ ] Add approval workflow for account changes
- [ ] Add role-based admin permissions
- [ ] Add API key authentication for external systems

---

## Migration Path

If integrating with external identity provider (Okta, Auth0, etc.):
1. Keep endpoint signatures the same
2. Sync with external provider in handlers
3. Maintain database records for audit trail
4. Update error handling for external service failures

---

**Last Updated**: January 30, 2024
**API Version**: 1.0
**Status**: Stable (with email feature as placeholder)
