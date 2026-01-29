const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCode() {
  try {
    const code = await prisma.activationCode.upsert({
      where: { code: 'PE-TEACHER-2024' },
      update: {
        expiresAt: new Date('2026-12-31'),
        active: true,
        usesCount: 0,
      },
      create: {
        code: 'PE-TEACHER-2024',
        maxUses: 10,
        expiresAt: new Date('2026-12-31'),
        active: true,
        createdBy: 'system',
      },
    });
    console.log('✅ Activation code created:', JSON.stringify(code, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCode();
