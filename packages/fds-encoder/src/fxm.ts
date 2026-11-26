// The muscle key (FXM): parser, checker, written form, leaves and grades.
//
//   FXM=1.0/<muscle>            a whole anatomical muscle      FXM=1.0/latissimus-dorsi
//   FXM=1.0/<muscle>.<part>     a part or head of a muscle     FXM=1.0/deltoid.acromial
//
// Tokens are lowercase kebab-case. The key carries no side: laterality belongs to the exercise (FXI `x`).
// A set of muscles is a muscle category, keyed by FXMG (fxmg.ts).
import { FXM_MAJOR, FXM_REV, FXMG_MAJOR, FXMG_REV } from './alphabet';
import { FXM_MUSCLES } from './fxm-alphabet';
import type { Anchor, FxmMuscle } from './fxm-alphabet';
import type { Issue } from './syntax';

/** The prefix every FXM 1.0 key starts with. */
export const FXM_PREFIX = `FXM=${FXM_MAJOR}.${FXM_REV}/`;

export type FxmKey =
  | { readonly kind: 'muscle'; readonly muscle: string }
  | { readonly kind: 'part'; readonly muscle: string; readonly part: string };

export interface ParsedFxm {
  readonly ok: boolean;
  readonly issues: readonly Issue[];
  /** The canonical string; empty when the input is not an FXM at all. */
  readonly canonical: string;
  /** The key the body names; absent when the body cannot be read. */
  readonly key?: FxmKey;
}

/** The muscles a key is checked against, by token. */
export interface FxmVocabulary {
  readonly muscles: ReadonlyMap<string, FxmMuscle>;
}

const TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const FXM_HEAD = /^FXM=(\d+)\.(\d+)([SN]?)\/(.*)$/s;

/** True when `value` is an FXM token: lowercase kebab-case. */
export const isFxmToken = (value: string): boolean => TOKEN.test(value);

/** Writes a key in its canonical text form. */
export function formatFxm(key: FxmKey): string {
  return key.kind === 'part' ? `${FXM_PREFIX}${key.muscle}.${key.part}` : `${FXM_PREFIX}${key.muscle}`;
}

function readBody(body: string, issues: Issue[]): FxmKey | undefined {
  const bad = (message: string): undefined => { issues.push({ code: 'token', message, at: body }); return undefined; };
  if (body.startsWith('g:')) {
    issues.push({ code: 'group', message: `FXM names one muscle or part. A set of muscles is a muscle category: write it as an FXMG key, "FXMG=${FXMG_MAJOR}.${FXMG_REV}/…".`, at: body });
    return undefined;
  }
  const [muscle = '', part, ...rest] = body.split('.');
  if (!isFxmToken(muscle)) return bad(`"${muscle}" is not a muscle token.`);
  if (part === undefined) return { kind: 'muscle', muscle };
  if (rest.length > 0 || !isFxmToken(part)) return bad(`"${body}" is not <muscle>.<part>.`);
  return { kind: 'part', muscle, part };
}

function checkKey(key: FxmKey, vocabulary: FxmVocabulary, issues: Issue[]): void {
  const muscle = vocabulary.muscles.get(key.muscle);
  if (muscle === undefined) issues.push({ code: 'unknown-muscle', message: `There is no muscle "${key.muscle}".` });
  else if (key.kind === 'part' && !(muscle.parts ?? []).some((p) => p.token === key.part)) {
    issues.push({ code: 'unknown-part', message: `Muscle "${key.muscle}" has no part "${key.part}".` });
  }
}

/**
 * Reads an FXM v1 string, checks it against the vocabulary and returns its canonical form. A written S or N
 * flag is accepted and dropped: FXM has no extended layers, so its canonical header is `FXM=1.0/`.
 */
export function parseFxm(input: string, vocabulary: FxmVocabulary = FXM_VOCABULARY): ParsedFxm {
  const issues: Issue[] = [];
  const text = input.trim();
  const head = FXM_HEAD.exec(text);
  if (head === null) {
    if (/^FXM=\d+[SN]?\//.test(text)) issues.push({ code: 'no-rev', message: `The header carries the major version and the revision: write "${FXM_PREFIX}…".` });
    else issues.push({ code: 'prefix', message: `An FXM starts with "${FXM_PREFIX}".` });
    return { ok: false, issues, canonical: '' };
  }
  const [, majorText = '', revText = '', , body = ''] = head;
  if (Number(majorText) !== FXM_MAJOR) issues.push({ code: 'major', message: `Only FXM major version ${FXM_MAJOR} is defined.` });
  if (Number(revText) > FXM_REV) issues.push({ code: 'rev', message: `This checker knows revisions up to ${FXM_MAJOR}.${FXM_REV}.` });
  if (/^0\d/.test(revText)) issues.push({ code: 'rev', message: 'Write the revision without leading zeros.' });
  const key = readBody(body, issues);
  if (key !== undefined) checkKey(key, vocabulary, issues);
  const canonical = key === undefined ? `${FXM_PREFIX}${body}` : formatFxm(key);
  return key === undefined ? { ok: false, issues, canonical } : { ok: issues.length === 0, issues, canonical, key };
}

/** The canonical FXM, or throws listing every issue. */
export function canonicalFxm(input: string, vocabulary: FxmVocabulary = FXM_VOCABULARY): string {
  const p = parseFxm(input, vocabulary);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.canonical;
}

/** Builds a vocabulary and checks it: muscle and part tokens are kebab-case and unique. Throws on the first fault. */
export function createFxmVocabulary(muscles: readonly FxmMuscle[]): FxmVocabulary {
  const muscleMap = new Map<string, FxmMuscle>();
  for (const muscle of muscles) {
    if (!isFxmToken(muscle.token)) throw new Error(`muscle token "${muscle.token}" is not kebab-case`);
    if (muscleMap.has(muscle.token)) throw new Error(`duplicate muscle token "${muscle.token}"`);
    const parts = new Set<string>();
    for (const part of muscle.parts ?? []) {
      if (!isFxmToken(part.token)) throw new Error(`part token "${muscle.token}.${part.token}" is not kebab-case`);
      if (parts.has(part.token)) throw new Error(`duplicate part token "${muscle.token}.${part.token}"`);
      parts.add(part.token);
    }
    muscleMap.set(muscle.token, muscle);
  }
  return { muscles: muscleMap };
}

/** The shipped vocabulary: the anatomical muscles of fxm-alphabet.ts. */
export const FXM_VOCABULARY: FxmVocabulary = createFxmVocabulary(FXM_MUSCLES);

function keyOrThrow(input: string, vocabulary: FxmVocabulary): FxmKey {
  const p = parseFxm(input, vocabulary);
  if (!p.ok || p.key === undefined) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.key;
}

/**
 * The anatomical leaves a key covers, sorted, without the prefix: a part is itself, a muscle with parts is its
 * parts, a muscle without parts is itself. Throws for an invalid key.
 */
export function expandFxm(input: string, vocabulary: FxmVocabulary = FXM_VOCABULARY): string[] {
  const key = keyOrThrow(input, vocabulary);
  const parts = vocabulary.muscles.get(key.muscle)?.parts ?? [];
  if (key.kind === 'part' || parts.length === 0) return [formatFxm(key).slice(FXM_PREFIX.length)];
  return parts.map((part) => `${key.muscle}.${part.token}`).sort();
}

/** How two FXM keys relate, from the anatomical leaves each covers. */
export type FxmGrade = 'identical' | 'contains' | 'overlaps' | 'disjoint';

export type FxmMatch =
  | { readonly grade: 'identical' | 'overlaps' | 'disjoint'; readonly shared: readonly string[] }
  | { readonly grade: 'contains'; readonly container: 'a' | 'b'; readonly shared: readonly string[] };

/**
 * Grades two keys by their leaves: the same leaves are `identical`; one covering
 * all of the other's leaves and more is `contains`, with `container` naming the larger; some shared leaves are
 * `overlaps`; none are `disjoint`. Throws for an invalid key.
 */
export function gradeFxm(a: string, b: string, vocabulary: FxmVocabulary = FXM_VOCABULARY): FxmMatch {
  const left = expandFxm(a, vocabulary);
  const right = new Set(expandFxm(b, vocabulary));
  const shared = left.filter((leaf) => right.has(leaf));
  if (shared.length === 0) return { grade: 'disjoint', shared };
  const allOfLeft = shared.length === left.length;
  const allOfRight = shared.length === right.size;
  if (allOfLeft && allOfRight) return { grade: 'identical', shared };
  if (allOfRight) return { grade: 'contains', container: 'a', shared };
  if (allOfLeft) return { grade: 'contains', container: 'b', shared };
  return { grade: 'overlaps', shared };
}

/** The vocabulary term a valid key names: its name, its anchors and its UBERON gap. */
export function fxmTerm(input: string, vocabulary: FxmVocabulary = FXM_VOCABULARY): { name: string; anchors: readonly Anchor[]; uberonNote?: string } {
  const key = keyOrThrow(input, vocabulary);
  const muscle = vocabulary.muscles.get(key.muscle)!;
  return key.kind === 'part' ? (muscle.parts ?? []).find((p) => p.token === key.part)! : muscle;
}
