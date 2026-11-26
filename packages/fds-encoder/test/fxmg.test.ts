import { describe, expect, test } from 'vitest';
import { FXMG_MAJOR, FXMG_REV } from '../src/alphabet';
import { FXM_MUSCLES } from '../src/fxm-alphabet';
import { FXM_VOCABULARY } from '../src/fxm';
import { ACTION_PRIME_MOVERS } from '../src/movers';
import { FXMG_ACTIONS, FXMG_SETS } from '../src/fxmg-alphabet';
import type { FxmgAction, FxmgSet } from '../src/fxmg-alphabet';
import {
  buildFxmgIndex,
  canonicalFxmg,
  createFxmgVocabulary,
  expandFxmg,
  expandMuscleKey,
  fxmgCategoriesOf,
  fxmgForm,
  fxmgMembers,
  FXMG_VOCABULARY,
  fxmInFxmg,
  gradeFxmg,
  gradeFxmgText,
  parseFxmg,
} from '../src/fxmg';

const g = (body: string): string => `FXMG=1.0/${body}`;
const k = (body: string): string => `FXM=1.0/${body}`;
const codes = (input: string): string[] => parseFxmg(input).issues.map((i) => i.code);

describe('FXMG header', () => {
  test('FXMG is version 1.0, written without a flag; a written flag is dropped', () => {
    expect([FXMG_MAJOR, FXMG_REV]).toEqual([1, 0]);
    expect(parseFxmg(g('hamstring'))).toMatchObject({ ok: true, canonical: g('hamstring') });
    expect(canonicalFxmg('FXMG=1.0S/hamstring')).toBe(g('hamstring'));
    expect(canonicalFxmg('FXMG=1.0N/thigh.medial')).toBe(g('thigh.medial'));
  });

  test.each([
    ['', 'prefix'],
    ['hamstring', 'prefix'],
    ['FXM=1.0/hamstring', 'prefix'],
    ['fxmg=1.0/hamstring', 'prefix'],
    ['FXMG=1/hamstring', 'no-rev'],
    ['FXMG=2.0/hamstring', 'major'],
    ['FXMG=1.1/hamstring', 'rev'],
    ['FXMG=1.00/hamstring', 'rev'],
  ])('refuses %j with %s', (text, code) => {
    expect(codes(text)).toContain(code);
  });
});

describe('the four forms', () => {
  test('reads a set, a compartment, an action and a union', () => {
    expect(parseFxmg(g('hamstring')).key).toEqual({ terms: [{ kind: 'set', code: 'hamstring' }] });
    expect(parseFxmg(g('thigh.medial')).key).toEqual({ terms: [{ kind: 'compartment', code: 'thigh.medial' }] });
    expect(parseFxmg(g('a:hip.flex')).key).toEqual({ terms: [{ kind: 'action', action: 'hip.flex' }] });
    expect(parseFxmg(g('erector-spinae+quadratus-lumborum')).key).toEqual({
      terms: [{ kind: 'set', code: 'erector-spinae' }, { kind: 'muscle', muscle: 'quadratus-lumborum' }],
    });
    expect([g('hamstring'), g('thigh.medial'), g('a:hip.flex'), g('erector-spinae+quadratus-lumborum'), g('deltoid'), g('trapezius.ascending')].map((key) => fxmgForm(parseFxmg(key).key!)))
      .toEqual(['set', 'compartment', 'action', 'union', 'muscle', 'part']);
  });

  test('a union term may be an FXM muscle or part', () => {
    expect(parseFxmg(g('rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'))).toMatchObject({ ok: true });
    expect(parseFxmg(g('deltoid'))).toMatchObject({ ok: true, key: { terms: [{ kind: 'muscle', muscle: 'deltoid' }] } });
  });

  test.each([
    [g(''), 'token'],
    [g('Hamstring'), 'token'],
    [g('hamstring+'), 'token'],
    [g('hamstring++buttock'), 'token'],
    [g('thigh.'), 'token'],
    [g('a:'), 'token'],
    [g('g:hamstrings'), 'token'],
    [g('hamstrings'), 'unknown-category'],
    [g('thigh.lateral'), 'unknown-category'],
    [g('a:hip.fly'), 'unknown-action'],
    [g('a:ank.ev'), 'unknown-action'],
    [g('deltoid.anterior'), 'unknown-part'],
  ])('refuses %j with %s', (text, code) => {
    expect(parseFxmg(text).ok).toBe(false);
    expect(codes(text)).toEqual([code]);
  });

  test('canonicalFxmg throws with every issue', () => {
    expect(() => canonicalFxmg(g('hamstrings'))).toThrow(/no category "hamstrings"/);
  });
});

describe('writing a union', () => {
  test('terms are sorted and written once', () => {
    expect(canonicalFxmg(g('quadratus-lumborum+erector-spinae'))).toBe(g('erector-spinae+quadratus-lumborum'));
    expect(canonicalFxmg(g('soleus+soleus'))).toBe(g('soleus'));
  });

  test('a term another term covers is dropped', () => {
    expect(canonicalFxmg(g('thigh+hamstring'))).toBe(g('thigh'));
    expect(canonicalFxmg(g('deltoid+deltoid.acromial'))).toBe(g('deltoid'));
    expect(canonicalFxmg(g('a:kn.ext+quadriceps-femoris+rectus-femoris'))).toBe(g('a:kn.ext'));
  });

  test('of two terms with the same members, the first in order stays', () => {
    expect(canonicalFxmg(g('thigh.posterior+hamstring'))).toBe(g('hamstring'));
  });

  test('a union of one term is that term', () => {
    expect(canonicalFxmg(g('deltoid'))).toBe(g('deltoid'));
    expect(canonicalFxmg(g('triceps-surae+gastrocnemius'))).toBe(g('triceps-surae'));
  });
});

describe('members', () => {
  test('a set has the members FMA lists, as FXM leaves', () => {
    expect(expandFxmg(g('hamstring'))).toEqual(['biceps-femoris', 'semimembranosus', 'semitendinosus']);
    expect(expandFxmg(g('quadriceps-femoris'))).toEqual(['rectus-femoris', 'vastus-intermedius', 'vastus-lateralis', 'vastus-medialis']);
    expect(expandFxmg(g('erector-spinae'))).toEqual(['iliocostalis', 'longissimus', 'spinalis']);
  });

  test('a set holding sets expands through them to FXM leaves', () => {
    expect(expandFxmg(g('thigh'))).toEqual([
      'adductor-brevis', 'adductor-longus', 'adductor-magnus', 'adductor-minimus', 'articularis-genus', 'biceps-femoris', 'gracilis', 'pectineus',
      'rectus-femoris', 'sartorius', 'semimembranosus', 'semitendinosus', 'vastus-intermedius', 'vastus-lateralis', 'vastus-medialis',
    ]);
    expect(expandFxmg(g('forearm')).length).toBe(19);
  });

  test('an action has the prime movers only', () => {
    expect(expandFxmg(g('a:hip.flex'))).toEqual(['iliacus', 'psoas-major', 'rectus-femoris']);
    expect(expandFxmg(g('a:hip.ext'))).toEqual(['biceps-femoris', 'gluteus-maximus', 'semimembranosus', 'semitendinosus']);
  });

  test('a muscle with parts covers its parts', () => {
    expect(expandFxmg(g('deltoid'))).toEqual(['deltoid.acromial', 'deltoid.clavicular', 'deltoid.spinal']);
    expect(expandFxmg(g('entire'))).toContain('trapezius.ascending');
  });

  test('members are written as FXM keys: whole muscles where the key holds all of one, parts otherwise', () => {
    expect(fxmgMembers(g('hamstring'))).toEqual([k('biceps-femoris'), k('semimembranosus'), k('semitendinosus')]);
    expect(fxmgMembers(g('rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'))).toEqual([
      k('rhomboid-major'), k('rhomboid-minor'), k('trapezius.ascending'), k('trapezius.transverse'),
    ]);
    expect(fxmgMembers(g('shoulder.intrinsic'))).toContain(k('deltoid'));
  });

  test('expandMuscleKey reads either key', () => {
    expect(expandMuscleKey(k('deltoid.spinal'))).toEqual(['deltoid.spinal']);
    expect(expandMuscleKey(g('triceps-surae'))).toEqual(['gastrocnemius.lateral', 'gastrocnemius.medial', 'soleus']);
    expect(() => expandMuscleKey('FXI=1.0S/m:hip.flex')).toThrow(/not an FXM or FXMG key/);
  });
});

describe('comparing two category keys', () => {
  test('grades by the leaves each covers', () => {
    expect(gradeFxmg(g('hamstring'), g('hamstring'))).toMatchObject({ grade: 'same' });
    expect(gradeFxmg(g('hamstring'), g('thigh.posterior'))).toMatchObject({ grade: 'same' });
    expect(gradeFxmg(g('thigh.medial'), g('thigh'))).toMatchObject({ grade: 'more-specific', specific: 'a' });
    expect(gradeFxmg(g('anterior-abdominal-wall'), g('external-oblique+internal-oblique'))).toMatchObject({ grade: 'more-specific', specific: 'b' });
    expect(gradeFxmg(g('triceps-surae'), g('pectoral'))).toEqual({ grade: 'different', shared: [] });
    expect(gradeFxmg(g('quadriceps-femoris'), g('a:hip.flex'))).toEqual({ grade: 'overlap', shared: ['rectus-femoris'] });
  });

  test('the text alone settles identical keys, a compartment against its region and a union against a larger union', () => {
    expect(gradeFxmgText(g('hamstring'), g('hamstring'))).toBe('same');
    expect(gradeFxmgText(g('thigh.medial'), g('thigh'))).toEqual({ grade: 'more-specific', specific: 'a' });
    expect(gradeFxmgText(g('forearm'), g('forearm.posterior.superficial'))).toEqual({ grade: 'more-specific', specific: 'b' });
    expect(gradeFxmgText(g('erector-spinae'), g('erector-spinae+quadratus-lumborum'))).toEqual({ grade: 'more-specific', specific: 'a' });
    expect(gradeFxmgText(g('hamstring'), g('thigh.posterior'))).toBeUndefined();
    expect(gradeFxmgText(g('thigh'), g('thighbone'))).toBeUndefined();
  });

  test('every text shortcut agrees with the leaves', () => {
    const keys = [...FXMG_VOCABULARY.sets.keys()].map(g);
    for (const a of keys) for (const b of keys) {
      const text = gradeFxmgText(a, b);
      if (text === undefined) continue;
      const leaves = gradeFxmg(a, b);
      if (text === 'same') expect(leaves.grade, `${a} ${b}`).toBe('same');
      else expect(leaves, `${a} ${b}`).toMatchObject(text);
    }
  });
});

describe('a muscle in a category', () => {
  test('in, partly in or not in', () => {
    expect(fxmInFxmg(k('semitendinosus'), g('hamstring'))).toEqual({ relation: 'in', shared: ['semitendinosus'] });
    expect(fxmInFxmg(k('trapezius'), g('rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse'))).toEqual({
      relation: 'partly-in', shared: ['trapezius.ascending', 'trapezius.transverse'],
    });
    expect(fxmInFxmg(k('soleus'), g('hamstring'))).toEqual({ relation: 'not-in', shared: [] });
  });

  test('a muscle can be in several categories', () => {
    expect(fxmInFxmg(k('rectus-femoris'), g('quadriceps-femoris')).relation).toBe('in');
    expect(fxmInFxmg(k('rectus-femoris'), g('a:hip.flex')).relation).toBe('in');
  });
});

describe('finding the categories of a muscle', () => {
  const index = buildFxmgIndex();

  test('indexes every leaf to every set and action that holds it', () => {
    expect(index.get('biceps-femoris')).toEqual([g('a:hip.ext'), g('a:kn.flex'), g('entire'), g('hamstring'), g('thigh'), g('thigh.posterior')]);
  });

  test('every FXM leaf is in at least the entire musculature', () => {
    for (const muscle of FXM_MUSCLES) for (const leaf of expandMuscleKey(k(muscle.token))) expect(index.get(leaf), leaf).toContain(g('entire'));
  });

  test('a muscle is in the categories that hold all of it', () => {
    expect(fxmgCategoriesOf(k('deltoid'), index)).toEqual([g('entire'), g('shoulder.intrinsic')]);
    expect(fxmgCategoriesOf(k('deltoid.acromial'), index)).toEqual([g('a:sh.abd'), g('entire'), g('shoulder.intrinsic')]);
  });
});

describe('the shipped vocabulary', () => {
  test('26 sets: 12 named sets and regions, 14 compartments', () => {
    expect(FXMG_SETS.length).toBe(26);
    expect(FXMG_SETS.filter((s) => s.code.includes('.')).length).toBe(14);
  });

  test('one action for every joint action with a keyed prime mover', () => {
    const keyed = Object.entries(ACTION_PRIME_MOVERS).filter(([, prime]) => prime.length > 0).map(([a]) => a);
    expect(FXMG_ACTIONS.map((a) => a.action)).toEqual(keyed);
    expect(FXMG_ACTIONS.length).toBe(40);
    for (const action of FXMG_ACTIONS) expect(action.members.map((member) => member.key), action.action).toEqual([...ACTION_PRIME_MOVERS[action.action]!]);
  });

  test('every set carries an FMA anchor, and an UBERON anchor or a gap, never both', () => {
    for (const set of FXMG_SETS) {
      expect(set.anchors[0]?.system, set.code).toBe('FMA');
      expect(set.anchors.filter((a) => a.system === 'FMA').length, set.code).toBe(1);
      expect(set.anchors.some((a) => a.system === 'UBERON') !== (set.uberonGap !== undefined), set.code).toBe(true);
    }
  });

  test('every anatomy member is traced to an ontology term; a set FMA leaves empty says how its members are derived', () => {
    for (const set of FXMG_SETS) {
      for (const member of set.members) expect(member.source?.id, `${set.code} ${member.key}`).toMatch(/^(FMA:\d+|UBERON:\d{7})$/);
      const fromFma = set.members.every((member) => member.relation === 'member' || member.relation === 'regional_part');
      expect(fromFma !== (set.derivation !== undefined), set.code).toBe(true);
    }
  });

  test('a compartment covers less than its region wherever the region is a code', () => {
    for (const set of FXMG_SETS) {
      const region = set.code.split('.').slice(0, -1).join('.');
      if (!FXMG_VOCABULARY.sets.has(region)) continue;
      expect(gradeFxmg(g(set.code), g(region)), set.code).toMatchObject({ grade: 'more-specific', specific: 'a' });
    }
  });

  test('no FXM code is an FXMG code or the region of one', () => {
    const fxmTokens = new Set(FXM_VOCABULARY.muscles.keys());
    for (const set of FXMG_SETS) for (const head of set.code.split('.').map((_, i, all) => all.slice(0, i + 1).join('.'))) {
      expect(fxmTokens.has(head), set.code).toBe(false);
    }
  });
});

describe('building a vocabulary', () => {
  const set = (code: string, members: string[]): FxmgSet => ({
    code, name: code, anchors: [{ system: 'FMA', id: 'FMA:1', label: code }], members: members.map((key) => ({ key, relation: 'member', source: { system: 'FMA', id: 'FMA:1', label: key } })),
  });
  const action = (name: string, members: string[]): FxmgAction => ({ action: name, name, members: members.map((key) => ({ key, relation: 'prime-mover' })) });

  test('refuses duplicates, collisions with FXM, unknown members, cycles, empty sets and bad codes', () => {
    expect(() => createFxmgVocabulary([set('x', [k('soleus')]), set('x', [k('soleus')])], [])).toThrow(/duplicate category "x"/);
    expect(() => createFxmgVocabulary([set('soleus', [k('soleus')])], [])).toThrow(/"soleus" is also an FXM code/);
    expect(() => createFxmgVocabulary([set('soleus.deep', [k('soleus')])], [])).toThrow(/"soleus" is also an FXM code/);
    expect(() => createFxmgVocabulary([set('x', [k('nope')])], [])).toThrow(/x member FXM=1.0\/nope/);
    expect(() => createFxmgVocabulary([set('x', [g('y')]), set('y', [g('x')])], [])).toThrow(/cycle/);
    expect(() => createFxmgVocabulary([set('x', [])], [])).toThrow(/x has no members/);
    expect(() => createFxmgVocabulary([set('X', [k('soleus')])], [])).toThrow(/not a category code/);
    expect(() => createFxmgVocabulary([], [action('hip.flex', [])])).toThrow(/a:hip.flex has no members/);
    expect(() => createFxmgVocabulary([], [action('hip.flex', [g('x')])])).toThrow(/a:hip.flex member .* is not an FXM key/);
  });

  test('refuses a compartment that covers as much as its region', () => {
    expect(() => createFxmgVocabulary([set('r', [k('soleus')]), set('r.q', [k('soleus')])], [])).toThrow(/r.q does not cover less than r/);
  });
});
