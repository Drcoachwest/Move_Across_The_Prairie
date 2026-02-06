import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(_req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get('teacher_session')?.value;

    if (!teacherId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all class periods for this teacher
    const periods = await prisma.classPeriod.findMany({
      where: { teacherId },
      orderBy: { periodNumber: 'asc' },
      select: {
        id: true,
        periodNumber: true,
        schoolYear: true,
      },
    });

    return Response.json({ periods });
  } catch (error) {
    console.error('Error loading periods:', error);
    return Response.json({ error: 'Failed to load periods' }, { status: 500 });
  }
}
