const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

(async () => {
  const hashedPassword = await bcrypt.hash("Teacher123!", 10);
  const teacher = await prisma.teacher.upsert({
    where: { email: "miguel.tapia@gpisd.org" },
    update: { password: hashedPassword, activated: true },
    create: {
      email: "miguel.tapia@gpisd.org",
      name: "Miguel Tapia",
      school: "Austin Elementary",
      password: hashedPassword,
      activated: true,
    },
  });
  console.log("Miguel ready:", teacher.email);
  await prisma.$disconnect();
})();
