const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || 'syed.anasfaaiz@gmail.com';
  const name = process.env.SEED_NAME || 'Syed Anas Faaiz';
  const password = process.env.SEED_PASSWORD || 'TraceVault@123';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      password: passwordHash,
    },
    update: {
      name,
      password: passwordHash,
    },
  });

  let project = await prisma.project.findFirst({
    where: {
      userId: user.id,
      name: 'TraceVault',
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'TraceVault',
        description: 'Engineering reflection platform for capturing project learnings.',
        techStack: ['Next.js', 'NestJS', 'Prisma', 'PostgreSQL'],
        userId: user.id,
      },
    });
  }

  const existingReflections = await prisma.reflection.count({
    where: { projectId: project.id },
  });

  if (existingReflections === 0) {
    await prisma.reflection.createMany({
      data: [
        {
          title: 'Feed personalization fallback logic',
          category: 'design_decision',
          template_type: 'design_decision',
          impact: 'significant',
          tags: ['feed', 'personalization', 'fallback'],
          fields: {
            what_triggered: 'Users with no tag history were seeing empty personalized feeds.',
            options_considered: 'Strict empty-state vs trending fallback vs onboarding prompt.',
            why_chosen: 'Trending fallback gives immediate value and reduces cold-start friction.',
          },
          content: 'Implemented fallback to trending entries when user tag history is empty.',
          projectId: project.id,
          userId: user.id,
        },
        {
          title: 'Reaction toggle reliability',
          category: 'technical_challenge',
          template_type: 'technical_challenge',
          impact: 'minor',
          tags: ['reactions', 'api', 'ux'],
          fields: {
            what_broke: 'UI and DB reaction state diverged after fast repeated clicks.',
            root_cause: 'No immediate optimistic reconciliation strategy per reaction type.',
            confidence: 'mostly',
          },
          content: 'Added optimistic UI update and rollback on API error.',
          projectId: project.id,
          userId: user.id,
        },
        {
          title: 'Vault saves for later learning',
          category: 'lesson_learned',
          template_type: 'lesson_learned',
          impact: 'pivotal',
          tags: ['vault', 'knowledge-management'],
          fields: {
            what_happened: 'Users wanted a lightweight way to save high-signal entries.',
            what_learned: 'Simple save flows increase revisit rate more than deep folders initially.',
          },
          content: 'Introduced one-click vault and dedicated vault page.',
          projectId: project.id,
          userId: user.id,
        },
      ],
    });
  }

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    reflections: await prisma.reflection.count(),
    reactions: await prisma.reaction.count(),
    vaultEntries: await prisma.vaultEntry.count(),
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        seededUser: { email, name },
        seededProject: { id: project.id, name: project.name },
        counts,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
