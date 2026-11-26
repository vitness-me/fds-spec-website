import { describe, expect, test } from 'vitest';
import { EQUIPMENT_TOKENS, ERG_CYCLES, FORMS, FXE_KINDS, UNKNOWN } from '../src/alphabet';
import { readFileSync } from 'node:fs';
import { ERG_TYPES } from '../src/builder/cardio';
import { QUESTIONS } from '../src/builder/flow';
import { fitsToken } from '../src/crosscheck';
import { parseFxe } from '../src/syntax';

const text = (p: string): string => readFileSync(new URL(p, import.meta.url), 'utf8');

const kindOf = (fxe: string): string => parseFxe(fxe).configs[0]?.k ?? UNKNOWN;
const LOAD_KINDS = ['none', 'imp', 'stn', 'mac', 'erg'];

describe('every FXI equipment code is an FXE code', () => {
  test('a form code is the FXE form atom, a kind code the FXE kind, and an erg child the kind with its cycle', () => {
    const notFxe = Object.entries(EQUIPMENT_TOKENS).filter(([code, t]) => {
      const c = parseFxe(t.fxe).configs[0]!;
      if (Object.hasOwn(FORMS, code)) return c.k !== FORMS[code]!.k || c.layers.f !== code;
      if (Object.hasOwn(FXE_KINDS, code)) return c.k !== code || c.layers.f !== undefined;
      const [kind, cycle = ''] = code.split('.');
      return kind !== 'erg' || !Object.hasOwn(ERG_CYCLES, cycle) || c.k !== 'erg' || c.layers.m !== cycle;
    });
    expect(notFxe.map(([code]) => code)).toEqual([]);
  });

  test('a child code refines the FXE code of its parent', () => {
    for (const [code, t] of Object.entries(EQUIPMENT_TOKENS)) {
      if (Object.hasOwn(FORMS, code)) expect(t.parent, code).toBe(FORMS[code]!.parent);
      else if (code.startsWith('erg.')) expect(t.parent, code).toBe('erg');
    }
  });
});

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

const quoted = (list: string): string[] => [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]!);

describe('no FXI l or s code is left over: every code a code path can emit is an equipment code', () => {
  const emitted = new Map<string, string>();
  const add = (where: string, tokens: Iterable<string>): void => {
    for (const t of tokens) if (t !== UNKNOWN && !emitted.has(t)) emitted.set(t, where);
  };

  test('collects the tokens of the parser, checker and builder', () => {
    add('syntax.ts and crosscheck.ts', ['none', 'floor', 'mac', 'erg', 'bar.trap']);
    for (const q of QUESTIONS) {
      if (!['load', 'imp1', 'imp2'].includes(q.id) && !/^sup\d+\.surface$/.test(q.id)) continue;
      add(`question ${q.id}`, q.options.map((o) => o.value ?? o.id).filter((v) => v !== '' && v !== UNKNOWN && !['usual', 'implement', 'unknown'].includes(v)));
    }
    add('ERG_TYPES', Object.values(ERG_TYPES).map((e) => `erg.${e.m}`));
    const builder = text('../src/builder/build.ts');
    for (const m of builder.matchAll(/^const (STATIONS) = \[([^\]]*)\]/gm)) add(`build.ts ${m[1]}`, quoted(m[2]!));
    const syntax = text('../src/syntax.ts');
    for (const m of syntax.matchAll(/^const (ONE_HAND) = \[([^\]]*)\]/gm)) add(`syntax.ts ${m[1]}`, quoted(m[2]!));
    expect(emitted.size).toBeGreaterThan(50);
    const left = [...emitted].filter(([t]) => EQUIPMENT_TOKENS[t] === undefined).map(([t, where]) => `${t} (${where})`);
    expect(left).toEqual([]);
  });
});

describe('fitsToken: an FXE is a token’s alias or refines it', () => {
  test('equal, a known value for a ?, or a child form fits', () => {
    expect(fitsToken('bell.dumb', 'FXE=1.0S/k:imp/f:bell.dumb')).toBe(true);
    expect(fitsToken('mac', 'FXE=1.0S/k:mac/l:?/s:?/m:?')).toBe(true);
    expect(fitsToken('mac', 'FXE=1.0S/k:mac/l:ankles/s:?/m:kn.flex')).toBe(true);
    expect(fitsToken('band', 'FXE=1.0S/k:imp/f:band.loop')).toBe(true);
    expect(fitsToken('erg.gait', 'FXE=1.0S/k:erg/c:belt/l:feet/s:standing/m:gait')).toBe(true);
  });
  test('another form, kind or cycle, a broader FXE, or an unknown token does not', () => {
    expect(fitsToken('bell.dumb', 'FXE=1.0S/k:imp/f:bell.kettle')).toBe(false);
    expect(fitsToken('erg', 'FXE=1.0S/k:mac/l:?/s:?/m:?')).toBe(false);
    expect(fitsToken('erg.gait', 'FXE=1.0S/k:erg/c:?/l:?/s:?/m:cycle')).toBe(false);
    expect(fitsToken('band.x', 'FXE=1.0S/k:imp/f:band')).toBe(false);
    expect(fitsToken('bell.dumb', 'FXE=1.0S/k:imp/f:?')).toBe(false);
    expect(fitsToken('bell.dumb', 'FXE=1.0S/k:?')).toBe(false);
  });
});
