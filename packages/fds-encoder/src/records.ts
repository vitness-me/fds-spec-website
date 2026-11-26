// Keys in FDS records. The only fields read or written are the four key fields, `fxi`, `fxe`, `fxm` and `fxmg`, on a
// record and on the references it holds (exerciseRef, equipmentRef, muscleRef), and, for matching, a record's id
// and name.
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

/** The required equipment references of an exercise: its main equipment is one of them. Optional equipment never is. */
const REQUIRED = /^equipment\.required\[\d+\]\.fxe$/;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const join = (path: string, k: string | number): string => (typeof k === 'number' ? `${path}[${k}]` : path === '' ? k : `${path}.${k}`);

/** Every key field in a record and the references it holds, in document order. A key field that is not a string is skipped. */
export function recordKeys(record: unknown): RecordKey[] {
  const out: RecordKey[] = [];
  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, join(path, i))); return; }
    if (!isObject(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k in KEY_FIELDS && typeof v === 'string') out.push({ path: join(path, k), field: k as KeyField, key: v });
      else walk(v, join(path, k));
    }
  };
  walk(record, '');
  return out;
}

/** The object at a path, the parent of a key field. */
function holderOf(record: unknown, path: string): Record<string, unknown> | undefined {
  const steps = path.match(/[^.[\]]+/g) ?? [];
  let node: unknown = record;
  for (const step of steps.slice(0, -1)) node = Array.isArray(node) ? node[Number(step)] : isObject(node) ? node[step] : undefined;
  return isObject(node) ? node : undefined;
}

const parentPath = (path: string): string => path.replace(/(\.[^.[\]]+|\[\d+\])$/, '');

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

/**
 * Checks every key in a record and writes each that checks in its standard written form. An exercise key is checked
 * against the key of its main equipment among the record's required equipment references (`equipment.required[].fxe`), and a muscle
 * reference's muscle key is checked to be in its category key.
 */
export function checkRecord(record: unknown): RecordCheck {
  const copy: unknown = structuredClone(record);
  const keys = recordKeys(copy);
  const problems: RecordIssue[] = [];
  const warnings: RecordIssue[] = [];
  const rewritten: { path: string; from: string; to: string }[] = [];
  const written = new Map<string, string>();
  for (const k of keys) {
    const c = checkKey(k.key);
    if (c.type !== KEY_FIELDS[k.field]) {
      problems.push({ path: k.path, code: 'wrong-type', message: `${k.field} holds ${c.type === undefined ? 'no key' : `a ${c.type} key`}; it holds a ${KEY_FIELDS[k.field]} key.` });
      continue;
    }
    for (const i of c.issues) problems.push({ path: k.path, ...i });
    if (!c.ok) continue;
    written.set(k.path, c.written);
    if (c.written !== k.key) {
      rewritten.push({ path: k.path, from: k.key, to: c.written });
      holderOf(copy, k.path)![k.field] = c.written;
    }
  }

  const ok = (path: string): string | undefined => written.get(path);
  const exercise = keys.find((k) => k.field === 'fxi' && k.path === 'fxi');
  const equipmentRefs = keys.filter((k) => k.field === 'fxe' && REQUIRED.test(k.path) && ok(k.path) !== undefined)
    .map((k) => ({ ...k, key: ok(k.path)! }));
  if (exercise !== undefined && ok(exercise.path) !== undefined) {
    const ref = mainEquipmentRef(ok(exercise.path)!, equipmentRefs);
    if (ref !== undefined) for (const w of crossCheck(ok(exercise.path)!, ref.key)) warnings.push({ path: ref.path, ...w });
  }
  for (const m of keys.filter((k) => k.field === 'fxm' && ok(k.path) !== undefined)) {
    const g = join(parentPath(m.path), 'fxmg');
    const category = ok(g);
    if (category === undefined || g === m.path) continue;
    const place = fxmInFxmg(ok(m.path)!, category);
    if (place.relation !== 'in') {
      warnings.push({ path: g, code: 'category', message: `${ok(m.path)} is ${place.relation === 'partly-in' ? 'only partly' : 'not'} in its category ${category}.` });
    }
  }
  return { problems, warnings, rewritten, record: copy };
}

const textOf = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined);

/**
 * A record as a match entry: its own key (`fxi`, `fxe`, `fxm` or `fxmg`, the first present), its id (`exerciseId` or
 * `id`), its name (`canonical.name`, else `name`) and, for an exercise, the key of its main required equipment reference.
 * Undefined when the record carries no key of its own or no id.
 */
export function matchEntryOf(record: unknown): MatchEntry | undefined {
  if (!isObject(record)) return undefined;
  const field = (Object.keys(KEY_FIELDS) as KeyField[]).find((f) => typeof record[f] === 'string');
  const id = textOf(record.exerciseId) ?? textOf(record.id);
  if (field === undefined || id === undefined) return undefined;
  const key = record[field] as string;
  const canonical = isObject(record.canonical) ? record.canonical : {};
  const name = textOf(canonical.name) ?? textOf(record.name);
  let fxe: string | undefined;
  if (field === 'fxi') {
    const refs = recordKeys(record).filter((k) => k.field === 'fxe' && REQUIRED.test(k.path) && checkKey(k.key).ok);
    fxe = mainEquipmentRef(key, refs)?.key;
  }
  return { id, key, ...(name === undefined ? {} : { name }), ...(fxe === undefined ? {} : { fxe }) };
}
