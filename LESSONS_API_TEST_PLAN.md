# Lessons API - Authorization Test Plan

## Overview
Phase 2 Step 1 API-only implementation of lesson management with role-based access control.

**Authorization Rules:**
- ✅ 401: Not authenticated
- ✅ 403: Authenticated but not authorized
- ✅ 400: Validation error with `{error, field}`
- ✅ 200/201: Success

---

## Test Setup

### Prerequisites
1. Teacher account created with email `teacher1@gpisd.org`
2. Teacher account created with email `teacher2@gpisd.org`
3. Admin account with valid admin_session cookie
4. Development server running at `http://localhost:3000`

### Create Test Sessions
```bash
# Sign in as teacher1
curl -X POST http://localhost:3000/api/auth/teacher-signin \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@gpisd.org","password":"password123"}' \
  -c teacher1.txt

# Sign in as admin (if admin endpoint exists)
# For now, manually test with browser or add admin session cookie
```

---

## Test Cases

### 1. GET /api/lessons - List Lessons

#### 1.1 Unauthenticated Request
**Expected:** 401 Unauthorized
```bash
curl -X GET http://localhost:3000/api/lessons
```
**Response:**
```json
{
  "error": "Unauthorized. Please sign in to access lessons."
}
```

#### 1.2 Teacher Access - Own Lessons Only
**Expected:** 200 OK, returns only lessons where `createdByEmail = teacher1@gpisd.org`
```bash
curl -X GET http://localhost:3000/api/lessons \
  -b teacher1.txt
```
**Response:**
```json
{
  "lessons": [
    {
      "id": "cml5...",
      "title": "Warm-Up Activities",
      "band": "ELEMENTARY",
      "gradeGroup": "K-2",
      "unit": "Unit 1",
      "durationMinutes": 30,
      "objectives": "...",
      "createdByEmail": "teacher1@gpisd.org",
      "createdAt": "2026-02-09T...",
      "updatedAt": "2026-02-09T..."
    }
  ]
}
```

#### 1.3 Teacher with Query Filters
**Expected:** 200 OK, filters applied only to own lessons
```bash
curl -X GET "http://localhost:3000/api/lessons?band=ELEMENTARY&gradeGroup=3-5" \
  -b teacher1.txt
```

#### 1.4 Teacher Search Query
**Expected:** 200 OK, searches title/objectives/unit in own lessons only
```bash
curl -X GET "http://localhost:3000/api/lessons?q=warm" \
  -b teacher1.txt
```

#### 1.5 Admin Access - All Lessons
**Expected:** 200 OK, returns ALL lessons regardless of `createdByEmail`
```bash
curl -X GET http://localhost:3000/api/lessons \
  -b admin_session.txt
```
**Note:** Admin can also use query filters to narrow results
```bash
curl -X GET "http://localhost:3000/api/lessons?band=MIDDLE&q=basketball" \
  -b admin_session.txt
```

---

### 2. POST /api/lessons - Create Lesson

#### 2.1 Unauthenticated Request
**Expected:** 401 Unauthorized
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Lesson",
    "band":"ELEMENTARY",
    "gradeGroup":"3-5",
    "unit":"Unit 1",
    "durationMinutes":45,
    "objectives":"Learn basic skills",
    "warmUp":"5 min warm up",
    "mainActivity":"Practice main skills",
    "assessment":"Observation",
    "closure":"Cool down and reflect"
  }'
```
**Response:**
```json
{
  "error": "Unauthorized. Please sign in to create lessons."
}
```

#### 2.2 Teacher Creates Lesson
**Expected:** 201 Created, `createdByEmail` automatically set to `teacher1@gpisd.org`
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Locomotor Skills",
    "band":"ELEMENTARY",
    "gradeGroup":"K-2",
    "unit":"Unit 1: Movement",
    "durationMinutes":45,
    "objectives":"Students will demonstrate basic locomotor skills",
    "standards":"TEKS 110.21(a)(1)",
    "equipment":"cones, balls",
    "warmUp":"5-minute dynamic stretch",
    "mainActivity":"Practice walking, running, skipping, galloping",
    "modifications":"Provide slower tempo for struggling students",
    "assessment":"Observation checklist",
    "closure":"Cool down and reflection",
    "notes":"Weather was rainy, did indoors"
  }'
```
**Response:**
```json
{
  "success": true,
  "lesson": {
    "id": "cml5x9odg0000qz1234567890",
    "title": "Locomotor Skills",
    "band": "ELEMENTARY",
    "gradeGroup": "K-2",
    "unit": "Unit 1: Movement",
    "durationMinutes": 45,
    "objectives": "Students will demonstrate basic locomotor skills",
    "standards": "TEKS 110.21(a)(1)",
    "equipment": "cones, balls",
    "warmUp": "5-minute dynamic stretch",
    "mainActivity": "Practice walking, running, skipping, galloping",
    "modifications": "Provide slower tempo for struggling students",
    "assessment": "Observation checklist",
    "closure": "Cool down and reflection",
    "notes": "Weather was rainy, did indoors",
    "createdByEmail": "teacher1@gpisd.org",
    "createdAt": "2026-02-09T10:00:00.000Z",
    "updatedAt": "2026-02-09T10:00:00.000Z"
  }
}
```

#### 2.3 Validation Error - Missing Required Field
**Expected:** 400 Bad Request with `{error, field}`
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Incomplete Lesson",
    "band":"ELEMENTARY",
    "gradeGroup":"3-5",
    "unit":"Unit 1",
    "durationMinutes":45
    # Missing: objectives, warmUp, mainActivity, assessment, closure
  }'
```
**Response:**
```json
{
  "error": "Objectives are required",
  "field": "objectives"
}
```

#### 2.4 Validation Error - Invalid Band
**Expected:** 400 Bad Request with field
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Test",
    "band":"INVALID",
    "gradeGroup":"3-5",
    "unit":"Unit 1",
    "durationMinutes":45,
    "objectives":"...",
    "warmUp":"...",
    "mainActivity":"...",
    "assessment":"...",
    "closure":"..."
  }'
```
**Response:**
```json
{
  "error": "Band must be one of: ELEMENTARY, MIDDLE, HIGH",
  "field": "band"
}
```

#### 2.5 Validation Error - Invalid Duration
**Expected:** 400 Bad Request
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Test",
    "band":"ELEMENTARY",
    "gradeGroup":"3-5",
    "unit":"Unit 1",
    "durationMinutes":5,
    "objectives":"...",
    "warmUp":"...",
    "mainActivity":"...",
    "assessment":"...",
    "closure":"..."
  }'
```
**Response:**
```json
{
  "error": "Duration must be a number between 10 and 180 minutes",
  "field": "durationMinutes"
}
```

#### 2.6 Admin Creates Lesson
**Expected:** 201 Created, `createdByEmail` set to `admin`
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b admin_session.txt \
  -d '{"title":"Admin Lesson",...}'
```

#### 2.7 Client Cannot Override createdByEmail
**Expected:** 201 Created, `createdByEmail` always from session, never from request body
```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Malicious Lesson",
    "createdByEmail":"teacher2@gpisd.org",
    ...all required fields...
  }'
```
**Response:** Lesson created with `createdByEmail: "teacher1@gpisd.org"` (request value ignored)

---

### 3. GET /api/lessons/[id] - Fetch Single Lesson

#### 3.1 Unauthenticated Request
**Expected:** 401 Unauthorized
```bash
curl -X GET http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890
```

#### 3.2 Teacher Accesses Own Lesson
**Expected:** 200 OK
```bash
curl -X GET http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b teacher1.txt
```
**Response:**
```json
{
  "lesson": {
    "id": "cml5x9odg0000qz1234567890",
    "title": "Locomotor Skills",
    ...full lesson data...
  }
}
```

#### 3.3 Teacher Tries to Access Another Teacher's Lesson
**Expected:** 403 Forbidden
```bash
# Lesson created by teacher1, accessed by teacher2
curl -X GET http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b teacher2.txt
```
**Response:**
```json
{
  "error": "Forbidden. You can only access your own lessons."
}
```

#### 3.4 Admin Accesses Any Lesson
**Expected:** 200 OK (regardless of who created it)
```bash
curl -X GET http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b admin_session.txt
```

#### 3.5 Lesson Not Found
**Expected:** 404 Not Found
```bash
curl -X GET http://localhost:3000/api/lessons/nonexistent123 \
  -b teacher1.txt
```
**Response:**
```json
{
  "error": "Lesson not found"
}
```

---

### 4. PUT /api/lessons/[id] - Update Lesson

#### 4.1 Unauthenticated Request
**Expected:** 401 Unauthorized
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
```

#### 4.2 Teacher Updates Own Lesson
**Expected:** 200 OK, returns updated lesson
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{
    "title":"Updated Locomotor Skills",
    "durationMinutes":50,
    "notes":"Updated notes"
  }'
```
**Response:**
```json
{
  "success": true,
  "lesson": {
    "id": "cml5x9odg0000qz1234567890",
    "title": "Updated Locomotor Skills",
    "durationMinutes": 50,
    "notes": "Updated notes",
    ...other unchanged fields...
  }
}
```

#### 4.3 Teacher Tries to Update Another Teacher's Lesson
**Expected:** 403 Forbidden
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -b teacher2.txt \
  -d '{"title":"Hacked"}'
```
**Response:**
```json
{
  "error": "Forbidden. You can only update your own lessons."
}
```

#### 4.4 Admin Updates Any Lesson
**Expected:** 200 OK
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -b admin_session.txt \
  -d '{"title":"Admin Updated"}'
```

#### 4.5 Partial Update (Only Update Some Fields)
**Expected:** 200 OK, other fields unchanged
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{"title":"New Title Only"}'
```
**Response:**
```json
{
  "success": true,
  "lesson": {
    "title": "New Title Only",
    ...all other fields from original lesson...
  }
}
```

#### 4.6 Validation Error on Update
**Expected:** 400 Bad Request if invalid data provided
```bash
curl -X PUT http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -H "Content-Type: application/json" \
  -b teacher1.txt \
  -d '{"band":"INVALID"}'
```
**Response:**
```json
{
  "error": "Band must be one of: ELEMENTARY, MIDDLE, HIGH",
  "field": "band"
}
```

---

### 5. DELETE /api/lessons/[id] - Delete Lesson

#### 5.1 Unauthenticated Request
**Expected:** 401 Unauthorized
```bash
curl -X DELETE http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890
```

#### 5.2 Teacher Deletes Own Lesson
**Expected:** 200 OK
```bash
curl -X DELETE http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b teacher1.txt
```
**Response:**
```json
{
  "success": true,
  "message": "Lesson deleted successfully"
}
```

#### 5.3 Teacher Tries to Delete Another Teacher's Lesson
**Expected:** 403 Forbidden
```bash
curl -X DELETE http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b teacher2.txt
```
**Response:**
```json
{
  "error": "Forbidden. You can only delete your own lessons."
}
```

#### 5.4 Admin Deletes Any Lesson
**Expected:** 200 OK
```bash
curl -X DELETE http://localhost:3000/api/lessons/cml5x9odg0000qz1234567890 \
  -b admin_session.txt
```

#### 5.5 Delete Nonexistent Lesson
**Expected:** 404 Not Found
```bash
curl -X DELETE http://localhost:3000/api/lessons/nonexistent123 \
  -b teacher1.txt
```
**Response:**
```json
{
  "error": "Lesson not found"
}
```

---

## Summary of Authorization Rules

| Endpoint | Method | Unauthenticated | Teacher Own | Teacher Other | Admin | Response |
|----------|--------|-----------------|-------------|---------------|-------|----------|
| /api/lessons | GET | 401 | ✅ Own only | N/A | ✅ All | Filtered list |
| /api/lessons | POST | 401 | ✅ As owner | N/A | ✅ As admin | Created (201) |
| /api/lessons/[id] | GET | 401 | ✅ Own | 403 | ✅ Any | Single lesson |
| /api/lessons/[id] | PUT | 401 | ✅ Own | 403 | ✅ Any | Updated lesson |
| /api/lessons/[id] | DELETE | 401 | ✅ Own | 403 | ✅ Any | Success |

---

## Browser-Based Testing

For interactive testing without curl, open browser DevTools Console and use fetch:

```javascript
// Teacher: Create lesson
const response = await fetch('/api/lessons', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Lesson',
    band: 'ELEMENTARY',
    gradeGroup: '3-5',
    unit: 'Unit 1',
    durationMinutes: 45,
    objectives: 'Learn skills',
    warmUp: 'Warm up',
    mainActivity: 'Practice',
    assessment: 'Observe',
    closure: 'Cool down'
  })
});
const data = await response.json();
console.log(data);

// Get all lessons
const res = await fetch('/api/lessons');
const lessons = await res.json();
console.log(lessons);

// Get specific lesson
const res = await fetch('/api/lessons/cml5x9odg0000...');
const lesson = await res.json();
console.log(lesson);
```

---

## Implementation Status

✅ **All requirements implemented:**
- ✅ 401 for unauthenticated access
- ✅ 403 for unauthorized access (teacher accessing another's lesson)
- ✅ 400 with {error, field} for validation errors
- ✅ Teachers: CRUD own lessons only
- ✅ Admins: CRUD any lesson
- ✅ POST always sets `createdByEmail` from session (never client)
- ✅ Query params supported on GET /api/lessons (band, gradeGroup, unit, q)
- ✅ Partial updates on PUT (only provided fields)
