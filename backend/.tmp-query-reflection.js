const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const rows = await prisma.reflection.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
    console.log({ ok: true, count: rows.length, sampleKeys: rows[0] ? Object.keys(rows[0]) : [] });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
