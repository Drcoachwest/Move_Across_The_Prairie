import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel } from "docx";
import { getLessonPlanById } from "@/lib/lesson-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const lessonPlan = getLessonPlanById(id);

    if (!lessonPlan) {
      return NextResponse.json(
        { success: false, message: "Lesson plan not found" },
        { status: 404 }
      );
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: lessonPlan.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: `Teacher: ${lessonPlan.teacher} | Campus: ${lessonPlan.campus} | Grade: ${lessonPlan.gradeLevel} | Date: ${lessonPlan.date}`,
              spacing: { after: 400 },
            }),

            // Lesson Information
            new Paragraph({
              text: "Lesson Information",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 100 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Teacher:")], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(lessonPlan.teacher)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Campus:")], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(lessonPlan.campus)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Grade Level:")], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(lessonPlan.gradeLevel)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Date:")], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(lessonPlan.date)] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Safety and Management Considerations",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 100 },
            }),
            new Paragraph(lessonPlan.safetyAndManagement || "—"),

            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Lesson Activities and Instruction",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 100 },
            }),

            new Paragraph({
              text: "Instant Activity / Warm Up",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.instantActivityWarmUp || "—"),

            new Paragraph({
              text: "Skill Introduction",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.skillIntroduction || "—"),

            new Paragraph({
              text: "Skill Practice",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.skillPractice || "—"),

            new Paragraph({
              text: "Application Activity",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.applicationActivity || "—"),

            new Paragraph({
              text: "Cool Down / Closure",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.coolDownClosure || "—"),

            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Assessment and Reflection",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 100 },
            }),

            new Paragraph({
              text: "Assessment (What are you looking for?)",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.assessment || "—"),

            new Paragraph({
              text: "MVPA (Moderate to Vigorous Physical Activity)",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.mvpa || "—"),

            new Paragraph({
              text: "Adaptations",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.adaptations || "—"),

            new Paragraph({
              text: "Teacher Reflections",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph(lessonPlan.teacherReflections || "—"),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${lessonPlan.title}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error generating Word document:", error);
    return NextResponse.json(
      { success: false, message: "Error generating document" },
      { status: 500 }
    );
  }
}
