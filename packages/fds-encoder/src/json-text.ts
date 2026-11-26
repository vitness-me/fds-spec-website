// Edits string values in JSON text in place, so everything else in the text keeps its exact form: number literals,
// spacing, key order and line breaks.
import type { RecordStep } from './records';

/** A string value to replace: the property names and array indexes that lead to it, and its new text. */
export interface JsonStringEdit {
  readonly steps: readonly RecordStep[];
  readonly to: string;
}

const WHITESPACE = ' \t\n\r';

/**
 * Replaces string values in a JSON text and leaves every other character as it was. Each edit names a string value
 * by its steps; when a property name repeats in one object, the last one is edited, the one `JSON.parse` reads.
 * Throws a SyntaxError for text that is not JSON.
 */
export function editJsonStrings(text: string, edits: readonly JsonStringEdit[]): string {
  JSON.parse(text);
  if (edits.length === 0) return text;
  const wanted = new Map(edits.map((e) => [JSON.stringify(e.steps), e.to]));
  const spans = new Map<string, { start: number; end: number; to: string }>();
  let i = 0;
  const skipSpace = (): void => { while (i < text.length && WHITESPACE.includes(text[i]!)) i++; };
  const readString = (): string => {
    const start = i;
    i++;
    while (text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    i++;
    return JSON.parse(text.slice(start, i)) as string;
  };
  const value = (steps: readonly RecordStep[]): void => {
    skipSpace();
    const c = text[i];
    if (c === '{') {
      i++;
      skipSpace();
      if (text[i] === '}') { i++; return; }
      for (;;) {
        skipSpace();
        const name = readString();
        skipSpace();
        i++; // :
        value([...steps, name]);
        skipSpace();
        if (text[i++] === '}') return;
      }
    }
    if (c === '[') {
      i++;
      skipSpace();
      if (text[i] === ']') { i++; return; }
      for (let n = 0; ; n++) {
        value([...steps, n]);
        skipSpace();
        if (text[i++] === ']') return;
      }
    }
    if (c === '"') {
      const start = i;
      readString();
      const id = JSON.stringify(steps);
      const to = wanted.get(id);
      if (to !== undefined) spans.set(id, { start, end: i, to });
      return;
    }
    while (i < text.length && !`,]}${WHITESPACE}`.includes(text[i]!)) i++;
  };
  value([]);
  let out = text;
  for (const s of [...spans.values()].sort((a, b) => b.start - a.start)) out = out.slice(0, s.start) + JSON.stringify(s.to) + out.slice(s.end);
  return out;
}
