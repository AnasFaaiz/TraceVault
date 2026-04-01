const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const userCount = await prisma.user.count();
  const reflectionCount = await prisma.reflection.count();
  const projectCount = await prisma.project.count();
  console.log({ userCount, projectCount, reflectionCount });
  const recent = await prisma.reflection.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log('Recent reflections:', JSON.stringify(recent, null, 2));
  process.exit(0);
}

check();
