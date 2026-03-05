const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const maleNames = [
  'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Lucas', 'Aiden', 'Jackson', 'Mateo', 'Elijah',
  'James', 'Benjamin', 'Henry', 'Sebastian', 'Owen'
];
const femaleNames = [
  'Olivia', 'Emma', 'Ava', 'Sophia', 'Mia', 'Isabella', 'Amelia', 'Harper', 'Evelyn', 'Luna',
  'Ella', 'Grace', 'Chloe', 'Camila', 'Nora'
];
const lastNames = [
  'Garcia', 'Nguyen', 'Hernandez', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
  'Martinez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const seededDate = (year, index) => {
  const month = (index * 7) % 12; // deterministic but varied
  const day = ((index * 11) % 26) + 1;
  return new Date(year, month, day);
};

const calculateBMI = (heightIn, weightLb) => {
  if (!heightIn || !weightLb) return null;
  const bmi = (weightLb * 703) / (heightIn * heightIn);
  return Math.round(bmi * 10) / 10;
};

const buildStudent = ({
  index,
  districtPrefix,
  grade,
  school,
  peTeacher,
  classroomTeacher,
}) => {
  const sex = index % 2 === 0 ? 'M' : 'F';
  const firstName = sex === 'M'
    ? maleNames[index % maleNames.length]
    : femaleNames[index % femaleNames.length];
  const lastName = lastNames[(index + grade) % lastNames.length];
  const birthYear = grade === 3 ? 2016 : grade === 5 ? 2014 : 2010;

  return {
    districtId: `${districtPrefix}-${String(index + 1).padStart(3, '0')}`,
    firstName,
    lastName,
    sex,
    dateOfBirth: seededDate(birthYear, index),
    currentGrade: grade,
    currentSchool: school,
    peTeacher,
    classroomTeacher,
  };
};

const buildTest = ({ student, testDate, testSeason, index }) => {
  const includeStrength = index % 2 === 0;
  const includeBody = index % 4 === 0;
  const includeFlex = index % 3 === 0;

  const pacer = 12 + (index % 18);
  const pushups = includeStrength ? 6 + (index % 14) : null;
  const situps = includeStrength ? 8 + (index % 20) : null;
  const height = includeBody ? 46 + (index % 16) : null;
  const weight = includeBody ? 55 + (index % 55) : null;
  const sitAndReach = includeFlex ? 18 + (index % 10) : null;
  const trunkLift = includeFlex ? 8 + (index % 6) : null;

  return {
    studentId: student.id,
    school: student.currentSchool,
    measurementSystem: 'US_IN_LB',
    testDate,
    testSeason,
    testYear: testDate.getFullYear(),
    cardioTestType: 'PACER',
    pacerOrMileRun: pacer,
    pushups,
    situps,
    sitAndReach,
    trunkLift,
    height,
    weight,
    bmi: calculateBMI(height, weight),
  };
};

async function main() {
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const miguel = await prisma.teacher.upsert({
    where: { email: 'miguel.tapia@gpisd.org' },
    update: {
      name: 'Miguel Tapia',
      school: 'Austin Elementary',
      password: passwordHash,
      activated: true,
      schoolLevel: 'ELEMENTARY',
    },
    create: {
      email: 'miguel.tapia@gpisd.org',
      name: 'Miguel Tapia',
      school: 'Austin Elementary',
      password: passwordHash,
      activated: true,
      schoolLevel: 'ELEMENTARY',
    },
  });

  const secondaryTeacher = await prisma.teacher.upsert({
    where: { email: 'coach.davis@gpisd.org' },
    update: {
      name: 'Coach Davis',
      school: 'Lincoln High School',
      password: passwordHash,
      activated: true,
      schoolLevel: 'SECONDARY',
      department: 'PE',
    },
    create: {
      email: 'coach.davis@gpisd.org',
      name: 'Coach Davis',
      school: 'Lincoln High School',
      password: passwordHash,
      activated: true,
      schoolLevel: 'SECONDARY',
      department: 'PE',
    },
  });

  const grade3Students = await Promise.all(
    Array.from({ length: 25 }, (_, i) => {
      const data = buildStudent({
        index: i,
        districtPrefix: 'AES-3',
        grade: 3,
        school: 'Austin Elementary',
        peTeacher: 'Miguel Tapia',
        classroomTeacher: 'Ms. Garcia',
      });

      return prisma.student.upsert({
        where: { districtId: data.districtId },
        update: data,
        create: data,
      });
    })
  );

  const grade5Students = await Promise.all(
    Array.from({ length: 25 }, (_, i) => {
      const data = buildStudent({
        index: i,
        districtPrefix: 'AES-5',
        grade: 5,
        school: 'Austin Elementary',
        peTeacher: 'Miguel Tapia',
        classroomTeacher: 'Mr. Nguyen',
      });

      return prisma.student.upsert({
        where: { districtId: data.districtId },
        update: data,
        create: data,
      });
    })
  );

  const secondaryStudents = await Promise.all(
    Array.from({ length: 25 }, (_, i) => {
      const data = buildStudent({
        index: i,
        districtPrefix: 'LHS-2',
        grade: 9,
        school: 'Lincoln High School',
        peTeacher: 'Coach Davis',
        classroomTeacher: null,
      });

      return prisma.student.upsert({
        where: { districtId: data.districtId },
        update: data,
        create: data,
      });
    })
  );

  const period2 = await prisma.classPeriod.upsert({
    where: {
      teacherId_periodNumber_schoolYear: {
        teacherId: secondaryTeacher.id,
        periodNumber: 2,
        schoolYear: '2025-2026',
      },
    },
    update: {},
    create: {
      teacherId: secondaryTeacher.id,
      periodNumber: 2,
      schoolYear: '2025-2026',
    },
  });

  await Promise.all(
    secondaryStudents.map((student) =>
      prisma.studentClassPeriodAssignment.upsert({
        where: {
          studentId_classPeriodId_schoolYear: {
            studentId: student.id,
            classPeriodId: period2.id,
            schoolYear: '2025-2026',
          },
        },
        update: { dropDate: null },
        create: {
          studentId: student.id,
          classPeriodId: period2.id,
          schoolYear: '2025-2026',
          semester: 'Fall',
        },
      })
    )
  );

  const fallDate = new Date('2025-10-01');
  const springDate = new Date('2026-03-15');

  const grade3Fall = grade3Students.slice(0, 10);
  const grade3Spring = grade3Students.slice(5, 15);
  const grade5Fall = grade5Students.slice(0, 10);
  const secondaryFall = secondaryStudents.slice(0, 12);

  const testWrites = [];

  grade3Fall.forEach((student, idx) => {
    const test = buildTest({ student, testDate: fallDate, testSeason: 'Fall', index: idx });
    testWrites.push(
      prisma.fitnesGramTest.upsert({
        where: {
          studentId_testYear_testSeason: {
            studentId: student.id,
            testYear: test.testYear,
            testSeason: test.testSeason,
          },
        },
        update: test,
        create: test,
      })
    );
  });

  grade3Spring.forEach((student, idx) => {
    const test = buildTest({ student, testDate: springDate, testSeason: 'Spring', index: idx + 20 });
    testWrites.push(
      prisma.fitnesGramTest.upsert({
        where: {
          studentId_testYear_testSeason: {
            studentId: student.id,
            testYear: test.testYear,
            testSeason: test.testSeason,
          },
        },
        update: test,
        create: test,
      })
    );
  });

  grade5Fall.forEach((student, idx) => {
    const test = buildTest({ student, testDate: fallDate, testSeason: 'Fall', index: idx + 40 });
    testWrites.push(
      prisma.fitnesGramTest.upsert({
        where: {
          studentId_testYear_testSeason: {
            studentId: student.id,
            testYear: test.testYear,
            testSeason: test.testSeason,
          },
        },
        update: test,
        create: test,
      })
    );
  });

  secondaryFall.forEach((student, idx) => {
    const test = buildTest({ student, testDate: fallDate, testSeason: 'Fall', index: idx + 60 });
    testWrites.push(
      prisma.fitnesGramTest.upsert({
        where: {
          studentId_testYear_testSeason: {
            studentId: student.id,
            testYear: test.testYear,
            testSeason: test.testSeason,
          },
        },
        update: test,
        create: test,
      })
    );
  });

  await Promise.all(testWrites);

  console.log('Seed complete.');
  console.log('Elementary login: miguel.tapia@gpisd.org / Password123!');
  console.log('Secondary login: coach.davis@gpisd.org / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
