// FXM: the portable muscle key. Parser, canonicaliser, validator, membership and grades.
//
//   FXM=1.0/<muscle>            a whole anatomical muscle      FXM=1.0/latissimus-dorsi
//   FXM=1.0/<muscle>.<part>     a part or head of a muscle     FXM=1.0/deltoid.acromial
//   FXM=1.0/g:<group>           a group (member set)           FXM=1.0/g:hamstrings
//
// Tokens are lowercase kebab-case. The key carries no side: laterality belongs to the exercise (FXI `x`).
// FDS publishes no muscle list. The format is checked alone; whether a muscle, part or group exists is checked only
// against a provider's vocabulary, when one is given.
import { FXM_MAJOR, FXM_REV } from './alphabet.js';
import type { Issue } from './syntax.js';

/** An identifier for the same structure in an open anatomy ontology. */
export interface Anchor {
  /** FMA (Foundational Model of Anatomy) or UBERON. */
  readonly system: 'FMA' | 'UBERON';
  /** The ontology's CURIE: `FMA:<id>`, `UBERON:<id>`. */
  readonly id: string;
  /** The term's label as the ontology writes it. */
  readonly label: string;
}

/** A part or head of a muscle that trains differently from the rest of it. */
export interface FxmPart {
  readonly token: string;
  readonly name: string;
  readonly anchors: readonly Anchor[];
  /** Why the part has no UBERON anchor, and what UBERON has instead. */
  readonly uberonGap?: string;
}

/** An anatomical muscle. When it has parts, the whole muscle is exactly the union of its parts. */
export interface FxmMuscle {
  readonly token: string;
  readonly name: string;
  readonly anchors: readonly Anchor[];
  readonly uberonGap?: string;
  readonly parts?: readonly FxmPart[];
}

/** A group, defined by the FXM keys of its members (muscles, parts or other groups), never by its name. */
export interface FxmGroup {
  readonly token: string;
  readonly name: string;
  readonly members: readonly string[];
  /** Ontology terms for the same set, where one exists. */
  readonly anchors: readonly Anchor[];
}

/** The prefix every FXM 1.0 key starts with. */
export const FXM_PREFIX = `FXM=${FXM_MAJOR}.${FXM_REV}/`;

export type FxmKey =
  | { readonly kind: 'muscle'; readonly muscle: string }
  | { readonly kind: 'part'; readonly muscle: string; readonly part: string }
  | { readonly kind: 'group'; readonly group: string };

export interface ParsedFxm {
  readonly ok: boolean;
  readonly issues: readonly Issue[];
  /** The canonical string; empty when the input is not an FXM at all. */
  readonly canonical: string;
  /** The key the body names; absent when the body cannot be read. */
  readonly key?: FxmKey;
}

/** A provider's muscles and groups, by token: what a key is checked against. */
export interface FxmVocabulary {
  readonly muscles: ReadonlyMap<string, FxmMuscle>;
  readonly groups: ReadonlyMap<string, FxmGroup>;
}

const TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const FXM_HEAD = /^FXM=(\d+)\.(\d+)([SN]?)\/(.*)$/s;

/** True when `value` is an FXM token: lowercase kebab-case. */
export const isFxmToken = (value: string): boolean => TOKEN.test(value);

/** Writes a key in its canonical text form. */
export function formatFxm(key: FxmKey): string {
  if (key.kind === 'group') return `${FXM_PREFIX}g:${key.group}`;
  return key.kind === 'part' ? `${FXM_PREFIX}${key.muscle}.${key.part}` : `${FXM_PREFIX}${key.muscle}`;
}

function readBody(body: string, issues: Issue[]): FxmKey | undefined {
  const bad = (message: string): undefined => { issues.push({ code: 'token', message, at: body }); return undefined; };
  if (body.startsWith('g:')) {
    const group = body.slice(2);
    return isFxmToken(group) ? { kind: 'group', group } : bad(`"${group}" is not a group token.`);
  }
  const [muscle = '', part, ...rest] = body.split('.');
  if (!isFxmToken(muscle)) return bad(`"${muscle}" is not a muscle token.`);
  if (part === undefined) return { kind: 'muscle', muscle };
  if (rest.length > 0 || !isFxmToken(part)) return bad(`"${body}" is not <muscle>.<part>.`);
  return { kind: 'part', muscle, part };
}

function checkKey(key: FxmKey, vocabulary: FxmVocabulary, issues: Issue[]): void {
  if (key.kind === 'group') {
    if (!vocabulary.groups.has(key.group)) issues.push({ code: 'unknown-group', message: `There is no group "${key.group}".` });
    return;
  }
  const muscle = vocabulary.muscles.get(key.muscle);
  if (muscle === undefined) issues.push({ code: 'unknown-muscle', message: `There is no muscle "${key.muscle}".` });
  else if (key.kind === 'part' && !(muscle.parts ?? []).some((p) => p.token === key.part)) {
    issues.push({ code: 'unknown-part', message: `Muscle "${key.muscle}" has no part "${key.part}".` });
  }
}

/**
 * Reads an FXM string and returns its canonical form. With a vocabulary, the muscle, part or group must be in it;
 * without one, only the format is checked. A written S or N flag is accepted and dropped: FXM has no extended layers,
 * so its canonical header is `FXM=1.0/`.
 */
export function parseFxm(input: string, vocabulary?: FxmVocabulary): ParsedFxm {
  const issues: Issue[] = [];
  const text = input.trim();
  const head = FXM_HEAD.exec(text);
  if (head === null) {
    if (/^FXM=\d+[SN]?\//.test(text)) issues.push({ code: 'no-rev', message: `FXM v1 strings carry the rules revision: write "${FXM_PREFIX}…". Bare "FXM=1/" strings are pre-release drafts, not v1.` });
    else issues.push({ code: 'prefix', message: `An FXM starts with "${FXM_PREFIX}".` });
    return { ok: false, issues, canonical: '' };
  }
  const [, majorText = '', revText = '', , body = ''] = head;
  if (Number(majorText) !== FXM_MAJOR) issues.push({ code: 'major', message: `Only FXM major version ${FXM_MAJOR} is defined.` });
  if (Number(revText) > FXM_REV) issues.push({ code: 'rev', message: `This checker knows revisions up to ${FXM_MAJOR}.${FXM_REV}.` });
  if (/^0\d/.test(revText)) issues.push({ code: 'rev', message: 'Write the revision without leading zeros.' });
  const key = readBody(body, issues);
  if (key !== undefined && vocabulary !== undefined) checkKey(key, vocabulary, issues);
  const canonical = key === undefined ? `${FXM_PREFIX}${body}` : formatFxm(key);
  return key === undefined ? { ok: false, issues, canonical } : { ok: issues.length === 0, issues, canonical, key };
}

/** The canonical FXM, or throws listing every issue. */
export function canonicalFxm(input: string, vocabulary?: FxmVocabulary): string {
  const p = parseFxm(input, vocabulary);
  if (!p.ok) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.canonical;
}

/**
 * Builds a vocabulary and checks it: tokens are kebab-case and unique, every group has members, every member
 * is a canonical key the vocabulary knows, and no group contains itself through other groups. Throws on the
 * first fault.
 */
export function createFxmVocabulary(muscles: readonly FxmMuscle[], groups: readonly FxmGroup[]): FxmVocabulary {
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
  const groupMap = new Map<string, FxmGroup>();
  for (const group of groups) {
    if (!isFxmToken(group.token)) throw new Error(`group token "${group.token}" is not kebab-case`);
    if (groupMap.has(group.token)) throw new Error(`duplicate group token "${group.token}"`);
    groupMap.set(group.token, group);
  }
  const vocabulary: FxmVocabulary = { muscles: muscleMap, groups: groupMap };
  for (const group of groups) {
    if (group.members.length === 0) throw new Error(`g:${group.token} has no members`);
    for (const member of group.members) {
      const p = parseFxm(member, vocabulary);
      if (!p.ok) throw new Error(`g:${group.token} member ${member}: ${p.issues.map((i) => i.code).join(', ')}`);
      if (p.canonical !== member) throw new Error(`g:${group.token} member ${member} is not canonical`);
    }
  }
  const done = new Set<string>();
  const visit = (token: string, path: readonly string[]): void => {
    if (path.includes(token)) throw new Error(`group cycle: ${[...path, token].map((t) => `g:${t}`).join(' -> ')}`);
    if (done.has(token)) return;
    for (const member of groupMap.get(token)?.members ?? []) {
      const key = parseFxm(member, vocabulary).key;
      if (key?.kind === 'group') visit(key.group, [...path, token]);
    }
    done.add(token);
  };
  for (const token of groupMap.keys()) visit(token, []);
  return vocabulary;
}

/** Reads a provider's muscle vocabulary file, `{muscles, groups}`, and checks it with `createFxmVocabulary`. */
export function readFxmVocabulary(raw: unknown): FxmVocabulary {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as { muscles?: unknown; groups?: unknown };
  if (!Array.isArray(o.muscles) || (o.groups !== undefined && !Array.isArray(o.groups))) {
    throw new Error('A muscle vocabulary is a JSON object {"muscles": [{token, name, anchors, parts?}], "groups": [{token, name, members, anchors}]}.');
  }
  return createFxmVocabulary(o.muscles as FxmMuscle[], (o.groups ?? []) as FxmGroup[]);
}

function keyOrThrow(input: string, vocabulary: FxmVocabulary): FxmKey {
  const p = parseFxm(input, vocabulary);
  if (!p.ok || p.key === undefined) throw new Error(`${input}: ${p.issues.map((i) => `${i.code}: ${i.message}`).join('; ')}`);
  return p.key;
}

/**
 * The anatomical leaves a key covers, sorted, without the prefix: a part is itself, a muscle with parts is its
 * parts, a muscle without parts is itself, a group is the union of its members' leaves. Throws for an invalid key.
 */
export function expandFxm(input: string, vocabulary: FxmVocabulary): string[] {
  const leaves = new Set<string>();
  const collect = (text: string): void => {
    const key = keyOrThrow(text, vocabulary);
    if (key.kind === 'group') {
      for (const member of vocabulary.groups.get(key.group)?.members ?? []) collect(member);
      return;
    }
    const parts = vocabulary.muscles.get(key.muscle)?.parts ?? [];
    if (key.kind === 'part' || parts.length === 0) leaves.add(formatFxm(key).slice(FXM_PREFIX.length));
    else for (const part of parts) leaves.add(`${key.muscle}.${part.token}`);
  };
  collect(input);
  return [...leaves].sort();
}

/** How two FXM keys relate, from the anatomical leaves each covers. */
export type FxmGrade = 'identical' | 'contains' | 'overlaps' | 'disjoint';

export type FxmMatch =
  | { readonly grade: 'identical' | 'overlaps' | 'disjoint'; readonly shared: readonly string[] }
  | { readonly grade: 'contains'; readonly container: 'a' | 'b'; readonly shared: readonly string[] };

/**
 * Grades two keys by their leaves: the same leaves are `identical` (a group and a muscle can be); one covering
 * all of the other's leaves and more is `contains`, with `container` naming the larger; some shared leaves are
 * `overlaps`; none are `disjoint`. Throws for an invalid key.
 */
export function gradeFxm(a: string, b: string, vocabulary: FxmVocabulary): FxmMatch {
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

/** The vocabulary term a valid key names: its name, its anchors and, for a muscle or part, its UBERON gap. */
export function fxmTerm(input: string, vocabulary: FxmVocabulary): { name: string; anchors: readonly Anchor[]; uberonGap?: string } {
  const key = keyOrThrow(input, vocabulary);
  if (key.kind === 'group') return vocabulary.groups.get(key.group)!;
  const muscle = vocabulary.muscles.get(key.muscle)!;
  return key.kind === 'part' ? (muscle.parts ?? []).find((p) => p.token === key.part)! : muscle;
}

// ───────────────────────────── muscle rows ─────────────────────────────

/**
 * What a muscle-list entry is. `muscle`, `part` and `group` carry an FXM key of that kind. `region` (a body
 * area spanning groups with different functions) becomes a category, and `not-a-muscle` leaves the muscle list;
 * both are set aside with a reason and carry no key.
 */
export const MUSCLE_CLASSES = ['muscle', 'part', 'group', 'region', 'not-a-muscle'] as const;
export type MuscleClass = (typeof MUSCLE_CLASSES)[number];

/** One muscle-list row: {id, slug, name, class, fxm, setAside?, members?, notes?}. */
export interface MuscleRow {
  readonly id?: unknown;
  readonly slug?: unknown;
  readonly name?: unknown;
  readonly class?: unknown;
  readonly fxm?: unknown;
  /** Why a region or non-muscle has no key. */
  readonly setAside?: unknown;
  /** A region's members, as FXM keys; on a group row, the group's members as the vocabulary writes them. */
  readonly members?: unknown;
  readonly notes?: unknown;
}

export interface MuscleRowCheck {
  readonly problems: readonly string[];
  readonly warnings: readonly string[];
  readonly changed: readonly string[];
  readonly row: Readonly<Record<string, unknown>>;
}

const KEY_KIND: Readonly<Record<string, FxmKey['kind']>> = { muscle: 'muscle', part: 'part', group: 'group' };
const KIND_FORM: Readonly<Record<FxmKey['kind'], string>> = { muscle: 'a <muscle> key', part: 'a <muscle>.<part> key', group: 'a g: key' };

/** Checks one muscle-list row and writes its canonical form. Without a vocabulary, keys are checked for format only. */
export function checkMuscleRow(row: MuscleRow, vocabulary?: FxmVocabulary): MuscleRowCheck {
  const problems: string[] = [];
  const changed: string[] = [];
  const out: Record<string, unknown> = { ...row };
  for (const field of ['id', 'slug', 'name'] as const) if (typeof row[field] !== 'string' || row[field] === '') problems.push(`${field} is missing`);
  const cls = row.class as MuscleClass;
  if (!MUSCLE_CLASSES.includes(cls)) problems.push(`class must be one of ${MUSCLE_CLASSES.join(', ')}`);
  const kind = KEY_KIND[cls];
  if (kind !== undefined) {
    if (typeof row.fxm !== 'string') problems.push(`a ${cls} row needs an fxm key`);
    else {
      const p = parseFxm(row.fxm, vocabulary);
      if (!p.ok) problems.push(`fxm: ${p.issues.map((i) => i.message).join('; ')}`);
      else {
        if (p.key?.kind !== kind) problems.push(`a ${cls} row needs ${KIND_FORM[kind]}`);
        if (p.canonical !== row.fxm) { changed.push('fxm'); out.fxm = p.canonical; }
      }
    }
    if (row.setAside !== undefined) problems.push(`a ${cls} row is keyed, not set aside`);
  } else if (MUSCLE_CLASSES.includes(cls)) {
    if (row.fxm !== null && row.fxm !== undefined) problems.push(`a ${cls} row takes no fxm key`);
    if (typeof row.setAside !== 'string' || row.setAside.trim() === '') problems.push(`a ${cls} row needs a setAside reason`);
    out.fxm = null;
  }
  if (row.members !== undefined) {
    if ((cls !== 'region' && cls !== 'group') || !Array.isArray(row.members)) problems.push('members belong to a region or group row, as a list of FXM keys');
    else if (cls === 'group') {
      const key = typeof out.fxm === 'string' ? parseFxm(out.fxm, vocabulary).key : undefined;
      const own = key?.kind === 'group' ? vocabulary?.groups.get(key.group)?.members : undefined;
      if (own !== undefined && JSON.stringify(row.members) !== JSON.stringify(own)) problems.push(`members: a group row lists its group's members as the vocabulary writes them: ${own.join(', ')}`);
      if (vocabulary === undefined) {
        for (const member of row.members) {
          const p = typeof member === 'string' ? parseFxm(member) : undefined;
          if (p === undefined || !p.ok || p.canonical !== member) problems.push(`members: ${String(member)} is not a canonical FXM key`);
        }
      }
    } else {
      for (const member of row.members) {
        const p = typeof member === 'string' ? parseFxm(member, vocabulary) : undefined;
        if (p === undefined || !p.ok || p.canonical !== member) problems.push(`members: ${String(member)} is not a canonical FXM key`);
      }
    }
  }
  if (row.notes !== undefined && (!Array.isArray(row.notes) || row.notes.some((n) => typeof n !== 'string'))) problems.push('notes must be a list of strings');
  return { problems, warnings: [], changed, row: out };
}
