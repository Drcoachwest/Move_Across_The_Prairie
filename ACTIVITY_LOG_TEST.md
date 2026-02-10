# Activity Log Testing Guide

## What Was Added

1. **Admin Activity Logging System**
   - New API endpoint: `/api/admin/logs` (GET with pagination and filters)
   - New utility library: `src/lib/admin-logs.ts` for logging admin actions
   - New UI page: `/admin/logs` with filters and pagination

2. **Logged Actions**
   - `activation_code_create` - When admin generates activation codes
   - `curriculum_resource_create` - When admin uploads curriculum resources
   - `teacher_activate` - When admin activates a teacher
   - `teacher_deactivate` - When admin deactivates a teacher
   - `teacher_lock` - When admin locks a teacher account
   - `teacher_unlock` - When admin unlocks a teacher account
   - `teacher_resend_activation` - When admin resends activation email
   - `teacher_delete` - When admin deletes a teacher

3. **Log Details Include**
   - Action type
   - Admin email
   - Timestamp
   - IP address (if available)
   - User agent
   - Resource-specific details (emails, titles, IDs, etc.)

## Testing Steps

### 1. Login as Admin
- Navigate to: http://localhost:3000/auth/admin-login
- Username: `admin`
- Password: (check your .env file for ADMIN_PASSWORD)

### 2. Generate an Activation Code
- Go to: http://localhost:3000/admin/activation-codes
- Click "Generate Code"
- Set max uses to 1
- Click "Generate"
- **This creates a log entry**: `activation_code_create`

### 3. View Activity Logs
- Go to: http://localhost:3000/admin/logs
- You should see the activation code creation event
- Details will show: code, maxUses, IP, user agent, activation code ID

### 4. Create a Curriculum Resource
- Go to: http://localhost:3000/admin/curriculum
- Click "Create New Resource"
- Fill in title, type, band
- Click "Submit"
- **This creates a log entry**: `curriculum_resource_create`

### 5. Manage a Teacher (if you have teachers)
- Go to: http://localhost:3000/admin/users
- Lock/unlock or activate/deactivate a teacher
- **This creates log entries**: `teacher_lock`, `teacher_activate`, etc.

### 6. Test Filters in Activity Log
- Go back to: http://localhost:3000/admin/logs
- Try filtering by:
  - Action type (e.g., "activation_code_create")
  - Admin email (e.g., "admin")
  - Date range
  - Search details (e.g., teacher email)

### 7. Test Pagination
- If you have more than 20 log entries
- Click "Next" to see page 2
- Click "Previous" to go back

## Expected Results

✅ All admin actions are logged to the database
✅ Logs appear on `/admin/logs` page
✅ Filters work correctly
✅ Pagination works correctly
✅ Details are stored as JSON and displayed properly
✅ Timestamps show correct date/time
✅ No errors in console

## Database Check (Optional)

You can verify logs are being saved:
```bash
sqlite3 prisma/dev.db "SELECT * FROM admin_logs ORDER BY createdAt DESC LIMIT 5;"
```

## Troubleshooting

- **No logs showing**: Make sure you're logged in as admin
- **401 error**: Check admin session cookie
- **Empty details**: Check if JSON.stringify is working correctly
- **No pagination**: Check if total count is correct in API response

## Files Modified

1. `src/lib/admin-logs.ts` - New logging utility
2. `src/app/api/admin/logs/route.ts` - New logs API endpoint
3. `src/app/admin/logs/page.tsx` - New activity log UI
4. `src/app/api/admin/activation-codes/route.ts` - Added logging
5. `src/app/api/curriculum/route.ts` - Added logging
6. `src/app/api/admin/students/route.ts` - Added logging

All TypeScript compiles with no errors ✅
