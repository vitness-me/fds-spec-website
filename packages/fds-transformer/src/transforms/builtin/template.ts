/**
 * Template transform - apply simple templates
 */

import type { TransformFunction, TransformContext } from '../../core/types.js';

/**
 * Apply a template to the value
 */
export const template: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {},
  context: TransformContext
): unknown => {
  const templateValue = options.template;

  if (templateValue === undefined) {
    return value;
  }

  // If template is an object/array, process it recursively
  if (typeof templateValue === 'object' && templateValue !== null) {
    return processTemplateObject(templateValue, value, context);
  }

  // If template is a string, replace placeholders
  if (typeof templateValue === 'string') {
    return replaceTemplatePlaceholders(templateValue, value, context);
  }

  return templateValue;
};

/**
 * Process template object/array recursively
 */
function processTemplateObject(
  template: unknown,
  value: unknown,
  context: TransformContext
): unknown {
  if (Array.isArray(template)) {
    return template.map((item) => processTemplateObject(item, value, context));
  }

  if (typeof template === 'object' && template !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(template)) {
      result[key] = processTemplateObject(val, value, context);
    }
    return result;
  }

  if (typeof template === 'string') {
    return replaceTemplatePlaceholders(template, value, context);
  }

  return template;
}

/**
 * Replace {{placeholder}} in template strings
 */
function replaceTemplatePlaceholders(
  template: string,
  value: unknown,
  context: TransformContext
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path) => {
    // Special placeholders
    if (path === 'value') {
      return String(value ?? '');
    }

    if (path === 'index') {
      return String(context.field || '');
    }

    // Check source
    const sourceValue = getNestedValue(context.source, path);
    if (sourceValue !== undefined) {
      return String(sourceValue);
    }

    // Check target
    const targetValue = getNestedValue(context.target, path);
    if (targetValue !== undefined) {
      return String(targetValue);
    }

    // Return empty string for unresolved
    return '';
  });
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export default template;
