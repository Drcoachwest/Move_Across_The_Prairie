const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find Coach Davis
    const teacher = await prisma.teacher.findUnique({
      where: { email: 'coach.davis@gpisd.org' },
      include: {
        classPeriods: true,
      },
    });

    console.log('Coach Davis record:');
    console.log(JSON.stringify(teacher, null, 2));

    if (!teacher) {
      console.log('❌ Coach Davis not found!');
      return;
    }

    // Check if he has schoolLevel set
    if (!teacher.schoolLevel) {
      console.log('❌ Coach Davis has no schoolLevel set! Updating to SECONDARY...');
      const updated = await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          schoolLevel: 'SECONDARY',
          department: 'PE',
        },
        include: {
          classPeriods: true,
        },
      });
      console.log('✅ Updated Coach Davis:');
      console.log(JSON.stringify(updated, null, 2));
    } else {
      console.log(`✅ Coach Davis already has schoolLevel: ${teacher.schoolLevel}`);
    }

    // Check class periods
    if (teacher.classPeriods && teacher.classPeriods.length > 0) {
      console.log(`✅ Coach Davis has ${teacher.classPeriods.length} class periods`);
    } else {
      console.log('⚠️ Coach Davis has no class periods!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
