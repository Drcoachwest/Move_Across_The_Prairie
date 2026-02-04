import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('teacher_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode session token to get teacher email
    const [email] = Buffer.from(sessionToken, 'base64').toString().split(':');

    // Get teacher from database
    const teacher = await prisma.teacher.findUnique({
      where: { email }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if already setup
    if (teacher.schoolLevel !== 'ELEMENTARY') {
      return NextResponse.json(
        { error: 'Already setup' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { schoolLevel, grade, department, periods } = body;

    if (!schoolLevel || !['ELEMENTARY', 'SECONDARY'].includes(schoolLevel)) {
      return NextResponse.json(
        { error: 'Invalid school level' },
        { status: 400 }
      );
    }

    // Update teacher with setup info
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        schoolLevel,
        grade: schoolLevel === 'ELEMENTARY' ? grade : null,
        department: schoolLevel === 'SECONDARY' ? department : null,
      }
    });

    // If secondary, create class periods
    if (schoolLevel === 'SECONDARY' && periods && Array.isArray(periods)) {
      const currentYear = new Date().getFullYear();
      const schoolYear = `${currentYear}-${currentYear + 1}`;

      for (const periodNum of periods) {
        await prisma.classPeriod.create({
          data: {
            teacherId: teacher.id,
            periodNumber: periodNum,
            schoolYear,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: updatedTeacher.id,
        email: updatedTeacher.email,
        name: updatedTeacher.name,
        school: updatedTeacher.school,
        schoolLevel: updatedTeacher.schoolLevel,
        grade: updatedTeacher.grade,
        department: updatedTeacher.department,
      }
    });
  } catch (error) {
    console.error('Teacher setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    );
  }
}
