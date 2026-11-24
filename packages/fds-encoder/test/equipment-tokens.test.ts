import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { EQUIPMENT_TOKENS, ERG_CYCLES, ERG_TYPES, FORMS, UNKNOWN } from '../src/alphabet.js';
import { fitsToken } from '../src/crosscheck.js';
import { rowsOf } from '../src/rows.js';
import { parseFxe } from '../src/syntax.js';
import { FLOW, WORDS } from './support.js';

const QUESTIONS = FLOW.questions;
const TEMPLATES = WORDS.words;

const kindOf = (fxe: string): string => parseFxe(fxe).configs[0]?.k ?? UNKNOWN;
const LOAD_KINDS = ['none', 'imp', 'stn', 'mac', 'erg'];

describe('every FXI equipment token is an alias of one valid standard FXE', () => {
  test('each alias parses, is canonical, standard and one configuration', () => {
    const bad = Object.entries(EQUIPMENT_TOKENS).filter(([, t]) => {
      const p = parseFxe(t.fxe);
      return !p.ok || p.canonical !== t.fxe || p.flag !== 'S' || p.configs.length !== 1;
    });
    expect(bad.map(([token]) => token)).toEqual([]);
  });

  test('each form atom a token names exists, with the kind the alias writes', () => {
    const bad = Object.entries(EQUIPMENT_TOKENS).filter(([, t]) => {
      const c = parseFxe(t.fxe).configs[0]!;
      const f = c.layers.f;
      return f !== undefined && (FORMS[f] === undefined || FORMS[f]!.k !== c.k);
    });
    expect(bad.map(([token]) => token)).toEqual([]);
  });

  test('a token may load only when its kind carries load; supports never do', () => {
    const bad = Object.entries(EQUIPMENT_TOKENS).filter(([, t]) => t.load !== LOAD_KINDS.includes(kindOf(t.fxe)));
    expect(bad.map(([token]) => token)).toEqual([]);
  });

  test('a child token names its parent and refines or equals its alias', () => {
    for (const [token, t] of Object.entries(EQUIPMENT_TOKENS)) {
      if (t.parent === undefined) continue;
      expect(EQUIPMENT_TOKENS[t.parent], token).toBeDefined();
      expect(fitsToken(t.parent, t.fxe), token).toBe(true);
    }
  });

  test('every implement, support and station atom is named by a token, directly or through its parent atom', () => {
    const named = new Set(Object.values(EQUIPMENT_TOKENS).map((t) => parseFxe(t.fxe).configs[0]!.layers.f));
    const left = Object.entries(FORMS).filter(([atom, f]) => f.k !== 'acc' && !named.has(atom) && !(f.parent !== undefined && named.has(f.parent)));
    expect(left.map(([atom]) => atom)).toEqual([]);
  });

  test('every cardio cycle has its child token, and every child token a cycle', () => {
    const children = Object.keys(EQUIPMENT_TOKENS).filter((t) => t.startsWith('erg.')).map((t) => t.slice(4));
    expect(children.sort()).toEqual(Object.keys(ERG_CYCLES).sort());
  });
});

/** Equipment tokens of an `l` or `s` value: `bb*2@hands+band@feet` gives bb and band. */
const tokensOf = (value: string): string[] =>
  value === UNKNOWN || value === '*' ? [] : value.split('+').map((i) => i.split(/[@*]/)[0]!).filter((t) => t !== UNKNOWN && t !== '');
/** Equipment tokens in the `l` and `s` layers of an FXI body or of `/`-joined layer patches. */
const layerTokens = (layers: string): string[] =>
  layers.split('/').flatMap((part) => (/^[ls]:/.test(part) ? tokensOf(part.slice(2)) : []));
const quoted = (list: string): string[] => [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]!);

describe('no FXI l or s token is left over: every token a code path can emit is a registry token', () => {
  const emitted = new Map<string, string>();
  const add = (where: string, tokens: Iterable<string>): void => {
    for (const t of tokens) if (t !== UNKNOWN && !emitted.has(t)) emitted.set(t, where);
  };

  test('collects the tokens of the parser, checker, builder and movement words', () => {
    add('syntax.ts and crosscheck.ts', ['bw', 'floor', 'mach', 'erg', 'tb']);
    for (const q of QUESTIONS) {
      if (!['load', 'imp1', 'imp2'].includes(q.id) && !/^sup\d+\.surface$/.test(q.id)) continue;
      add(`question ${q.id}`, q.options.map((o) => o.value ?? o.id).filter((v) => v !== '' && v !== UNKNOWN && !['usual', 'implement', 'unknown'].includes(v)));
    }
    add('ERG_TYPES', Object.values(ERG_TYPES).map((e) => `erg.${e.m}`));
    for (const t of TEMPLATES) {
      add(`word ${t.id}`, layerTokens(t.fxi));
      add(`word ${t.id} hold`, Object.keys(t.hold ?? {}).filter((k) => k !== '*'));
      for (const ask of Object.values(t.asks ?? {})) for (const patch of Object.values(ask.options)) add(`word ${t.id} asks`, layerTokens(patch));
    }
    const builder = readFileSync(new URL('../src/build.ts', import.meta.url), 'utf8');
    for (const m of builder.matchAll(/^const (BAR_LIKE|TWO_HAND|ONE_HAND|STATIONS|BARS|NOT_IN_HANDS) = \[([^\]]*)\]/gm)) add(`build.ts ${m[1]}`, quoted(m[2]!));
    for (const m of builder.matchAll(/^const NATURAL_HOLD[^{]*\{([^}]*)\}/gm)) add('build.ts NATURAL_HOLD', [...m[1]!.matchAll(/(\w+):/g)].map((k) => k[1]!));
    expect(emitted.size).toBeGreaterThan(50);
    const left = [...emitted].filter(([t]) => EQUIPMENT_TOKENS[t] === undefined).map(([t, where]) => `${t} (${where})`);
    expect(left).toEqual([]);
  });
});

describe('fitsToken: an FXE is a token’s alias or refines it', () => {
  test('equal, a known value for a ?, or a child form fits', () => {
    expect(fitsToken('db', 'FXE=1.0S/k:imp/f:bell.dumb')).toBe(true);
    expect(fitsToken('mach', 'FXE=1.0S/k:mac/l:?/s:?/m:?')).toBe(true);
    expect(fitsToken('mach', 'FXE=1.0S/k:mac/l:ankle/s:?/m:kn.flex')).toBe(true);
    expect(fitsToken('band', 'FXE=1.0S/k:imp/f:band.loop')).toBe(true);
    expect(fitsToken('erg.gait', 'FXE=1.0S/k:erg/c:belt/l:foot/s:stand/m:gait')).toBe(true);
  });
  test('another form, kind or cycle, a broader FXE, or an unknown token does not', () => {
    expect(fitsToken('db', 'FXE=1.0S/k:imp/f:bell.kettle')).toBe(false);
    expect(fitsToken('erg', 'FXE=1.0S/k:mac/l:?/s:?/m:?')).toBe(false);
    expect(fitsToken('erg.gait', 'FXE=1.0S/k:erg/c:?/l:?/s:?/m:cycle')).toBe(false);
    expect(fitsToken('band.x', 'FXE=1.0S/k:imp/f:band')).toBe(false);
    expect(fitsToken('db', 'FXE=1.0S/k:imp/f:?')).toBe(false);
    expect(fitsToken('db', 'FXE=1.0S/k:?')).toBe(false);
  });
});

describe('rowsOf reads a rows file', () => {
  test('an array of rows, or an object whose entries array holds them', () => {
    const rows = [{ id: 'e', fxe: 'FXE=1.0S/k:none', confidence: 'high' }];
    expect(rowsOf(rows)).toEqual(rows);
    expect(rowsOf({ format: 'x', entries: rows })).toEqual(rows);
    expect(rowsOf({ rows })).toBeUndefined();
    expect(rowsOf('rows')).toBeUndefined();
  });
});


