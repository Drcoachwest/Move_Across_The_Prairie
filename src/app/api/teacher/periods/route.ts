import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('teacher_session')?.value;

    if (!sessionCookie) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode the teacher info from session cookie (assuming it's stored as JSON)
    const sessionData = JSON.parse(sessionCookie);
    const teacherId = sessionData.id;

    if (!teacherId) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get all class periods for this teacher
    const periods = await db.classPeriod.findMany({
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
