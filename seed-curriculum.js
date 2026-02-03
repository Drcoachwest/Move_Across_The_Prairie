const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const docsDir = path.join(__dirname, "public", "curriculum-documents");

const normalizeTitle = (filename) => {
  const withoutTimestamp = filename.replace(/^\d+_/, "");
  const withoutExt = withoutTimestamp.replace(/\.[^/.]+$/, "");
  return withoutExt.replace(/_/g, " ").trim();
};

const inferGrade = (title) => {
  if (/K-2/i.test(title)) return "K-2";
  if (/3-5/i.test(title)) return "3-5";
  if (/6-8/i.test(title)) return "6-8";
  if (/9-12/i.test(title)) return "9-12";
  return null;
};

const inferType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".doc" || ext === ".docx") return "doc";
  return "file";
};

(async () => {
  try {
    if (!fs.existsSync(docsDir)) {
      console.error("Curriculum documents folder not found:", docsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(docsDir).filter((f) => !f.startsWith("."));

    let created = 0;
    let skipped = 0;

    for (const file of files) {
      const fileUrl = `/curriculum-documents/${file}`;
      const title = normalizeTitle(file);
      const grade = inferGrade(title);
      const type = inferType(file);

      const existing = await prisma.curriculumResource.findFirst({
        where: { fileUrl },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.curriculumResource.create({
        data: {
          title,
          description: null,
          grade,
          unit: "General",
          subject: "PE",
          tags: "curriculum,resources",
          type,
          fileUrl,
          externalUrl: null,
          createdBy: "admin",
        },
      });

      created++;
      console.log(`✓ Added: ${title}`);
    }

    console.log(`\nSeed complete: ${created} created, ${skipped} skipped`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
