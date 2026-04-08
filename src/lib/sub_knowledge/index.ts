// src/lib/sub_knowledge/index.ts

export { RULES as TOPIC_RULES, EXAMPLES as TOPIC_EXAMPLES } from './topic-methodology';
export { RULES as POSITION_RULES, EXAMPLES as POSITION_EXAMPLES } from './positioning';
export { RULES as OUTLINE_RULES, EXAMPLES as OUTLINE_EXAMPLES } from './outline-structure';
export { RULES as WRITING_RULES, EXAMPLES as WRITING_EXAMPLES } from './writing-fundamentals';
export { RULES as INFO_RULES, EXAMPLES as INFO_EXAMPLES } from './info-efficiency';
export { RULES as EMOTION_RULES, EXAMPLES as EMOTION_EXAMPLES } from './emotion-triggers';
export { RULES as ECOMMERCE_RULES, EXAMPLES as ECOMMERCE_EXAMPLES } from './ecommerce-templates';
export { RULES as SAFETY_RULES, EXAMPLES as SAFETY_EXAMPLES } from './content-safety';

export type ModuleId =
  | 'topic-methodology'
  | 'positioning'
  | 'outline-structure'
  | 'writing-fundamentals'
  | 'info-efficiency'
  | 'emotion-triggers'
  | 'ecommerce-templates'
  | 'content-safety';

interface ModuleEntry {
  rules: string;
  examples: string;
}

const MODULE_REGISTRY: Record<ModuleId, () => ModuleEntry> = {
  'topic-methodology': () => ({ rules: require('./topic-methodology').RULES, examples: require('./topic-methodology').EXAMPLES }),
  'positioning': () => ({ rules: require('./positioning').RULES, examples: require('./positioning').EXAMPLES }),
  'outline-structure': () => ({ rules: require('./outline-structure').RULES, examples: require('./outline-structure').EXAMPLES }),
  'writing-fundamentals': () => ({ rules: require('./writing-fundamentals').RULES, examples: require('./writing-fundamentals').EXAMPLES }),
  'info-efficiency': () => ({ rules: require('./info-efficiency').RULES, examples: require('./info-efficiency').EXAMPLES }),
  'emotion-triggers': () => ({ rules: require('./emotion-triggers').RULES, examples: require('./emotion-triggers').EXAMPLES }),
  'ecommerce-templates': () => ({ rules: require('./ecommerce-templates').RULES, examples: require('./ecommerce-templates').EXAMPLES }),
  'content-safety': () => ({ rules: require('./content-safety').RULES, examples: require('./content-safety').EXAMPLES }),
};

/**
 * Load multiple knowledge modules by ID, optionally including examples.
 * Used by prompt.ts to dynamically compose system prompts.
 */
export function loadModules(
  selections: { id: ModuleId; includeExamples?: boolean }[]
): string {
  return selections
    .map(({ id, includeExamples }) => {
      const entry = MODULE_REGISTRY[id]();
      return includeExamples ? `${entry.rules}\n\n${entry.examples}` : entry.rules;
    })
    .join('\n\n');
}
