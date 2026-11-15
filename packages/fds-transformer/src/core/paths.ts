/**
 * Mapping field paths: dot notation, with `name[index]` for an array element.
 */

/** The value at a mapping path, or undefined */
export function getMappingPathValue(obj: Record<string, unknown>, path: string): unknown {
  let current: unknown = obj;

  for (const part of path.split('.')) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array index notation: field[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, fieldName, index] = arrayMatch;
      current = (current as Record<string, unknown>)[fieldName];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/** Whether `path` lies beneath `ancestor` (`a.b` and `a[0]` are beneath `a`) */
export function isBeneath(path: string, ancestor: string): boolean {
  return path.startsWith(`${ancestor}.`) || path.startsWith(`${ancestor}[`);
}
