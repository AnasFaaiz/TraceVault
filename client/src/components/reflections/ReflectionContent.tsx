"use client";

import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { getTemplate, TemplateType } from '@/lib/templateDefinitions';

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

function renderValue(value: ReflectionFields[keyof ReflectionFields], condensed: boolean): ReactNode {
  if (condensed) {
    return truncate(toText(value), 200);
  }

  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '0 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {value.map((item) => (
          <li key={String(item)} style={{ lineHeight: 1.7 }}>
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

  return text;
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

    const ordered = template
      ? template.fields
        .map((f) => ({ key: f.name, label: f.label, value: structuredFields[f.name] }))
        .filter((item) => toText(item.value).trim().length > 0)
      : Object.entries(structuredFields)
        .map(([key, value]) => ({ key, label: key.replace(/_/g, ' '), value }))
        .filter((item) => toText(item.value).trim().length > 0);

    const visibleRows = condensed ? ordered.slice(0, 2) : ordered;

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
              {renderValue(row.value, condensed)}
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
