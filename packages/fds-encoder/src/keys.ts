// One entry point for all four structural keys: which key a text is, its written form, and how two keys compare.
import { compareFxe, compareFxi } from './compare';
import type { CompareResult, LayerRelation } from './compare';
import { gradeFxm, parseFxm } from './fxm';
import { gradeFxmg, parseFxmg } from './fxmg';
import { parseFxe, parseFxi } from './syntax';
import type { Issue } from './syntax';

/** The four structural keys, by header. */
export type KeyType = 'FXI' | 'FXE' | 'FXM' | 'FXMG';

/**
 * How two keys of one type compare. `same`: they describe the same thing. `more-specific`: one describes part of what
 * the other does, and nothing outside it. `overlap`: neither is more specific, and they may describe the same thing
 * (for muscle and category keys: they share some muscles, and each covers one the other doesn't). `different`: they
 * can't describe the same thing.
 */
export type KeyResult = 'same' | 'more-specific' | 'overlap' | 'different';

export interface KeyComparison {
  readonly type: KeyType;
  readonly result: KeyResult;
  /** With `more-specific`: which key is the more specific one. */
  readonly specific?: 'a' | 'b';
  /** Exercise and equipment keys: each layer's relation, read as "a is … than b". */
  readonly layers?: Readonly<Record<string, LayerRelation>>;
  /** Muscle and category keys: the muscles and parts both cover, as muscle-key bodies. */
  readonly shared?: readonly string[];
}

export interface CheckedKey {
  readonly ok: boolean;
  /** The key type its header names; undefined when the text starts with no known header. */
  readonly type: KeyType | undefined;
  /** The key in its standard written form; empty when the text is not a key. */
  readonly written: string;
  readonly issues: readonly Issue[];
}

/** A key that does not check, or two keys that cannot be compared. `issues` says what is wrong. */
export class KeyError extends Error {
  constructor(message: string, readonly issues: readonly Issue[] = []) {
    super(message);
    this.name = 'KeyError';
  }
}

/** The key type a text's header names, or undefined. */
export function keyType(text: string): KeyType | undefined {
  const head = /^(FXMG|FXM|FXE|FXI)=/.exec(text.trim());
  return head === null ? undefined : (head[1] as KeyType);
}

/** Checks a key of any type and gives its standard written form. */
export function checkKey(text: string): CheckedKey {
  const type = keyType(text);
  const p = type === 'FXMG' ? parseFxmg(text) : type === 'FXM' ? parseFxm(text) : type === 'FXE' ? parseFxe(text) : type === 'FXI' ? parseFxi(text) : undefined;
  if (p === undefined) return { ok: false, type, written: '', issues: [{ code: 'prefix', message: 'A key starts with FXI=, FXE=, FXM= or FXMG=.' }] };
  return { ok: p.ok, type, written: p.canonical, issues: p.issues };
}

/** The standard written form of a key, or throws a KeyError listing every issue. */
export function writeKey(text: string): string {
  const c = checkKey(text);
  if (!c.ok) throw new KeyError(`${text.trim()}: ${c.issues.map((i) => i.message).join('; ')}`, c.issues);
  return c.written;
}

function fromLayers(type: 'FXI' | 'FXE', r: CompareResult): KeyComparison {
  const layers = r.layers;
  switch (r.relation) {
    case 'identical': return { type, result: 'same', layers };
    case 'refines': return { type, result: 'more-specific', specific: 'a', layers };
    case 'refined-by': return { type, result: 'more-specific', specific: 'b', layers };
    case 'compatible': return { type, result: 'overlap', layers };
    default: return { type, result: 'different', layers };
  }
}

/**
 * Compares two keys of the same type. Throws a KeyError when either key does not check or the types differ; to place
 * a muscle key in a category key, use `fxmInFxmg`.
 */
export function compareKeys(a: string, b: string): KeyComparison {
  const ca = checkKey(a);
  const cb = checkKey(b);
  for (const [text, c] of [[a, ca], [b, cb]] as const) {
    if (!c.ok) throw new KeyError(`${text.trim()}: ${c.issues.map((i) => i.message).join('; ')}`, c.issues);
  }
  if (ca.type !== cb.type) throw new KeyError(`A ${ca.type} key and a ${cb.type} key do not compare.`);
  switch (ca.type) {
    case 'FXI': return fromLayers('FXI', compareFxi(a, b));
    case 'FXE': return fromLayers('FXE', compareFxe(a, b));
    case 'FXM': {
      const g = gradeFxm(a, b);
      if (g.grade === 'contains') return { type: 'FXM', result: 'more-specific', specific: g.container === 'a' ? 'b' : 'a', shared: g.shared };
      return { type: 'FXM', result: g.grade === 'identical' ? 'same' : g.grade === 'overlaps' ? 'overlap' : 'different', shared: g.shared };
    }
    default: {
      const g = gradeFxmg(a, b);
      return g.grade === 'more-specific' ? { type: 'FXMG', result: g.grade, specific: g.specific, shared: g.shared } : { type: 'FXMG', result: g.grade, shared: g.shared };
    }
  }
}
