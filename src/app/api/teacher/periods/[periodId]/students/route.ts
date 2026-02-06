import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get('teacher_session')?.value;

    if (!teacherId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { periodId } = await params;

    // Verify the period belongs to this teacher
    const period = await prisma.classPeriod.findFirst({
      where: {
        id: periodId,
        teacherId,
      },
    });

    if (!period) {
      return Response.json({ error: 'Period not found' }, { status: 404 });
    }

    // Get all students assigned to this period for current school year
    const assignments = await prisma.studentClassPeriodAssignment.findMany({
      where: {
        classPeriodId: periodId,
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
