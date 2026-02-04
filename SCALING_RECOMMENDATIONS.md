# Scaling Recommendations for Production Deployment

**Status**: Future planning document  
**Created**: February 3, 2026  
**Target**: When ready to deploy to 35+ PE teachers district-wide

---

## Executive Summary

This app is currently built for a single teacher (~50 students) using SQLite. Before going live with 35 elementary PE teachers (estimated 12,250+ students), the following architectural changes are required.

---

## Phase 1: Database Migration (Required Before Production)

### Current State
- **Database**: SQLite (file-based, single-user)
- **Limitations**: 
  - Cannot handle concurrent users
  - Performance degrades with large datasets
  - No built-in backup/replication
  - Risk of data corruption with multiple simultaneous writes

### Recommended: PostgreSQL

**Why**: Professional-grade database designed for concurrent multi-user access and large datasets.

**Cost Options**:

| Option | Cost | Setup | Best For |
|--------|------|-------|----------|
| **Vercel Postgres** | $15/month (Hobby) | 3 clicks | Small districts, easiest |
| **Railway** | $5-20/month | 30 minutes | Budget-conscious, simple |
| **AWS RDS** | $15-100+/month | 1-2 hours | Enterprise, maximum control |
| **Self-Hosted VPS** | $5-10/month | 2-3 hours + ongoing maintenance | Technical teams, cost-sensitive |

**Recommendation**: Start with **Vercel Postgres Hobby tier ($15/month)**
- Easiest setup (same provider hosting app)
- Automatic daily backups
- Scales seamlessly as needed
- No server management

---

## Phase 2: Data Model Enhancements

### Add Classroom Model
```
Classroom
- id (string, primary key)
- teacherId (string, foreign key to Teacher)
- name (string) - "Period 1", "Grade 5 A", etc.
- gradeLevel (number) - 3, 4, 5, etc.
- school (string)
- createdAt (datetime)
- students (relationship)
- fitnessTests (relationship)
```

### Update Student Model
- Add `classroomId` (instead of just `teacherId`)
- Add database indexes on `teacherId`, `classroomId`, `email`
- Add `isActive` boolean (soft delete support)

### Update Teacher Model
- Add `schoolId` (future: multi-school support)
- Add `classrooms` relationship
- Add `isActive` boolean

---

## Phase 3: Authorization & Security

### Implement Teacher Role-Based Access
- Teachers can ONLY view/edit their own students and classrooms
- Add middleware to validate `teacher.id` matches data ownership
- Prevent cross-teacher data access

### Admin Portal Features
- Manage 35+ teacher accounts
- Bulk import students by classroom
- View district-wide reports
- Manage activation codes
- Monitor system health

### FERPA Compliance
- Audit logs for all student data access
- Encrypt sensitive data at rest
- Rate limiting on APIs
- SQL injection prevention (Prisma provides)

---

## Phase 4: Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_student_classroom_id ON Student(classroomId);
CREATE INDEX idx_student_teacher_id ON Student(teacherId);
CREATE INDEX idx_test_student_id ON FitnessTest(studentId);
CREATE INDEX idx_test_teacher_id ON FitnessTest(teacherId);
CREATE INDEX idx_test_created_date ON FitnessTest(createdAt);
```

### API Pagination
- Student lists: Load 50 per page
- Test history: Paginate by date
- Reports: Aggregate instead of returning raw rows
- Cache FitnessGram standards (read-only)

### Frontend Performance
- Search with 200ms debounce
- Lazy-load student details
- Virtualized lists for 300+ items
- Image optimization

---

## Phase 5: Bulk Import System

### CSV Import Features
- Upload student roster (350+ students)
- Map CSV columns to database fields
- Preview before confirming
- Bulk assign to classrooms
- Error reporting and rollback

### Example Import Workflow
1. Admin uploads CSV with 350 students
2. System shows column mapping UI
3. Preview data validation
4. Confirm and import to database
5. Generate report of imported students

---

## Phase 6: UI/UX for Multiple Teachers

### Assessment Page Updates
- Classroom selector dropdown (for teachers with multiple classes)
- Student search by name/ID (live search)
- Filter by grade level
- Pagination (50 students per page)
- Bulk test entry option

### Reports Enhancements
- Teacher-level reports (their students only)
- School-level reports (admin, all students in school)
- District-level reports (admin, all teachers/students)
- Export to CSV/Excel

### Dashboard Customization
- Show teacher's classrooms
- Quick access to recent students
- Test entry statistics
- Alerts for missing data

---

## Implementation Timeline (When Ready)

### Week 1: Database Migration
- [ ] Set up PostgreSQL (Vercel Postgres or Railway)
- [ ] Update `.env` with new DATABASE_URL
- [ ] Run Prisma migrations
- [ ] Test with existing data
- [ ] Verify all queries still work

### Week 2: Data Model Updates
- [ ] Add Classroom model to schema
- [ ] Update Student relationships
- [ ] Create database indexes
- [ ] Regenerate Prisma Client
- [ ] Update API routes

### Week 3: Authorization & Admin Portal
- [ ] Implement teacher-only data access middleware
- [ ] Create admin teacher management page
- [ ] Add bulk student import UI
- [ ] Add activation code management

### Week 4: Testing & Optimization
- [ ] Performance testing with 12,000+ students
- [ ] Load testing with concurrent users
- [ ] Security audit
- [ ] Documentation for admins
- [ ] Pilot with 3-5 teachers

---

## Cost Analysis (Annual)

| Item | Cost |
|------|------|
| PostgreSQL (Vercel) | $180/year (Hobby) → $1,200/year (Pro) |
| Vercel Hosting | $0-200/year (free tier to Pro) |
| **Total** | **$180-1,400/year** |

**For context**: Less than cost of 4 student textbooks per school.

---

## Recommended Next Steps

✅ **Continue development** with current SQLite setup  
✅ **Keep this document** for future reference  
✅ **Test with more teachers** (add 2-3 teachers to SQLite for testing)  
⏳ **Revisit when ready to deploy** to 35+ teachers  

---

## Questions to Answer Before Going Live

1. Will all 35 teachers log in simultaneously, or staggered?
2. Need single sign-on (SSO) with district systems?
3. Should students see their own data?
4. API integration with student information system (SIS)?
5. Mobile app needed?
6. Multi-school support in future?

---

## Contact for Future Implementation

When ready to scale to production:
- Refer back to this document
- Allocate ~20-30 hours for implementation
- Budget $15-20/month for database
- Plan 2-week pilot with small teacher group

---

**Last Updated**: February 3, 2026  
**Review Date**: When deploying to multiple teachers
