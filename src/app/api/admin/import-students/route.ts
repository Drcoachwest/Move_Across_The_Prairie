import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";
import { cookies } from "next/headers";

/**
 * POST /api/admin/import-students
 * Import students from CSV file
 * 
 * CSV Format (required columns):
 * districtId, firstName, lastName, dateOfBirth (YYYY-MM-DD), grade (3-12), school, peTeacher
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized - admin login required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    if (records.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Validate and process records
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; districtId: string; error: string }[],
      importedStudents: [] as { districtId: string; name: string }[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2

      try {
        // Validate required fields
        const { districtId, firstName, lastName, dateOfBirth, grade, school, peTeacher, classroomTeacher } = row;

        if (!districtId || !firstName || !lastName || !dateOfBirth || !grade || !school || !peTeacher) {
          results.errors.push({
            row: rowNumber,
            districtId: districtId || "MISSING",
            error: "Missing required field",
          });
          results.skipped++;
          continue;
        }

        // Validate grade
        const gradeNum = parseInt(grade);
        if (isNaN(gradeNum) || gradeNum < 3 || gradeNum > 12) {
          results.errors.push({
            row: rowNumber,
            districtId,
            error: "Grade must be between 3 and 12",
          });
          results.skipped++;
          continue;
        }

        // Validate date
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          results.errors.push({
            row: rowNumber,
            districtId,
            error: "Invalid date format (use YYYY-MM-DD)",
          });
          results.skipped++;
          continue;
        }

        // Check if student exists
        const existingStudent = await prisma.student.findUnique({
          where: { districtId },
        });

        if (existingStudent) {
          // Update existing student
          await prisma.student.update({
            where: { districtId },
            data: {
              firstName,
              lastName,
              dateOfBirth: dob,
              currentGrade: gradeNum,
              currentSchool: school,
              peTeacher,
              classroomTeacher: classroomTeacher || null,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new student
          await prisma.student.create({
            data: {
              districtId,
              firstName,
              lastName,
              dateOfBirth: dob,
              currentGrade: gradeNum,
              currentSchool: school,
              peTeacher,
              classroomTeacher: classroomTeacher || null,
            },
          });

          // Add to student history
          await prisma.studentHistory.create({
            data: {
              studentId: (await prisma.student.findUnique({ where: { districtId } }))!.id,
              school,
              enrollmentDate: new Date(),
              grade: gradeNum,
              peTeacher,
            },
          });
        }

        results.imported++;
        results.importedStudents.push({
          districtId,
          name: `${firstName} ${lastName}`,
        });
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          districtId: row.districtId || "UNKNOWN",
          error: error.message || "Unknown error",
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.imported} students imported, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import-students
 * Returns CSV template for students
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized - admin login required" },
        { status: 401 }
      );
    }

    const csvTemplate = `districtId,firstName,lastName,dateOfBirth,grade,school,peTeacher
STU001,John,Doe,2010-05-15,6,Central Elementary,Ms. Smith
STU002,Jane,Smith,2009-08-22,7,Central Elementary,Mr. Johnson
STU003,Bob,Johnson,2008-03-10,8,Lincoln Middle School,Ms. Garcia`;

    return new NextResponse(csvTemplate, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=students_template.csv",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate template" },
      { status: 500 }
    );
  }
}
