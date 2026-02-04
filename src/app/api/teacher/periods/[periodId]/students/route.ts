import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { periodId: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('teacher_session')?.value;

    if (!sessionCookie) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode the teacher info from session cookie
    const sessionData = JSON.parse(sessionCookie);
    const teacherId = sessionData.id;

    if (!teacherId) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Verify the period belongs to this teacher
    const period = await db.classPeriod.findFirst({
      where: {
        id: params.periodId,
        teacherId,
      },
    });

    if (!period) {
      return Response.json({ error: 'Period not found' }, { status: 404 });
    }

    // Get all students assigned to this period for current school year
    const assignments = await db.studentClassPeriodAssignment.findMany({
      where: {
        classPeriodId: params.periodId,
        schoolYear: period.schoolYear,
        dropDate: null, // Only active students
      },
      include: {
        student: true,
      },
    });

    const students = assignments.map(a => a.student);

    return Response.json({ students });
  } catch (error) {
    console.error('Error loading students:', error);
    return Response.json({ error: 'Failed to load students' }, { status: 500 });
  }
}
