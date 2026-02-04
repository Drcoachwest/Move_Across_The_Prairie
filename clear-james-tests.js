const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearJamesClassTests() {
  try {
    // Find all 5th grade students in Mrs. James' class
    const students = await prisma.student.findMany({
      where: {
        currentGrade: 5,
        classroomTeacher: {
          contains: 'James'
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classroomTeacher: true
      }
    });

    console.log(`Found ${students.length} students in 5th grade Mrs. James' class:`);
    students.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName} (${s.classroomTeacher})`);
    });

    if (students.length === 0) {
      console.log('\nNo students found. Exiting.');
      return;
    }

    const studentIds = students.map(s => s.id);

    // Delete all fitness tests for these students
    const result = await prisma.fitnesGramTest.deleteMany({
      where: {
        studentId: {
          in: studentIds
        }
      }
    });

    console.log(`\n✅ Deleted ${result.count} fitness test records.`);
    console.log('Mrs. James\' 5th grade class is now ready for fresh data entry.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearJamesClassTests();
