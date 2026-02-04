const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating secondary school teacher...');

  // Create secondary teacher
  const secondaryTeacher = await prisma.teacher.create({
    data: {
      email: 'coach.davis@gpisd.org',
      name: 'Coach Marcus Davis',
      school: 'Jefferson High School',
      password: await bcrypt.hash('TestPassword123!', 10),
      activated: true,
      schoolLevel: 'SECONDARY',
      department: 'PE',
    }
  });

  console.log(`✓ Created secondary teacher: ${secondaryTeacher.name}`);

  // Create class periods for secondary teacher
  const currentYear = new Date().getFullYear();
  const schoolYear = `${currentYear}-${currentYear + 1}`;
  
  const periods = [1, 2, 3, 4];
  const classPeriods = [];

  for (const periodNum of periods) {
    const period = await prisma.classPeriod.create({
      data: {
        teacherId: secondaryTeacher.id,
        periodNumber: periodNum,
        schoolYear,
      }
    });
    classPeriods.push(period);
    console.log(`✓ Created Period ${periodNum}`);
  }

  // Create secondary students
  const secondaryStudents = [
    { firstName: 'Justin', lastName: 'Martinez', sex: 'M', dateOfBirth: new Date('2008-05-15') },
    { firstName: 'Sofia', lastName: 'Garcia', sex: 'F', dateOfBirth: new Date('2008-08-22') },
    { firstName: 'Aiden', lastName: 'Thompson', sex: 'M', dateOfBirth: new Date('2008-03-10') },
    { firstName: 'Emma', lastName: 'Anderson', sex: 'F', dateOfBirth: new Date('2008-11-05') },
    { firstName: 'Lucas', lastName: 'Taylor', sex: 'M', dateOfBirth: new Date('2008-07-18') },
    { firstName: 'Olivia', lastName: 'White', sex: 'F', dateOfBirth: new Date('2008-02-14') },
    { firstName: 'Mason', lastName: 'Lee', sex: 'M', dateOfBirth: new Date('2008-09-27') },
    { firstName: 'Ava', lastName: 'Harris', sex: 'F', dateOfBirth: new Date('2008-06-09') },
    { firstName: 'Ethan', lastName: 'Clark', sex: 'M', dateOfBirth: new Date('2008-10-31') },
    { firstName: 'Mia', lastName: 'Lewis', sex: 'F', dateOfBirth: new Date('2008-01-16') },
    { firstName: 'Logan', lastName: 'Walker', sex: 'M', dateOfBirth: new Date('2008-04-23') },
    { firstName: 'Isabella', lastName: 'Hall', sex: 'F', dateOfBirth: new Date('2008-12-08') },
  ];

  const createdStudents = [];
  for (const student of secondaryStudents) {
    const created = await prisma.student.create({
      data: {
        districtId: `JHS-${createdStudents.length + 1}`,
        firstName: student.firstName,
        lastName: student.lastName,
        sex: student.sex,
        dateOfBirth: student.dateOfBirth,
        currentGrade: 9,
        currentSchool: 'Jefferson High School',
        peTeacher: 'Coach Marcus Davis',
      }
    });
    createdStudents.push(created);
    console.log(`✓ Created student: ${student.firstName} ${student.lastName}`);
  }

  // Assign students to class periods (3 students per period)
  for (let i = 0; i < classPeriods.length; i++) {
    const period = classPeriods[i];
    const startIdx = i * 3;
    const periodStudents = createdStudents.slice(startIdx, startIdx + 3);

    for (const student of periodStudents) {
      await prisma.studentClassPeriodAssignment.create({
        data: {
          studentId: student.id,
          classPeriodId: period.id,
          schoolYear,
        }
      });
    }
    console.log(`✓ Assigned 3 students to Period ${period.periodNumber}`);
  }

  console.log('\n✅ Secondary school seed data created successfully!');
  console.log(`\nTeacher: ${secondaryTeacher.email} / Password: TestPassword123!`);
  console.log(`School: ${secondaryTeacher.school}`);
  console.log(`Periods: ${periods.join(', ')}`);
  console.log(`Total Students: ${createdStudents.length}`);
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
