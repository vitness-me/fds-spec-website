// The draft specification this package implements, read from the repository: the published question flow, the worked
// examples, and every descriptor string the pages quote. A page that states a string or a flow the encoder does not
// produce fails here.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { FXI_RULES } from '../src/alphabet.js';
import { build } from '../src/build.js';
import type { Answers } from '../src/build.js';
import { CHANGE_OPENS, DEFAULT_FLOW, FACTS, MAX_PHASES, publishedQuestions } from '../src/flow.js';
import { parseFxm } from '../src/fxm.js';
import { parseFxe, parseFxi } from '../src/syntax.js';
import { REPO } from './support.js';

const PAGES = `${REPO}specification/descriptors/`;
interface PublishedFlow { rules: string; facts: Record<string, string>; changeOpens: Record<string, string[]>; maxPhases: number; questions: { id: string; [k: string]: unknown }[] }
const published = JSON.parse(readFileSync(`${PAGES}question-flow.json`, 'utf8')) as PublishedFlow;

describe('the published question flow is the flow this encoder asks', () => {
  test('the same rules revision, facts, change openings and phase limit', () => {
    expect(published.rules).toBe(FXI_RULES);
    expect(published.facts).toEqual(FACTS);
    expect(published.changeOpens).toEqual(CHANGE_OPENS);
    expect(published.maxPhases).toBe(MAX_PHASES);
  });

  test('the same questions, in the same order, with the same options and conditions', () => {
    const ours = publishedQuestions(DEFAULT_FLOW) as { id: string }[];
    const theirs = published.questions.filter((q) => q.id !== 'word.*');
    expect(ours.map((q) => q.id)).toEqual(theirs.map((q) => q.id));
    for (const [i, q] of ours.entries()) expect(q, q.id).toEqual(theirs[i]);
  });

  test('the movement-word slot follows the movement question and is filled from a dataset', () => {
    const ids = published.questions.map((q) => q.id);
    expect(ids.indexOf('word.*')).toBe(ids.indexOf('movement') + 1);
    expect(published.questions[ids.indexOf('word.*')]).toMatchObject({ fromDataset: 'movement-words', options: [] });
  });
});

/** The worked examples of question-flow.md: each question table and the result it states. */
function workedExamples(): { title: string; answers: Answers; fxi: string | null; fxe: string[] }[] {
  const md = readFileSync(`${PAGES}question-flow.md`, 'utf8');
  const section = md.slice(md.indexOf('## Worked examples'), md.indexOf('\n## ', md.indexOf('## Worked examples') + 1));
  return section.split('\n### ').slice(1).map((part) => {
    const title = part.split('\n')[0]!;
    const answers: Record<string, string | string[]> = {};
    for (const [, q, a] of part.matchAll(/^\| `([^`]+)` \| ([^|]*) \|/gm)) {
      const codes = [...a!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
      answers[q!] = DEFAULT_FLOW.byId.get(q!)?.select === 'many' ? codes : codes[0]!;
    }
    const result = part.slice(part.indexOf('Result:'));
    const strings = [...result.split('\n')[0]!.matchAll(/`(FX[IE]=[^`]+)`/g)].map((m) => m[1]!);
    return { title, answers, fxi: strings.find((s) => s.startsWith('FXI=')) ?? null, fxe: strings.filter((s) => s.startsWith('FXE=')) };
  });
}

describe('every worked example builds the result the page states', () => {
  const examples = workedExamples();
  test('the page has worked examples to check', () => expect(examples.length).toBeGreaterThanOrEqual(3));
  for (const e of examples) {
    test(e.title, () => {
      const b = build({ id: e.title, answers: e.answers });
      expect(b.fxi).toBe(e.fxi);
      expect([b.fxe, ...(b.fxeFull === undefined ? [] : [b.fxeFull])]).toEqual(e.fxe);
    });
  }
});

describe('every descriptor string a specification page quotes is valid and canonical', () => {
  const quoted = new Map<string, string>();
  for (const page of readdirSync(PAGES).filter((f) => f.endsWith('.md'))) {
    for (const [, s] of readFileSync(`${PAGES}${page}`, 'utf8').matchAll(/`(FX[IEM]=\d+\.\d+[SN]?\/[^`\s]+)`/g)) {
      if (!s!.includes('<') && !s!.includes('…') && !quoted.has(s!)) quoted.set(s!, page);
    }
  }
  test('the pages quote enough strings to check', () => expect(quoted.size).toBeGreaterThan(20));
  for (const [s, page] of quoted) {
    test(`${page}: ${s}`, () => {
      const p = s.startsWith('FXI=') ? parseFxi(s) : s.startsWith('FXE=') ? parseFxe(s) : parseFxm(s);
      expect(p.issues.map((i) => i.message)).toEqual([]);
      expect(p.canonical).toBe(s);
    });
  }
});
