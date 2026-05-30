"use client";

import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { getTemplate, TemplateType } from '@/lib/templateDefinitions';
import styles from './ReflectionContent.module.css';

type ReflectionFields = Record<string, string | string[] | boolean | null | undefined>;

interface ReflectionContentProps {
  category?: string;
  templateType?: string;
  fields?: ReflectionFields | null;
  content?: string | null;
  condensed?: boolean;
}

function safeTemplate(type?: string) {
  if (!type) return null;
  const allowed = [
    'design_decision',
    'technical_challenge',
    'tradeoff',
    'lesson_learned',
    'bug_autopsy',
    'integration_note',
  ];

  if (!allowed.includes(type)) {
    return null;
  }

  return getTemplate(type as TemplateType);
}

function toText(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '';
  return String(value);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

function splitList(value: string): string[] {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const commaItems = value
    .split(/,\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return commaItems.length > 1 ? commaItems : [];
}

function shouldRenderMarkdown(text: string): boolean {
  return /\n|```|^\s*[-*]\s+/m.test(text);
}

function renderValue(value: ReflectionFields[keyof ReflectionFields], condensed: boolean): ReactNode {
  if (condensed) {
    return truncate(toText(value), 200);
  }

  if (Array.isArray(value)) {
    return (
      <ul className={styles.list}>
        {value.map((item) => (
          <li key={String(item)} className={styles.listItem}>
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  const text = toText(value);
  const listItems = splitList(text);
  if (listItems.length > 1) {
    return (
      <ul style={{ margin: '0 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {listItems.map((item) => (
          <li key={item} style={{ lineHeight: 1.7 }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (shouldRenderMarkdown(text)) {
    return (
      <div className="structured-markdown" style={{ lineHeight: 1.7 }}>
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return text;
}

function renderSection(
  label: string,
  value: ReflectionFields[keyof ReflectionFields] | undefined,
  condensed: boolean,
  required = false,
) {
  const displayText = toText(value).trim();

  return (
    <div className={styles.section}>
      <p className={styles.label}>
        {label}
      </p>
      <div className={styles.value}>
        {displayText.length > 0 ? (
          renderValue(value, condensed)
        ) : (
          required ? <span className={styles.condensedPlaceholder}>Not provided</span> : null
        )}
      </div>
    </div>
  );
}

function renderTemplateLayout(
  templateType: string | undefined,
  fields: ReflectionFields,
  condensed: boolean,
) {
  if (condensed) return null;

  switch (templateType) {
    case 'design_decision':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('What triggered this decision', fields.what_triggered, condensed, true)}
          {renderSection('Alternatives considered', fields.alternatives_considered, condensed, true)}
          {renderSection('Reasoning', fields.reasoning, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Constraints', fields.constraints, condensed)}
            {renderSection('Revisit condition', fields.revisit_condition, condensed)}
          </div>
        </div>
      );
    case 'technical_challenge':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('What broke', fields.what_broke, condensed, true)}
          {renderSection('What you tried', fields.what_tried, condensed, true)}
          {renderSection('What worked', fields.what_worked, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Root cause', fields.root_cause, condensed, true)}
            {renderSection('Confidence', fields.confidence, condensed, true)}
          </div>
        </div>
      );
    case 'tradeoff':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('What you gained', fields.gained, condensed, true)}
          {renderSection('What you gave up', fields.gave_up, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Constraints', fields.constraints, condensed)}
            {renderSection('Revisit when', fields.revisit_when, condensed)}
            {renderSection('Risk level', fields.risk_level, condensed, true)}
          </div>
        </div>
      );
    case 'lesson_learned':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('What happened', fields.what_happened, condensed, true)}
          {renderSection('Assumption vs reality', fields.assumption_vs_reality, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Rule of thumb', fields.rule_of_thumb, condensed, true)}
            {renderSection('Who should know', fields.who_should_know, condensed)}
          </div>
        </div>
      );
    case 'bug_autopsy':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('Symptoms', fields.symptoms, condensed, true)}
          {renderSection('Ruled out', fields.ruled_out, condensed, true)}
          {renderSection('Fix', fields.fix, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Root cause', fields.root_cause, condensed, true)}
            {renderSection('Confidence', fields.confidence, condensed, true)}
          </div>
        </div>
      );
    case 'integration_note':
      return (
        <div className={styles.templateWrapper}>
          {renderSection('The gotcha', fields.the_gotcha, condensed, true)}
          {renderSection('How you discovered it', fields.how_discovered, condensed, true)}
          {renderSection('Fix or workaround', fields.fix_or_workaround, condensed, true)}
          <div className={styles.grid}>
            {renderSection('Is it documented?', fields.is_documented, condensed, true)}
            {renderSection('Version affected', fields.version_affected, condensed)}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function ReflectionContent({
  category,
  templateType,
  fields,
  content,
  condensed = false,
}: ReflectionContentProps) {
  const structuredFields =
    fields && typeof fields === 'object' ? fields : null;
  const hasStructured =
    !!structuredFields && Object.keys(structuredFields).length > 0;

  if (hasStructured) {
    const template = safeTemplate(templateType || category);
    const richLayout = renderTemplateLayout(template?.value, structuredFields, condensed);

    if (richLayout) {
      return richLayout;
    }

    const ordered = template
      ? template.fields.map((f) => ({
          key: f.name,
          label: f.label,
          value: structuredFields[f.name],
          required: f.required,
        }))
      : Object.entries(structuredFields).map(([key, value]) => ({
          key,
          label: key.replace(/_/g, ' '),
          value,
          required: false,
        }));

    const withValues = ordered.filter((item) => toText(item.value).trim().length > 0);
    const visibleRows = condensed ? withValues.slice(0, 2) : ordered;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleRows.map((row) => (
          <div key={row.key}>
            <p
              style={{
                fontSize: 10,
                fontFamily: 'var(--mono)',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              {row.label}
            </p>
            <div
              style={{
                fontSize: 14,
                color: 'var(--ink)',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {toText(row.value).trim().length > 0 ? (
                renderValue(row.value, condensed)
              ) : (
                !condensed && row.required ? (
                  <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Not provided</span>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (content && content.trim().length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            width: 'fit-content',
            padding: '5px 10px',
            borderRadius: 999,
            background: '#fff7e8',
            border: '1px solid #f3d7a7',
            color: '#8c6113',
            fontSize: 11,
            fontFamily: 'var(--mono)',
          }}
        >
          <AlertCircle size={12} /> Legacy Markdown Entry
        </div>

        {condensed ? (
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>
            {truncate(content.replace(/\s+/g, ' ').trim(), 220)}
          </p>
        ) : (
          <div
            className="legacy-markdown"
            style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  return (
    <p style={{ fontSize: 14, color: 'var(--muted)' }}>
      No reflection details available.
    </p>
  );
}
