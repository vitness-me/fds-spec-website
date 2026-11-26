// Keys in FDS records. The only fields read or written are the record's own key field and the key fields of the
// references it holds (`fxi` on an exercise reference, `fxe` on an equipment reference, `fxm` and `fxmg` on a muscle
// reference), and, for matching, a record's id and name.
import { compareFxe } from './compare';
import { crossCheck, mainEquipment } from './crosscheck';
import { fxmInFxmg } from './fxmg';
import { checkKey } from './keys';
import type { KeyType } from './keys';
import type { MatchEntry } from './match';
import { parseFxi } from './syntax';
import type { Issue } from './syntax';

/** The four key fields and the key type each holds. */
export const KEY_FIELDS = { fxi: 'FXI', fxe: 'FXE', fxm: 'FXM', fxmg: 'FXMG' } as const satisfies Record<string, KeyType>;
export type KeyField = keyof typeof KEY_FIELDS;

/** One key in a record: where it is (`targets.primary[0].fxm`), its field and its text. */
export interface RecordKey {
  readonly path: string;
  readonly field: KeyField;
  readonly key: string;
}

/** A finding in a record, at the path of the key it concerns. */
export interface RecordIssue extends Issue {
  readonly path: string;
}

export interface RecordCheck {
  /** Keys that do not check, or a field holding the wrong type of key. The record is not valid until they are fixed. */
  readonly problems: readonly RecordIssue[];
  /** Keys that check but disagree with each other: an exercise and its equipment, a muscle and its category. */
  readonly warnings: readonly RecordIssue[];
  /** Keys that check but are not in their standard written form, with the written form. */
  readonly rewritten: readonly { readonly path: string; readonly from: string; readonly to: string }[];
  /** The record with every key that checks in its written form. Nothing else in it changes. */
  readonly record: unknown;
}

/** A step on the way to a value: a property name or an array index. */
export type RecordStep = string | number;

/** A key with the property names and indexes that lead to it. */
interface FoundKey extends RecordKey {
  readonly steps: readonly RecordStep[];
}

/** Subtrees that hold free-form data. Nothing in them is read or written. */
const FREE_FORM = new Set(['attributes', 'extensions', 'metadata']);
const ALL_FIELDS = Object.keys(KEY_FIELDS) as KeyField[];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isKeyField = (k: string): k is KeyField => Object.hasOwn(KEY_FIELDS, k);
const IDENTIFIER = /^[A-Za-z_$][\w$-]*$/;

/** A path for people to read: `targets.primary[0].fxm`. A property name that is not a plain word is quoted: `["a.b"]`. */
export function pathOf(steps: readonly RecordStep[]): string {
  let out = '';
  for (const step of steps) {
    if (typeof step === 'number') out += `[${step}]`;
    else if (IDENTIFIER.test(step)) out += out === '' ? step : `.${step}`;
    else out += `[${JSON.stringify(step)}]`;
  }
  return out;
}

/**
 * The key fields an object holds, from where it sits: every key field on the record itself, `fxi` on an exercise
 * reference (`exercise`, `alternatives[]`), `fxe` on an equipment reference (`equipment`, `equipment.required[]`,
 * `equipment.optional[]`), and `fxm` and `fxmg` on a muscle reference (`targets.primary[]`, `targets.secondary[]`).
 */
function keyFieldsAt(steps: readonly RecordStep[]): readonly KeyField[] {
  const n = steps.length;
  if (n === 0) return ALL_FIELDS;
  const [last, prev, prev2] = [steps[n - 1], steps[n - 2], steps[n - 3]];
  if (last === 'exercise' || (typeof last === 'number' && prev === 'alternatives')) return ['fxi'];
  if (last === 'equipment' || (typeof last === 'number' && (prev === 'required' || prev === 'optional') && prev2 === 'equipment')) return ['fxe'];
  if (typeof last === 'number' && (prev === 'primary' || prev === 'secondary') && prev2 === 'targets') return ['fxm', 'fxmg'];
  return [];
}

function findKeys(record: unknown): FoundKey[] {
  const out: FoundKey[] = [];
  const walk = (node: unknown, steps: readonly RecordStep[]): void => {
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, [...steps, i])); return; }
    if (!isObject(node)) return;
    const fields = keyFieldsAt(steps);
    for (const [k, v] of Object.entries(node)) {
      if (isKeyField(k) && typeof v === 'string') {
        if (fields.includes(k)) out.push({ path: pathOf([...steps, k]), steps: [...steps, k], field: k, key: v });
      } else if (!FREE_FORM.has(k)) walk(v, [...steps, k]);
    }
  };
  walk(record, []);
  return out;
}

/**
 * Every key in a record, in document order: the record's own key field and the key fields of the references it holds.
 * A key field anywhere else, under `metadata`, `attributes` or `extensions` among them, is not a key and is skipped,
 * as is a key field that is not a string.
 */
export function recordKeys(record: unknown): RecordKey[] {
  return findKeys(record).map(({ path, field, key }) => ({ path, field, key }));
}

/** The object that holds the value at the end of a path. */
function holderOf(record: unknown, steps: readonly RecordStep[]): Record<string, unknown> | undefined {
  let node: unknown = record;
  for (const step of steps.slice(0, -1)) {
    if (typeof step === 'number') node = Array.isArray(node) ? node[step] : undefined;
    else node = isObject(node) && Object.hasOwn(node, step) ? node[step] : undefined;
  }
  return isObject(node) ? node : undefined;
}

/** The required equipment references of an exercise: its main equipment is one of them. Optional equipment never is. */
const isRequiredEquipment = (steps: readonly RecordStep[]): boolean =>
  steps.length === 4 && steps[0] === 'equipment' && steps[1] === 'required' && typeof steps[2] === 'number';
const holderId = (steps: readonly RecordStep[]): string => JSON.stringify(steps.slice(0, -1));

/**
 * The equipment reference an exercise key is checked against: the first equipment reference with a key that does not
 * contradict the exercise's main equipment code, else the first equipment reference with a key.
 */
function mainEquipmentRef(fxi: string, refs: readonly RecordKey[]): RecordKey | undefined {
  const p = parseFxi(fxi);
  if (!p.ok || refs.length === 0) return undefined;
  const main = mainEquipment(p.layers).fxe;
  return refs.find((r) => compareFxe(main, r.key).relation !== 'contradicting') ?? refs[0];
}

/** A key to write: the steps to it and its written form. */
export interface RecordEdit {
  readonly steps: readonly RecordStep[];
  readonly to: string;
}

/** {@link checkRecord}, with the steps to each key it rewrites. */
export function checkRecordEdits(record: unknown): RecordCheck & { readonly edits: readonly RecordEdit[] } {
  const copy: unknown = structuredClone(record);
  const keys = findKeys(copy);
  const problems: RecordIssue[] = [];
  const warnings: RecordIssue[] = [];
  const rewritten: { path: string; from: string; to: string }[] = [];
  const edits: RecordEdit[] = [];
  const written = new Map<FoundKey, string>();
  for (const k of keys) {
    const c = checkKey(k.key);
    if (c.type !== KEY_FIELDS[k.field]) {
      problems.push({ path: k.path, code: 'wrong-type', message: `${k.field} holds ${c.type === undefined ? 'no key' : `a ${c.type} key`}; it holds a ${KEY_FIELDS[k.field]} key.` });
      continue;
    }
    for (const i of c.issues) problems.push({ path: k.path, ...i });
    if (!c.ok) continue;
    written.set(k, c.written);
    if (c.written !== k.key) {
      rewritten.push({ path: k.path, from: k.key, to: c.written });
      edits.push({ steps: k.steps, to: c.written });
      holderOf(copy, k.steps)![k.field] = c.written;
    }
  }

  const checked = keys.filter((k) => written.has(k)).map((k) => ({ ...k, key: written.get(k)! }));
  const exercise = checked.find((k) => k.field === 'fxi' && k.steps.length === 1);
  if (exercise !== undefined) {
    const ref = mainEquipmentRef(exercise.key, checked.filter((k) => k.field === 'fxe' && isRequiredEquipment(k.steps)));
    if (ref !== undefined) for (const w of crossCheck(exercise.key, ref.key)) warnings.push({ path: ref.path, ...w });
  }
  for (const m of checked.filter((k) => k.field === 'fxm' && k.steps.length > 1)) {
    const g = checked.find((k) => k.field === 'fxmg' && holderId(k.steps) === holderId(m.steps));
    if (g === undefined) continue;
    const place = fxmInFxmg(m.key, g.key);
    if (place.relation !== 'in') {
      warnings.push({ path: g.path, code: 'category', message: `${m.key} is ${place.relation === 'partly-in' ? 'only partly' : 'not'} in its category ${g.key}.` });
    }
  }
  return { problems, warnings, rewritten, record: copy, edits };
}

/**
 * Checks every key in a record and writes each that checks in its standard written form. An exercise key is checked
 * against the key of its main equipment among the record's required equipment references (`equipment.required[].fxe`),
 * and a muscle reference's muscle key is checked to be in its category key.
 */
export function checkRecord(record: unknown): RecordCheck {
  const { edits: _edits, ...check } = checkRecordEdits(record);
  return check;
}

const textOf = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined);

/**
 * A record as a match entry: its own key (`fxi`, `fxe`, `fxm` or `fxmg`, the first present), its id (`exerciseId` or
 * `id`), its name (`canonical.name`, else `name`) and, for an exercise, the key of its main required equipment reference.
 * Undefined when the record carries no key of its own or no id.
 */
export function matchEntryOf(record: unknown): MatchEntry | undefined {
  if (!isObject(record)) return undefined;
  const own = (k: string): unknown => (Object.hasOwn(record, k) ? record[k] : undefined);
  const field = ALL_FIELDS.find((f) => typeof own(f) === 'string');
  const id = textOf(own('exerciseId')) ?? textOf(own('id'));
  if (field === undefined || id === undefined) return undefined;
  const key = own(field) as string;
  const canonical = own('canonical');
  const name = (isObject(canonical) && Object.hasOwn(canonical, 'name') ? textOf(canonical.name) : undefined) ?? textOf(own('name'));
  let fxe: string | undefined;
  if (field === 'fxi') {
    const refs = findKeys(record).filter((k) => k.field === 'fxe' && isRequiredEquipment(k.steps) && checkKey(k.key).ok);
    fxe = mainEquipmentRef(key, refs)?.key;
  }
  return { id, key, ...(name === undefined ? {} : { name }), ...(fxe === undefined ? {} : { fxe }) };
}
