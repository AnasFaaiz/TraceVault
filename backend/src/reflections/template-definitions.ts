/**
 * Template Definitions for Structured Fields
 * 
 * This file defines all 6 template types and their fields.
 * Used by both frontend and backend for form validation and display.
 */

export type TemplateType =
  | 'design_decision'
  | 'technical_challenge'
  | 'tradeoff'
  | 'lesson_learned'
  | 'bug_autopsy'
  | 'integration_note';

export type FieldType = 'text' | 'textarea' | 'toggle';

export interface FieldDefinition {
  name: string; // Field key in the fields object
  label: string; // Display label
  type: FieldType; // Input type
  placeholder: string; // Conversational placeholder/hint text
  required: boolean;
  helpText?: string; // Optional helper text
  options?: string[]; // For toggle fields
  quickOptions?: string[]; // Optional quick-pick buttons for text/textarea fields
  quickMode?: 'single' | 'multi';
}

export interface TemplateDefinition {
  value: TemplateType;
  category: string; // UI category name
  categoryValue: string; // Form category value
  description: string; // One-line description shown on card
  fields: FieldDefinition[];
}

// ============================================================================
// TEMPLATE 1: DESIGN DECISION
// ============================================================================

export const DESIGN_DECISION: TemplateDefinition = {
  value: 'design_decision',
  category: 'Design Decision',
  categoryValue: 'design_decision',
  description: 'I chose X over Y and here\'s the full reasoning',
  fields: [
    {
      name: 'what_triggered',
      label: 'What triggered this decision?',
      type: 'textarea',
      placeholder:
        'Describe the problem or situation that forced you to make this decision',
      required: true,
    },
    {
      name: 'alternatives_considered',
      label: 'What other options did you consider?',
      type: 'textarea',
      placeholder:
        'List the paths you could have taken instead. Why didn\'t you pick them?',
      required: true,
    },
    {
      name: 'reasoning',
      label: 'Why did you go with this approach?',
      type: 'textarea',
      placeholder:
        'Walk through your logic. What convinced you this was the right call?',
      required: true,
    },
    {
      name: 'constraints',
      label: 'What constraints shaped this decision?',
      type: 'text',
      placeholder: 'Budget, timeline, team skill level, existing infrastructure...',
      required: false,
    },
    {
      name: 'revisit_condition',
      label: 'Under what conditions would you change this?',
      type: 'text',
      placeholder: 'If [X happens], this decision would need revisiting',
      required: false,
    },
  ],
};

// ============================================================================
// TEMPLATE 2: TECHNICAL CHALLENGE
// ============================================================================

export const TECHNICAL_CHALLENGE: TemplateDefinition = {
  value: 'technical_challenge',
  category: 'Technical Challenge',
  categoryValue: 'technical_challenge',
  description: 'I hit a wall and here\'s how I broke through it',
  fields: [
    {
      name: 'what_broke',
      label: 'What was broken or unclear?',
      type: 'textarea',
      placeholder:
        'Describe the problem. What was happening that shouldn\'t? What error did you see?',
      required: true,
      quickOptions: ['Runtime exception', 'Build failed', 'Data mismatch', 'Auth issue', 'Performance regression'],
      quickMode: 'single',
    },
    {
      name: 'what_tried',
      label: 'What did you try first — and why did it fail?',
      type: 'textarea',
      placeholder:
        'Document the approaches you tested. Why didn\'t they work? What new information did each attempt reveal?',
      required: true,
      quickOptions: ['Restarted service', 'Checked logs', 'Rolled back recent change', 'Added debug output', 'Compared with working environment'],
      quickMode: 'multi',
    },
    {
      name: 'what_worked',
      label: 'What actually fixed it?',
      type: 'textarea',
      placeholder:
        'The solution. Be specific. Include code snippets, commands, or exact steps if helpful.',
      required: true,
    },
    {
      name: 'root_cause',
      label: 'Root cause in one sentence',
      type: 'text',
      placeholder: 'The fundamental reason it was broken. One clear sentence.',
      required: true,
    },
    {
      name: 'confidence',
      label: 'Do you fully understand why it worked?',
      type: 'toggle',
      placeholder: 'Your confidence level that you understand the fix',
      required: true,
      options: ['Yes fully', 'Mostly', 'Not really'],
    },
  ],
};

// ============================================================================
// TEMPLATE 3: TRADEOFF
// ============================================================================

export const TRADEOFF: TemplateDefinition = {
  value: 'tradeoff',
  category: 'Tradeoff',
  categoryValue: 'tradeoff',
  description: 'I made a compromise and want to remember why',
  fields: [
    {
      name: 'gained',
      label: 'What did you gain with this approach?',
      type: 'textarea',
      placeholder:
        'What got better? Performance? Developer experience? Time to market? Team morale?',
      required: true,
    },
    {
      name: 'gave_up',
      label: 'What did you give up or sacrifice?',
      type: 'textarea',
      placeholder:
        'What got worse? What feature or quality did you lose? What technical debt did you accept?',
      required: true,
    },
    {
      name: 'constraints',
      label: 'What constraints forced this tradeoff?',
      type: 'text',
      placeholder:
        'Why couldn\'t you have it both ways? Budget? Timeline? Business priorities?',
      required: false,
    },
    {
      name: 'revisit_when',
      label: 'When should this decision be revisited?',
      type: 'text',
      placeholder: 'When circumstances change, revisit this tradeoff',
      required: false,
    },
    {
      name: 'risk_level',
      label: 'How comfortable are you with this tradeoff?',
      type: 'toggle',
      placeholder: 'Your comfort level with the choice you made',
      required: true,
      options: ['Comfortable', 'Acceptable', 'Risky'],
    },
  ],
};

// ============================================================================
// TEMPLATE 4: LESSON LEARNED
// ============================================================================

export const LESSON_LEARNED: TemplateDefinition = {
  value: 'lesson_learned',
  category: 'Lesson Learned',
  categoryValue: 'lesson_learned',
  description: 'I know something now I wish I knew before',
  fields: [
    {
      name: 'what_happened',
      label: 'What happened?',
      type: 'textarea',
      placeholder: 'Tell the story. What event made you learn this lesson?',
      required: true,
    },
    {
      name: 'assumption_vs_reality',
      label: 'What did you assume vs what was true?',
      type: 'textarea',
      placeholder:
        'I thought [X] would happen. But actually [Y]. This gap taught me...',
      required: true,
    },
    {
      name: 'rule_of_thumb',
      label: 'The rule of thumb going forward',
      type: 'text',
      placeholder:
        'The one-liner you\'ll remember in 6 months when you face something similar',
      required: true,
    },
    {
      name: 'who_should_know',
      label: 'Who else on your team should know this?',
      type: 'text',
      placeholder:
        'Are there people who should learn from this? Be specific if useful.',
      required: false,
    },
  ],
};

// ============================================================================
// TEMPLATE 5: BUG AUTOPSY
// ============================================================================

export const BUG_AUTOPSY: TemplateDefinition = {
  value: 'bug_autopsy',
  category: 'Bug Autopsy',
  categoryValue: 'bug_autopsy',
  description: 'It\'s fixed but let\'s understand the body',
  fields: [
    {
      name: 'symptoms',
      label:
        'What did you see? Console output, UI behavior, error messages',
      type: 'textarea',
      placeholder:
        'The observable behavior. What did the user see? What error message appeared? Include stack traces if available.',
      required: true,
      quickOptions: ['UI glitch', '500 server error', 'Timeout', 'Data not updating', 'Unexpected redirect'],
      quickMode: 'multi',
    },
    {
      name: 'ruled_out',
      label: 'What approaches did you try that didn\'t work?',
      type: 'textarea',
      placeholder:
        'The debugging steps. What did you eliminate? Why were they not the cause?',
      required: true,
    },
    {
      name: 'fix',
      label: 'What was the actual fix?',
      type: 'textarea',
      placeholder:
        'The exact change that made it work. Include code diff or specific line numbers if helpful.',
      required: true,
    },
    {
      name: 'root_cause',
      label: 'Root cause in one sentence',
      type: 'text',
      placeholder: 'The fundamental reason the bug existed. One clear sentence.',
      required: true,
    },
    {
      name: 'confidence',
      label: 'Honestly — do you fully understand why it worked?',
      type: 'toggle',
      placeholder: 'Your confidence that you understand why the bug happened',
      required: true,
      options: ['Yes fully', 'Mostly', 'Not really'],
    },
  ],
};

// ============================================================================
// TEMPLATE 6: INTEGRATION NOTE
// ============================================================================

export const INTEGRATION_NOTE: TemplateDefinition = {
  value: 'integration_note',
  category: 'Integration Note',
  categoryValue: 'integration_note',
  description: 'This library has a gotcha future-me needs to know',
  fields: [
    {
      name: 'the_gotcha',
      label: 'What\'s the undocumented behavior or gotcha?',
      type: 'textarea',
      placeholder:
        'Describe the unexpected behavior or limitation you discovered in this library/service.',
      required: true,
      quickOptions: ['Version-specific behavior', 'Hidden config requirement', 'Docs mismatch', 'SDK method side effect', 'Environment-specific issue'],
      quickMode: 'single',
    },
    {
      name: 'how_discovered',
      label:
        'How did you discover it — and how painful was it?',
      type: 'textarea',
      placeholder:
        'Did you find it by accident? In production? In tests? Document the pain points.',
      required: true,
      quickOptions: ['By accident', 'In production incident', 'While writing tests', 'During code review', 'From user report'],
      quickMode: 'single',
    },
    {
      name: 'fix_or_workaround',
      label: 'What\'s the fix or workaround?',
      type: 'textarea',
      placeholder:
        'How do you work around it? Is there a fix? How should you use the library correctly?',
      required: true,
      quickOptions: ['Pinned version', 'Added guard condition', 'Changed initialization order', 'Added retry/fallback', 'Used alternate API path'],
      quickMode: 'multi',
    },
    {
      name: 'is_documented',
      label: 'Is this documented anywhere officially?',
      type: 'toggle',
      placeholder: 'Is this gotcha mentioned in the official docs?',
      required: true,
      options: ['Yes', 'Partially', 'Not at all'],
    },
    {
      name: 'version_affected',
      label: 'Which version or environment does this affect?',
      type: 'text',
      placeholder: 'v1.2.3, Node.js 16+, React 18, Next.js 13...',
      required: false,
    },
  ],
};

// ============================================================================
// ALL TEMPLATES
// ============================================================================

export const ALL_TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  design_decision: DESIGN_DECISION,
  technical_challenge: TECHNICAL_CHALLENGE,
  tradeoff: TRADEOFF,
  lesson_learned: LESSON_LEARNED,
  bug_autopsy: BUG_AUTOPSY,
  integration_note: INTEGRATION_NOTE,
};

/**
 * Get template definition by type
 */
export function getTemplate(type: TemplateType): TemplateDefinition {
  return ALL_TEMPLATES[type];
}

/**
 * Get all templates as array
 */
export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(ALL_TEMPLATES);
}

/**
 * Get field definition from template
 */
export function getField(
  templateType: TemplateType,
  fieldName: string,
): FieldDefinition | undefined {
  const template = getTemplate(templateType);
  return template.fields.find((f) => f.name === fieldName);
}

/**
 * Get all required field names for a template
 */
export function getRequiredFields(templateType: TemplateType): string[] {
  const template = getTemplate(templateType);
  return template.fields.filter((f) => f.required).map((f) => f.name);
}

/**
 * Validate if all required fields are present
 */
export function validateFields(
  templateType: TemplateType,
  fields: Record<string, any>,
): { valid: boolean; missingFields: string[] } {
  const requiredFields = getRequiredFields(templateType);
  const missingFields = requiredFields.filter(
    (fieldName) =>
      !fields[fieldName] ||
      (typeof fields[fieldName] === 'string' &&
        fields[fieldName].trim().length === 0),
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
