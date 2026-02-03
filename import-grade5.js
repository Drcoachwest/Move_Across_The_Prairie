const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parse/sync");

const prisma = new PrismaClient();

(async () => {
  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, "grade5_students.csv");
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    
    // Parse CSV
    const records = csvParser.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} students to import...`);

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      try {
        const { districtId, firstName, lastName, sex, dateOfBirth, grade, school, peTeacher, classroomTeacher } = row;

        // Validate required fields
        if (!districtId || !firstName || !lastName || !sex || !dateOfBirth || !grade || !school || !peTeacher) {
          console.error(`Row ${i + 2}: Missing required field`);
          errors++;
          continue;
        }

        // Validate grade
        const gradeNum = parseInt(grade);
        if (isNaN(gradeNum) || gradeNum < 3 || gradeNum > 12) {
          console.error(`Row ${i + 2}: Invalid grade ${grade}`);
          errors++;
          continue;
        }

        // Validate sex
        const normalizedSex = String(sex).trim().toUpperCase();
        if (normalizedSex !== "M" && normalizedSex !== "F") {
          console.error(`Row ${i + 2}: Invalid sex ${sex}`);
          errors++;
          continue;
        }

        // Validate date of birth
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          console.error(`Row ${i + 2}: Invalid date of birth ${dateOfBirth}`);
          errors++;
          continue;
        }

        // Create or update student
        const student = await prisma.student.upsert({
          where: { districtId },
          update: {
            firstName,
            lastName,
            sex: normalizedSex,
            dateOfBirth: dob,
            currentGrade: gradeNum,
            currentSchool: school,
            peTeacher,
            classroomTeacher: classroomTeacher || null,
          },
          create: {
            districtId,
            firstName,
            lastName,
            sex: normalizedSex,
            dateOfBirth: dob,
            currentGrade: gradeNum,
            currentSchool: school,
            peTeacher,
            classroomTeacher: classroomTeacher || null,
          },
        });

        imported++;
        console.log(`✓ Imported: ${firstName} ${lastName} (${districtId})`);
      } catch (err) {
        console.error(`Row ${i + 2}: Error - ${err.message}`);
        errors++;
      }
    }

    console.log(`\nImport complete: ${imported} imported, ${errors} errors`);
    await prisma.$disconnect();
  } catch (err) {
    console.error("Import failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
