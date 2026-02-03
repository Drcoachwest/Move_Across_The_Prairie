# Admin Users Management - Quick Start Guide

## Accessing Admin Users Page
Navigate to: `/admin/users`

**Requirements:**
- Admin session authenticated via `/auth/admin-login`
- Admin must have valid `admin_session` cookie

## Features Overview

### 1. View All Teachers
The page loads automatically and displays all registered teachers in a paginated table (10 per page).

**Columns Displayed:**
- Email
- Name
- School
- Status (Active/Inactive with color badges)
- Registration Date
- Manage Actions

### 2. Search Teachers
Use the search box to find teachers by:
- Email address
- Full name
- School name

Search is **real-time** and case-insensitive.

### 3. Sort Teachers
Use the sort dropdown to organize by:
- **Created (Newest)** - Most recently registered first (default)
- **Name (A-Z)** - Alphabetical by last name
- **Email (A-Z)** - Alphabetical by email
- **Status** - Active teachers first

### 4. Pagination
- 10 teachers displayed per page
- Use Previous/Next buttons to navigate
- Click numbered page buttons for direct navigation
- Shows current viewing range (e.g., "Showing 1-10 of 45")

### 5. Manage Individual Teacher

Click the **"Manage"** button on any teacher row to open the profile modal.

#### Profile Modal Shows:
- Email address
- Name
- School
- Account status (Active/Inactive in green/yellow)
- Registration date and time
- Activation date (if activated)
- Lock status warning (if locked)

#### Available Actions:

**Send Password Reset Link**
- Allows admin to initiate password reset for teacher
- Opens separate modal for email confirmation
- Teacher receives reset email with instructions

**Activate Account** (if currently inactive)
- Makes the account active
- Teacher can log in
- Sets activation timestamp

**Deactivate Account** (if currently active)
- Prevents teacher from logging in
- Account data preserved
- Can be reactivated later
- Requires confirmation

**Lock Account** (if currently unlocked)
- Temporary restriction without data deletion
- Teacher cannot log in
- Different from deactivation (doesn't change activated status)
- Can be unlocked without recovery process

**Unlock Account** (if currently locked)
- Removes temporary restriction
- Teacher can log in again
- Restores full access

**Resend Activation Email** (if inactive)
- Sends activation email again
- Useful if teacher lost original email
- Only available for non-activated teachers

**Delete Teacher**
- **PERMANENT ACTION** - Cannot be undone
- Removes all teacher data from system
- Requires confirmation popup
- Only use when absolutely necessary

### 6. Reset Password (Separate Modal)

**How to Use:**
1. Click "Reset Password" button (top right) OR
2. Click "Send Password Reset Link" in teacher profile modal

**Process:**
1. Enter teacher's email address
2. Click "Send Reset Link"
3. Admin receives confirmation message
4. Teacher receives password reset email

## Status Message Display

Messages appear at the top of the page in a green banner:
- ✓ Shows action success
- ✗ Shows action failures with error details
- Click the ✕ button to dismiss

## Keyboard Shortcuts
- Click outside modals to close them (clicking backdrop)
- Click ✕ button in modal to close
- Use Tab to navigate form inputs

## Common Workflows

### Workflow 1: Activate New Teacher
1. Find teacher in list (may need to search)
2. Click "Manage"
3. Click "Activate Account"
4. Status updates to Active (green badge)

### Workflow 2: Reset Forgotten Password
1. Click "Reset Password" button (top right)
2. Enter teacher email
3. Click "Send Reset Link"
4. Confirmation message appears
5. Teacher receives email with reset instructions

### Workflow 3: Lock Account (Temporary)
1. Find teacher with suspicious activity
2. Click "Manage"
3. Click "Lock Account"
4. Account shows "Locked" red badge
5. Teacher cannot log in
6. When ready to restore, click "Unlock Account"

### Workflow 4: Remove Inactive Teacher
1. Search for inactive teacher (optional)
2. Click "Manage"
3. Scroll to bottom of modal
4. Click "Delete Teacher"
5. Confirm deletion in popup
6. Teacher permanently removed from system

### Workflow 5: Bulk Status Management
1. Use search to find teachers (e.g., all from one school)
2. Click "Manage" on each
3. Perform action (activate, deactivate, etc.)
4. Messages confirm each action

## Data Shown

| Field | Source | Format |
|-------|--------|--------|
| Email | Teacher account | Unique identifier |
| Name | Teacher profile | First and last name |
| School | Teacher profile | School name |
| Status | Database | Active/Inactive |
| Registered | Creation timestamp | Date only (MM/DD/YYYY) |
| Last Login | (not shown) | Reserved for future |
| Locked | Database | Yes/No with badge |
| Activated Date | Activation timestamp | Date and time |

## API Endpoints Used

### Get Teachers
- **Endpoint**: `GET /api/admin/students`
- **Response**: List of all teachers with details

### Update Teacher Status
- **Endpoint**: `PATCH /api/admin/students`
- **Actions**: 
  - `activate` - Activate account
  - `deactivate` - Deactivate account
  - `lock` - Lock account
  - `unlock` - Unlock account
  - `resend-activation` - Resend activation email

### Delete Teacher
- **Endpoint**: `DELETE /api/admin/students`
- **Result**: Teacher permanently removed

### Send Password Reset
- **Endpoint**: `POST /api/admin/reset-password`
- **Data**: Email address
- **Result**: Reset email sent (when configured)

## Troubleshooting

### Problem: Page Shows "Loading teachers..." Indefinitely
- **Check**: Admin session is valid
- **Check**: Network connection is working
- **Solution**: Refresh the page or log back in

### Problem: Can't Find Teacher with Search
- **Check**: Correct spelling of search term
- **Note**: Search is case-insensitive
- **Try**: Search by different field (email vs. name vs. school)

### Problem: Action Button Does Nothing
- **Check**: You have admin access
- **Check**: Teacher email is correct
- **Solution**: Refresh page and try again

### Problem: Modal Won't Close
- **Solution 1**: Click the ✕ button in top right of modal
- **Solution 2**: Click outside the modal on the dark overlay
- **Solution 3**: Refresh the page

### Problem: Status Message Doesn't Appear
- **Check**: Message may have auto-dismissed (5 seconds)
- **Solution**: Perform action again to see message
- **Note**: Some actions may not show message if already in that state

## Important Notes

⚠️ **Destructive Actions:**
- Deleting a teacher is **permanent** and cannot be undone
- Always confirm before clicking delete
- Deactivation can be reversed (just reactivate)
- Locking is a temporary restriction (can unlock)

⚠️ **Account States:**
- **Active**: Teacher can log in, full access
- **Inactive**: Teacher cannot log in, account preserved
- **Locked**: Teacher cannot log in, temporary restriction (different UI state)

📝 **Password Resets:**
- Admin initiates reset, teacher receives email
- Actual email functionality requires email service configuration
- In development, check application logs for reset codes

🔒 **Permissions:**
- Only admins can access this page
- Non-admin users automatically redirected to signin
- All actions logged (via admin audit system if configured)

## Performance Notes

- Page loads up to 1000 teachers efficiently
- Search happens client-side (after initial load)
- Pagination limits to 10 per page for UI performance
- Sorting done on loaded data (no additional API calls)

## Next Steps After Implementation

1. **Configure Email Service**: Set up email sending for password resets
2. **Add Audit Logging**: Track all admin actions on teacher accounts
3. **User Testing**: Have admins test workflows
4. **Documentation**: Update admin manual with new features
5. **Monitor**: Watch for any errors in logs during initial use
