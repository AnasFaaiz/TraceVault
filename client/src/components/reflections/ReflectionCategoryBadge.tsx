"use client";

const CATEGORY_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  technical_challenge: { label: 'Technical Challenge', bg: '#fdf0ea', color: '#8b3e2a' },
  design_decision: { label: 'Design Decision', bg: '#edf7f4', color: '#2a6b5e' },
  tradeoff: { label: 'Tradeoff', bg: '#fdf6e8', color: '#854f0b' },
  lesson_learned: { label: 'Lesson Learned', bg: '#f0f0f8', color: '#4a4a8a' },
  bug_autopsy: { label: 'Bug Autopsy', bg: '#fdeeed', color: '#9f2f2f' },
  integration_note: { label: 'Integration Note', bg: '#eaf2fd', color: '#2a4f8b' },
  challenge: { label: 'Challenge', bg: '#fdf0ea', color: '#8b3e2a' },
  decision: { label: 'Decision', bg: '#edf7f4', color: '#2a6b5e' },
  lesson: { label: 'Lesson', bg: '#f0f0f8', color: '#4a4a8a' },
};

function normalizeCategory(value?: string): string {
  if (!value) return 'lesson_learned';
  return value.toLowerCase();
}

export function getCategoryStyle(category?: string, legacyType?: string) {
  const key = normalizeCategory(category || legacyType);
  return CATEGORY_STYLES[key] || CATEGORY_STYLES.lesson_learned;
}

interface ReflectionCategoryBadgeProps {
  category?: string;
  legacyType?: string;
}

export default function ReflectionCategoryBadge({ category, legacyType }: ReflectionCategoryBadgeProps) {
  const style = getCategoryStyle(category, legacyType);

  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.06em',
        padding: '4px 10px',
        borderRadius: 6,
        background: style.bg,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
}
