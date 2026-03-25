import { PrismaClient } from '@prisma/client';

/**
 * Migration Script: Convert existing markdown entries to structured fields
 * 
 * This script:
 * 1. Fetches all existing entries with markdown content
 * 2. Parses the markdown by headers
 * 3. Maps content to the appropriate template structure
 * 4. Saves structured fields back to the entry
 * 5. Sets content to null (fallback preserved for safety)
 * 
 * Run with: npx ts-node scripts/migrate-entries.ts
 */

const prisma = new PrismaClient();

interface EntryFields {
  [key: string]: string;
}

/**
 * Parse markdown content by headers (### Header)
 */
function parseMarkdownContent(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = content.split(/^### /m);

  parts.forEach((part) => {
    if (!part.trim()) return;

    const lines = part.split('\n');
    const header = lines[0];
    const body = lines.slice(1).join('\n').trim();

    sections[header] = body;
  });

  return sections;
}

/**
 * Map parsed sections to template-specific fields
 */
function mapToTemplateFields(
  category: string,
  sections: Record<string, string>,
): EntryFields {
  const fields: EntryFields = {};

  // Normalize section keys
  const normalizedSections: Record<string, string> = {};
  Object.entries(sections).forEach(([key, value]) => {
    normalizedSections[key.toLowerCase().trim()] = value;
  });

  switch (category) {
    case 'challenge':
      // Maps: Context → what_broke, Decision → what_worked, Results → root_cause
      fields.what_broke =
        normalizedSections['problem'] ||
        normalizedSections['context'] ||
        normalizedSections['issue'] ||
        '';
      fields.what_tried =
        normalizedSections['attempted'] ||
        normalizedSections['tried'] ||
        normalizedSections['solution'] ||
        '';
      fields.what_worked =
        normalizedSections['solution'] ||
        normalizedSections['decision'] ||
        normalizedSections['fix'] ||
        '';
      fields.root_cause =
        normalizedSections['results'] ||
        normalizedSections['root cause'] ||
        normalizedSections['cause'] ||
        '';
      fields.confidence = 'Mostly'; // Default for migrated entries
      break;

    case 'decision':
      // Maps: Context → triggered, Decision → reasoning, Results → revisit_condition
      fields.what_triggered =
        normalizedSections['context'] ||
        normalizedSections['situation'] ||
        normalizedSections['triggered'] ||
        '';
      fields.alternatives_considered =
        normalizedSections['alternatives'] ||
        normalizedSections['options'] ||
        '';
      fields.reasoning =
        normalizedSections['decision'] ||
        normalizedSections['reasoning'] ||
        normalizedSections['why'] ||
        '';
      fields.constraints =
        normalizedSections['constraints'] ||
        normalizedSections['limitations'] ||
        '';
      fields.revisit_condition =
        normalizedSections['results'] ||
        normalizedSections['revisit'] ||
        normalizedSections['conditions'] ||
        '';
      break;

    case 'tradeoff':
      // Maps: Decision → gained, Context → gave_up
      fields.gained =
        normalizedSections['decision'] ||
        normalizedSections['gained'] ||
        normalizedSections['benefits'] ||
        '';
      fields.gave_up =
        normalizedSections['context'] ||
        normalizedSections['tradeoff'] ||
        normalizedSections['sacrifice'] ||
        '';
      fields.constraints =
        normalizedSections['constraints'] ||
        normalizedSections['limitations'] ||
        '';
      fields.revisit_when =
        normalizedSections['revisit'] ||
        normalizedSections['conditions'] ||
        '';
      fields.risk_level = 'Acceptable'; // Default for migrated entries
      break;

    case 'lesson':
      // Maps: Context → happened, Decision → rule_of_thumb, Results → assumption_vs_reality
      fields.what_happened =
        normalizedSections['context'] ||
        normalizedSections['what happened'] ||
        normalizedSections['story'] ||
        '';
      fields.assumption_vs_reality =
        normalizedSections['results'] ||
        normalizedSections['assumption'] ||
        normalizedSections['reality'] ||
        '';
      fields.rule_of_thumb =
        normalizedSections['decision'] ||
        normalizedSections['lesson'] ||
        normalizedSections['takeaway'] ||
        '';
      fields.who_should_know =
        normalizedSections['who'] ||
        normalizedSections['team'] ||
        '';
      break;

    default:
      // Fallback for other types - store all sections as-is
      Object.entries(normalizedSections).forEach(([key, value]) => {
        fields[key.replace(/[^a-z0-9_]/g, '_')] = value;
      });
      break;
  }

  return fields;
}

/**
 * Determine template type from category
 */
function getTemplateType(category: string): string {
  const mapping: Record<string, string> = {
    challenge: 'technical_challenge',
    decision: 'design_decision',
    tradeoff: 'tradeoff',
    lesson: 'lesson_learned',
  };
  return mapping[category] || category;
}

/**
 * Main migration logic
 */
async function migrateEntries() {
  console.log('🔄 Starting migration of existing entries...\n');

  try {
    const reflectionModel = (prisma as any).reflection;
    const projectModel = (prisma as any).project;

    // Read broadly, then filter in memory so this script compiles against
    // both pre-migration and post-migration Prisma client types.
    const allEntries: any[] = await reflectionModel.findMany();
    const entriesToMigrate = allEntries.filter((entry) => {
      const hasLegacyContent =
        typeof entry.content === 'string' && entry.content.trim().length > 0;
      const hasStructuredFields =
        entry.fields &&
        typeof entry.fields === 'object' &&
        Object.keys(entry.fields).length > 0;

      return hasLegacyContent && !hasStructuredFields;
    });

    console.log(`Found ${entriesToMigrate.length} entries to migrate.\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const entry of entriesToMigrate) {
      try {
        console.log(`📝 Processing: "${entry.title}"`);

        // Parse markdown content
        const sections = parseMarkdownContent(entry.content || '');
        console.log(
          `   → Found sections: ${Object.keys(sections).join(', ')}`,
        );

        const category = entry.category || entry.type || 'lesson';

        // Map to template fields
        const templateFields = mapToTemplateFields(category, sections);
        console.log(`   → Mapped to ${category} template`);

        // Get template type
        const templateType = getTemplateType(category);

        let ownerId = entry.userId as string | undefined;
        if (!ownerId && entry.projectId) {
          const project = await projectModel.findUnique({
            where: { id: entry.projectId },
            select: { userId: true },
          });
          ownerId = project?.userId;
        }

        // Update entry with structured fields
        await reflectionModel.update({
          where: { id: entry.id },
          data: {
            category,
            template_type: templateType,
            fields: templateFields,
            userId: ownerId, // Set author to project owner
            // Keep content for safety, but set to null on success
            // (commented out to preserve backward compatibility during testing)
            // content: null,
          },
        });

        console.log(`   ✅ Successfully migrated\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed to migrate:`, error);
        console.log(`   (Skipping entry ${entry.id})\n`);
        failureCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total entries processed: ${entriesToMigrate.length}`);
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log('='.repeat(60) + '\n');

    if (failureCount === 0) {
      console.log(
        '🎉 Migration completed successfully! All entries converted.\n',
      );
    } else {
      console.log(
        `⚠️  Migration completed with ${failureCount} error(s). Please review.\n`,
      );
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateEntries();
