// The muscle category key (FXMG): parser, checker, written form, members, grades and the muscle-to-category index.
//
//   FXMG=1.0/<set>                   a set or region FMA names            FXMG=1.0/hamstring
//   FXMG=1.0/<region>.<qualifier>    a compartment or layer of a region   FXMG=1.0/thigh.medial
//   FXMG=1.0/a:<joint>.<action>      the prime movers of a joint action   FXMG=1.0/a:hip.flex
//   FXMG=1.0/<term>+<term>[+…]       everything its terms cover           FXMG=1.0/erector-spinae+quadratus-lumborum
//
// A union term is one of the forms above or an FXM muscle or part code. Members always end in FXM leaves.
import { FXMG_MAJOR, FXMG_REV } from './alphabet';
import { expandFxm, FXM_PREFIX, FXM_VOCABULARY, isFxmToken, parseFxm } from './fxm';
import type { FxmVocabulary } from './fxm';
import { FXMG_ACTIONS, FXMG_SETS } from './fxmg-alphabet';
import type { Anchor, FxmgAction, FxmgMember, FxmgSet } from './fxmg-alphabet';
import type { Issue } from './syntax';

/** The prefix every FXMG 1.0 key starts with. */
export const FXMG_PREFIX = `FXMG=${FXMG_MAJOR}.${FXMG_REV}/`;

/** One term of a key: an FXMG set, compartment or action, or an FXM muscle or part. */
export type FxmgTerm =
  | { readonly kind: 'set'; readonly code: string }
  | { readonly kind: 'compartment'; readonly code: string }
  | { readonly kind: 'action'; readonly action: string }
  | { readonly kind: 'muscle'; readonly muscle: string }
  | { readonly kind: 'part'; readonly muscle: string; readonly part: string };

/** A key: one term, or the union of several. */
export interface FxmgKey {
  readonly terms: readonly FxmgTerm[];
}

/** What a key names: the kind of its one term, or `union` for several. */
export type FxmgForm = FxmgTerm['kind'] | 'union';

export interface ParsedFxmg {
  readonly ok: boolean;
  readonly issues: readonly Issue[];
  /** The canonical string; empty when the input is not an FXMG at all. */
  readonly canonical: string;
  /** The key in canonical form; absent when the body cannot be read. */
  readonly key?: FxmgKey;
}

/** The sets and actions a key is checked against, with the FXM vocabulary its members and union terms use. */
export interface FxmgVocabulary {
  readonly sets: ReadonlyMap<string, FxmgSet>;
  readonly actions: ReadonlyMap<string, FxmgAction>;
  readonly fxm: FxmVocabulary;
}

const FXMG_HEAD = /^FXMG=(\d+)\.(\d+)([SN]?)\/(.*)$/s;
const ACTION = /^[a-z]+(?:\.[a-z]+)+$/;

/** True when `value` is a set or compartment code: kebab-case words joined by dots. */
export const isFxmgCode = (value: string): boolean => value.split('.').every(isFxmToken);

const termText = (term: FxmgTerm): string => {
  switch (term.kind) {
    case 'action': return `a:${term.action}`;
    case 'part': return `${term.muscle}.${term.part}`;
    case 'muscle': return term.muscle;
    default: return term.code;
  }
};

/** Writes a key in text form, its terms in the order given. */
export function formatFxmg(key: FxmgKey): string {
  return `${FXMG_PREFIX}${key.terms.map(termText).join('+')}`;
}

/** The form of a key. */
export const fxmgForm = (key: FxmgKey): FxmgForm => (key.terms.length === 1 ? key.terms[0]!.kind : 'union');

function readTerm(text: string, vocabulary: FxmgVocabulary, issues: Issue[]): FxmgTerm | undefined {
  const issue = (code: string, message: string): undefined => { issues.push({ code, message, at: text }); return undefined; };
  if (text.startsWith('a:')) {
    const action = text.slice(2);
    if (!ACTION.test(action)) return issue('token', `"${text}" is not a:<joint>.<action>.`);
    return vocabulary.actions.has(action) ? { kind: 'action', action } : issue('unknown-action', `There is no action category "a:${action}": the joint action is unknown or has no keyed prime mover.`);
  }
  if (!isFxmgCode(text)) return issue('token', `"${text}" is not a category, muscle or part code.`);
  const [head = '', ...rest] = text.split('.');
  if (vocabulary.fxm.muscles.has(head)) {
    const p = parseFxm(`${FXM_PREFIX}${text}`, vocabulary.fxm);
    if (!p.ok || p.key === undefined) { for (const i of p.issues) issues.push({ ...i, at: text }); return undefined; }
    return p.key.kind === 'part' ? { kind: 'part', muscle: p.key.muscle, part: p.key.part } : { kind: 'muscle', muscle: p.key.muscle };
  }
  if (!vocabulary.sets.has(text)) return issue('unknown-category', `There is no category "${text}".`);
  return rest.length === 0 ? { kind: 'set', code: text } : { kind: 'compartment', code: text };
}

function leavesOfTerm(term: FxmgTerm, vocabulary: FxmgVocabulary, seen: readonly string[] = []): string[] {
  switch (term.kind) {
    case 'muscle': return expandFxm(`${FXM_PREFIX}${term.muscle}`, vocabulary.fxm);
    case 'part': return expandFxm(`${FXM_PREFIX}${term.muscle}.${term.part}`, vocabulary.fxm);
    case 'action': return membersLeaves(vocabulary.actions.get(term.action)!.members, vocabulary, seen);
    default: {
      if (seen.includes(term.code)) throw new Error(`category cycle: ${[...seen, term.code].join(' -> ')}`);
      return membersLeaves(vocabulary.sets.get(term.code)!.members, vocabulary, [...seen, term.code]);
    }
  }
}

function membersLeaves(members: readonly FxmgMember[], vocabulary: FxmgVocabulary, seen: readonly string[]): string[] {
  const leaves = new Set<string>();
  for (const member of members) {
    const key = member.key.startsWith(FXMG_PREFIX) ? readKey(member.key, vocabulary) : undefined;
    const found = key === undefined ? expandFxm(member.key, vocabulary.fxm) : key.terms.flatMap((t) => leavesOfTerm(t, vocabulary, seen));
    for (const leaf of found) leaves.add(leaf);
  }
  return [...leaves].sort();
}

/** Reads a member key's terms without canonicalising; used while a vocabulary is checked. */
function readKey(text: string, vocabulary: FxmgVocabulary): FxmgKey | undefined {
  const issues: Issue[] = [];
  const terms = text.slice(FXMG_PREFIX.length).split('+').map((t) => readTerm(t, vocabulary, issues));
  return issues.length > 0 ? undefined : { terms: terms as FxmgTerm[] };
}

/**
 * The canonical form of a union: terms sorted by their text and written once; a term whose leaves another term
 * covers is dropped, and of two terms with the same leaves the later one is dropped.
 */
function canonicalTerms(terms: readonly FxmgTerm[], vocabulary: FxmgVocabulary): FxmgTerm[] {
  const unique = [...new Map(terms.map((t) => [termText(t), t])).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, t]) => t);
  const leaves = unique.map((t) => new Set(leavesOfTerm(t, vocabulary)));
  const covers = (big: Set<string>, small: Set<string>): boolean => [...small].every((leaf) => big.has(leaf));
  return unique.filter((_, i) => !unique.some((__, j) => j !== i && covers(leaves[j]!, leaves[i]!) && (leaves[j]!.size > leaves[i]!.size || j < i)));
}

/**
 * Reads an FXMG v1 string, checks it against the vocabulary and returns its canonical form. A written S or N flag
 * is accepted and dropped: FXMG's canonical header is `FXMG=1.0/`.
 */
export function parseFxmg(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): ParsedFxmg {
  const issues: Issue[] = [];
  const text = input.trim();
  const head = FXMG_HEAD.exec(text);
  if (head === null) {
    if (/^FXMG=\d+[SN]?\//.test(text)) issues.push({ code: 'no-rev', message: `The header carries the major version and the revision: write "${FXMG_PREFIX}…".` });
    else issues.push({ code: 'prefix', message: `An FXMG starts with "${FXMG_PREFIX}".` });
    return { ok: false, issues, canonical: '' };
  }
  const [, majorText = '', revText = '', , body = ''] = head;
  if (Number(majorText) !== FXMG_MAJOR) issues.push({ code: 'major', message: `Only FXMG major version ${FXMG_MAJOR} is defined.` });
  if (Number(revText) > FXMG_REV) issues.push({ code: 'rev', message: `This checker knows revisions up to ${FXMG_MAJOR}.${FXMG_REV}.` });
  if (/^0\d/.test(revText)) issues.push({ code: 'rev', message: 'Write the revision without leading zeros.' });
  const before = issues.length;
  const terms = body.split('+').map((t) => readTerm(t, vocabulary, issues));
  if (issues.length > before) return { ok: false, issues, canonical: `${FXMG_PREFIX}${body}` };
  const key: FxmgKey = { terms: canonicalTerms(terms as FxmgTerm[], vocabulary) };
  return { ok: issues.length === 0, issues, canonical: formatFxmg(key), key };
}

/** The canonical FXMG, or throws listing every issue. */
export function canonicalFxmg(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string {
  const p = parseFxmg(input, vocabulary);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.canonical;
}

function keyOrThrow(input: string, vocabulary: FxmgVocabulary): FxmgKey {
  const p = parseFxmg(input, vocabulary);
  if (!p.ok || p.key === undefined) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.key;
}

/**
 * Builds a vocabulary and checks it: codes are well formed and unique, no code or region of a code is an FXM code,
 * every category has members, set members are canonical FXM or FXMG keys, action members are FXM keys, no set
 * holds itself through other sets, and a compartment covers less than its region where the region is a code.
 * Throws on the first fault.
 */
export function createFxmgVocabulary(sets: readonly FxmgSet[], actions: readonly FxmgAction[], fxm: FxmVocabulary = FXM_VOCABULARY): FxmgVocabulary {
  const setMap = new Map<string, FxmgSet>();
  for (const set of sets) {
    if (!isFxmgCode(set.code)) throw new Error(`"${set.code}" is not a category code`);
    if (setMap.has(set.code)) throw new Error(`duplicate category "${set.code}"`);
    const segments = set.code.split('.');
    for (let i = 1; i <= segments.length; i++) {
      const region = segments.slice(0, i).join('.');
      if (fxm.muscles.has(region)) throw new Error(`category ${set.code}: "${region}" is also an FXM code`);
    }
    setMap.set(set.code, set);
  }
  const actionMap = new Map<string, FxmgAction>();
  for (const action of actions) {
    if (!ACTION.test(action.action)) throw new Error(`"a:${action.action}" is not an action code`);
    if (actionMap.has(action.action)) throw new Error(`duplicate category "a:${action.action}"`);
    actionMap.set(action.action, action);
  }
  const vocabulary: FxmgVocabulary = { sets: setMap, actions: actionMap, fxm };
  const checkMembers = (label: string, members: readonly FxmgMember[], fxmOnly: boolean): void => {
    if (members.length === 0) throw new Error(`${label} has no members`);
    for (const { key } of members) {
      if (key.startsWith(FXMG_PREFIX) && !fxmOnly) {
        if (readKey(key, vocabulary) === undefined) throw new Error(`${label} member ${key} is not a known category`);
        continue;
      }
      if (!key.startsWith(FXM_PREFIX)) throw new Error(`${label} member ${key} is not an FXM key`);
      const p = parseFxm(key, fxm);
      if (!p.ok) throw new Error(`${label} member ${key}: ${p.issues.map((i) => i.code).join(', ')}`);
      if (p.canonical !== key) throw new Error(`${label} member ${key} is not canonical`);
    }
  };
  for (const set of sets) checkMembers(set.code, set.members, false);
  for (const action of actions) checkMembers(`a:${action.action}`, action.members, true);
  const leaves = new Map<string, Set<string>>();
  for (const set of sets) leaves.set(set.code, new Set(leavesOfTerm({ kind: 'set', code: set.code }, vocabulary)));
  for (const set of sets) {
    const region = set.code.split('.').slice(0, -1).join('.');
    const outer = leaves.get(region);
    if (outer === undefined) continue;
    const inner = leaves.get(set.code)!;
    if (inner.size >= outer.size || ![...inner].every((leaf) => outer.has(leaf))) throw new Error(`${set.code} does not cover less than ${region}`);
  }
  return vocabulary;
}

/** The shipped vocabulary: the sets and actions of fxmg-alphabet.ts over the FXM muscles. */
export const FXMG_VOCABULARY: FxmgVocabulary = createFxmgVocabulary(FXMG_SETS, FXMG_ACTIONS);

/** The FXM leaves a key covers, sorted, without the prefix. Throws for an invalid key. */
export function expandFxmg(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string[] {
  const key = keyOrThrow(input, vocabulary);
  return [...new Set(key.terms.flatMap((t) => leavesOfTerm(t, vocabulary)))].sort();
}

/** The FXM leaves of an FXM or an FXMG key. Throws for any other string or an invalid key. */
export function expandMuscleKey(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string[] {
  const text = input.trim();
  if (text.startsWith('FXMG=')) return expandFxmg(text, vocabulary);
  if (text.startsWith('FXM=')) return expandFxm(text, vocabulary.fxm);
  throw new Error(`${input}: not an FXM or FXMG key`);
}

/**
 * A key's members as FXM keys, sorted: a muscle where the key covers all of it, otherwise each part it covers.
 * Throws for an invalid key.
 */
export function fxmgMembers(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string[] {
  const leaves = new Set(expandFxmg(input, vocabulary));
  const members: string[] = [];
  for (const [token, muscle] of vocabulary.fxm.muscles) {
    const parts = (muscle.parts ?? []).map((part) => `${token}.${part.token}`);
    if (parts.length === 0) { if (leaves.has(token)) members.push(`${FXM_PREFIX}${token}`); continue; }
    const inside = parts.filter((leaf) => leaves.has(leaf));
    if (inside.length === parts.length) members.push(`${FXM_PREFIX}${token}`);
    else for (const leaf of inside) members.push(`${FXM_PREFIX}${leaf}`);
  }
  return members.sort();
}

/** How two category keys relate: `specific` names the key that covers less. */
export type FxmgMatch =
  | { readonly grade: 'same' | 'overlap' | 'different'; readonly shared: readonly string[] }
  | { readonly grade: 'more-specific'; readonly specific: 'a' | 'b'; readonly shared: readonly string[] };

/**
 * Grades two keys by the FXM leaves each covers: the same leaves are `same`; one covering part of the other's leaves
 * and nothing outside them is `more-specific`, with `specific` naming it; some shared leaves are `overlap`; none are
 * `different`. Throws for an invalid key.
 */
export function gradeFxmg(a: string, b: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): FxmgMatch {
  const left = expandFxmg(a, vocabulary);
  const right = new Set(expandFxmg(b, vocabulary));
  const shared = left.filter((leaf) => right.has(leaf));
  if (shared.length === 0) return { grade: 'different', shared };
  const allOfLeft = shared.length === left.length;
  const allOfRight = shared.length === right.size;
  if (allOfLeft && allOfRight) return { grade: 'same', shared };
  if (allOfLeft) return { grade: 'more-specific', specific: 'a', shared };
  if (allOfRight) return { grade: 'more-specific', specific: 'b', shared };
  return { grade: 'overlap', shared };
}

/** What the text of two canonical keys shows without a vocabulary. */
export type FxmgTextGrade = 'same' | { readonly grade: 'more-specific'; readonly specific: 'a' | 'b' };

const bodyOf = (input: string): string[] | undefined => {
  const head = FXMG_HEAD.exec(input.trim());
  return head === null ? undefined : (head[4] ?? '').split('+');
};

/**
 * Compares two canonical keys from their text alone: identical text is `same`; a compartment is more specific than
 * its region (`thigh.medial` against `thigh`); a union is more specific than a union holding all of its terms and
 * more. Any other pair needs the members, and gives `undefined`.
 */
export function gradeFxmgText(a: string, b: string): FxmgTextGrade | undefined {
  const left = bodyOf(a);
  const right = bodyOf(b);
  if (left === undefined || right === undefined) return undefined;
  if (left.join('+') === right.join('+')) return 'same';
  const within = (inner: string, outer: string): boolean => !inner.startsWith('a:') && inner.startsWith(`${outer}.`);
  if (left.length === 1 && right.length === 1) {
    if (within(left[0]!, right[0]!)) return { grade: 'more-specific', specific: 'a' };
    if (within(right[0]!, left[0]!)) return { grade: 'more-specific', specific: 'b' };
    return undefined;
  }
  const subset = (inner: readonly string[], outer: readonly string[]): boolean => inner.length < outer.length && inner.every((t) => outer.includes(t));
  if (subset(left, right)) return { grade: 'more-specific', specific: 'a' };
  if (subset(right, left)) return { grade: 'more-specific', specific: 'b' };
  return undefined;
}

/** Whether a muscle key is inside a category: all its leaves (`in`), some (`partly-in`) or none (`not-in`). */
export interface FxmInFxmg {
  readonly relation: 'in' | 'partly-in' | 'not-in';
  readonly shared: readonly string[];
}

/** Places an FXM key against an FXMG key by the FXM key's leaves. Throws for an invalid key. */
export function fxmInFxmg(fxm: string, fxmg: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): FxmInFxmg {
  const leaves = expandFxm(fxm, vocabulary.fxm);
  const category = new Set(expandFxmg(fxmg, vocabulary));
  const shared = leaves.filter((leaf) => category.has(leaf));
  return { relation: shared.length === 0 ? 'not-in' : shared.length === leaves.length ? 'in' : 'partly-in', shared };
}

/** Every set and action of a vocabulary as a canonical key, sorted. */
export const fxmgKeys = (vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string[] =>
  [...[...vocabulary.sets.keys()].map((code) => `${FXMG_PREFIX}${code}`), ...[...vocabulary.actions.keys()].map((action) => `${FXMG_PREFIX}a:${action}`)].sort();

/** From each FXM leaf to every set and action key that holds it, sorted. */
export function buildFxmgIndex(vocabulary: FxmgVocabulary = FXMG_VOCABULARY): ReadonlyMap<string, readonly string[]> {
  const index = new Map<string, string[]>();
  for (const key of fxmgKeys(vocabulary)) for (const leaf of expandFxmg(key, vocabulary)) index.set(leaf, [...(index.get(leaf) ?? []), key]);
  return index;
}

/** The set and action keys an FXM key is wholly in, sorted. Throws for an invalid key. */
export function fxmgCategoriesOf(fxm: string, index: ReadonlyMap<string, readonly string[]> = buildFxmgIndex(), vocabulary: FxmgVocabulary = FXMG_VOCABULARY): string[] {
  const leaves = expandFxm(fxm, vocabulary.fxm);
  const [first = '', ...rest] = leaves;
  return (index.get(first) ?? []).filter((key) => rest.every((leaf) => index.get(leaf)?.includes(key)));
}

/** The vocabulary entry of a key naming one set or action: its name, anchors and members. Throws for any other key. */
export function fxmgTerm(input: string, vocabulary: FxmgVocabulary = FXMG_VOCABULARY): { name: string; anchors: readonly Anchor[]; members: readonly FxmgMember[] } {
  const key = keyOrThrow(input, vocabulary);
  const term = key.terms.length === 1 ? key.terms[0]! : undefined;
  if (term?.kind === 'set' || term?.kind === 'compartment') return vocabulary.sets.get(term.code)!;
  if (term?.kind === 'action') {
    const action = vocabulary.actions.get(term.action)!;
    return { name: action.name, anchors: action.related ?? [], members: action.members };
  }
  throw new Error(`${input}: not a single set or action`);
}
