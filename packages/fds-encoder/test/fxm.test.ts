import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { FXM_MAJOR, FXM_REV } from '../src/alphabet.js';
import { canonicalFxm, checkMuscleRow, createFxmVocabulary, expandFxm, formatFxm, gradeFxm, parseFxm, readFxmVocabulary } from '../src/fxm.js';
import type { FxmGroup, FxmMuscle, MuscleRow } from '../src/fxm.js';
import { fixture } from './support.js';

/** A provider vocabulary written for these tests. FDS publishes none. */
const VOCABULARY = readFxmVocabulary(JSON.parse(readFileSync(fixture('muscles.json'), 'utf8')));
const k = (body: string): string => `FXM=1.0/${body}`;
const codes = (input: string): string[] => parseFxm(input, VOCABULARY).issues.map((i) => i.code);

describe('FXM header', () => {
  test('FXM is version 1.0, written without a standard flag', () => {
    expect([FXM_MAJOR, FXM_REV]).toEqual([1, 0]);
    expect(parseFxm('FXM=1.0/deltoid', VOCABULARY)).toMatchObject({ ok: true, canonical: 'FXM=1.0/deltoid' });
  });

  test('a bare FXM=1/ draft is refused as no-rev, like FXI and FXE', () => {
    expect(codes('FXM=1/deltoid')).toEqual(['no-rev']);
    expect(codes('FXM=1/g:hamstrings')).toEqual(['no-rev']);
    expect(parseFxm('FXM=1/deltoid')).toMatchObject({ ok: false, canonical: '' });
  });

  test.each([
    ['', 'prefix'],
    ['deltoid', 'prefix'],
    ['fxm=1.0/deltoid', 'prefix'],
    ['FXI=1.0S/deltoid', 'prefix'],
    ['FXM=2.0/deltoid', 'major'],
    ['FXM=1.1/deltoid', 'rev'],
    ['FXM=1.00/deltoid', 'rev'],
  ])('refuses %j with %s', (text, code) => {
    expect(codes(text)).toContain(code);
  });

  test('the S/N flag is derived, never authored: FXM has no extended layers, so a written flag is dropped', () => {
    expect(canonicalFxm('FXM=1.0S/deltoid.acromial', VOCABULARY)).toBe(k('deltoid.acromial'));
    expect(canonicalFxm('FXM=1.0N/g:hamstrings', VOCABULARY)).toBe(k('g:hamstrings'));
  });
});

describe('FXM body', () => {
  test('reads a whole muscle, a part and a group', () => {
    expect(parseFxm(k('latissimus-dorsi'), VOCABULARY).key).toEqual({ kind: 'muscle', muscle: 'latissimus-dorsi' });
    expect(parseFxm(k('deltoid.acromial'), VOCABULARY).key).toEqual({ kind: 'part', muscle: 'deltoid', part: 'acromial' });
    expect(parseFxm(k('g:hamstrings'), VOCABULARY).key).toEqual({ kind: 'group', group: 'hamstrings' });
  });

  test('canonical form: surrounding space trimmed, everything else already canonical', () => {
    expect(canonicalFxm(`  ${k('soleus')}\n`, VOCABULARY)).toBe(k('soleus'));
    for (const text of [k('deltoid.acromial'), k('g:hip-flexors'), k('extensor-carpi-radialis-longus')]) {
      const p = parseFxm(text, VOCABULARY);
      expect(p.canonical).toBe(text);
      expect(formatFxm(p.key!)).toBe(text);
    }
  });

  test.each([
    [k(''), 'token'],
    [k('Deltoid'), 'token'],
    [k('deltoid.'), 'token'],
    [k('deltoid.acromial.anterior'), 'token'],
    [k('deltoid acromial'), 'token'],
    [k('deltoid--acromial'), 'token'],
    [k('g:'), 'token'],
    [k('g:hamstrings.long'), 'token'],
    [k('deltoid/acromial'), 'token'],
    [k('deltoidus'), 'unknown-muscle'],
    [k('deltoid.anterior'), 'unknown-part'],
    [k('deltoid.acromial-left'), 'unknown-part'],
    [k('soleus.medial'), 'unknown-part'],
    [k('g:arms'), 'unknown-group'],
  ])('refuses %j with %s', (text, code) => {
    expect(parseFxm(text, VOCABULARY).ok).toBe(false);
    expect(codes(text)).toEqual([code]);
  });

  test('canonicalFxm throws with every issue', () => {
    expect(() => canonicalFxm(k('g:arms'), VOCABULARY)).toThrow(/no group "arms"/);
  });
});

describe('group membership', () => {
  test('a muscle with parts expands to its parts; a part or a muscle without parts to itself', () => {
    expect(expandFxm(k('deltoid'), VOCABULARY)).toEqual(['deltoid.acromial', 'deltoid.clavicular', 'deltoid.spinal']);
    expect(expandFxm(k('soleus'), VOCABULARY)).toEqual(['soleus']);
    expect(expandFxm(k('deltoid.spinal'), VOCABULARY)).toEqual(['deltoid.spinal']);
  });

  test('a group expands to its members, through nested groups', () => {
    expect(expandFxm(k('g:hamstrings'), VOCABULARY)).toEqual(['biceps-femoris', 'semimembranosus', 'semitendinosus']);
    expect(expandFxm(k('g:thighs'), VOCABULARY)).toEqual(['biceps-femoris', 'rectus-femoris', 'semimembranosus', 'semitendinosus', 'vastus-lateralis']);
  });

  test('every group member is a valid FXM=1.0 key', () => {
    for (const group of VOCABULARY.groups.values()) {
      expect(group.members.length, group.token).toBeGreaterThan(0);
      for (const member of group.members) expect(parseFxm(member, VOCABULARY).canonical, `${group.token} ${member}`).toBe(member);
    }
  });

  const GRADE = (a: string, b: string) => gradeFxm(a, b, VOCABULARY);
  test('grades two keys by the leaves they cover', () => {
    expect(GRADE(k('deltoid.acromial'), k('deltoid.acromial'))).toEqual({ grade: 'identical', shared: ['deltoid.acromial'] });
    expect(GRADE(k('g:shoulders'), k('deltoid')).grade).toBe('identical');
    expect(GRADE(k('deltoid'), k('deltoid.acromial'))).toEqual({ grade: 'contains', container: 'a', shared: ['deltoid.acromial'] });
    expect(GRADE(k('deltoid.acromial'), k('g:shoulders'))).toMatchObject({ grade: 'contains', container: 'b' });
    expect(GRADE(k('g:hamstrings'), k('semitendinosus'))).toMatchObject({ grade: 'contains', container: 'a' });
    expect(GRADE(k('g:quadriceps'), k('g:hip-flexors'))).toEqual({ grade: 'overlaps', shared: ['rectus-femoris'] });
    expect(GRADE(k('pectoralis-major.sternocostal'), k('pectoralis-major.abdominal'))).toEqual({ grade: 'disjoint', shared: [] });
    expect(() => GRADE(k('g:arms'), k('deltoid'))).toThrow(/unknown-group/);
  });
});

describe('building a vocabulary', () => {
  const muscle = (token: string, parts: string[] = []): FxmMuscle => ({
    token, name: token, anchors: [], ...(parts.length > 0 ? { parts: parts.map((p) => ({ token: p, name: p, anchors: [] })) } : {}),
  });
  const group = (token: string, members: string[]): FxmGroup => ({ token, name: token, members, anchors: [] });

  test('refuses duplicates, unknown members, cycles, empty groups and bad tokens', () => {
    expect(() => createFxmVocabulary([muscle('a'), muscle('a')], [])).toThrow(/duplicate muscle token "a"/);
    expect(() => createFxmVocabulary([muscle('a')], [group('x', [k('b')])])).toThrow(/g:x.*unknown-muscle/);
    expect(() => createFxmVocabulary([muscle('a')], [group('x', [k('g:y')]), group('y', [k('g:x')])])).toThrow(/cycle/);
    expect(() => createFxmVocabulary([muscle('a')], [group('x', [])])).toThrow(/g:x has no members/);
    expect(() => createFxmVocabulary([muscle('Deltoid')], [])).toThrow(/token/);
    expect(() => createFxmVocabulary([muscle('deltoid', ['Front'])], [])).toThrow(/token/);
    expect(() => createFxmVocabulary([muscle('a')], [group('x', ['FXM=1/a'])])).toThrow(/no-rev/);
  });
});



describe('checking a muscle row', () => {
  const row = (over: Partial<Record<keyof MuscleRow, unknown>>): MuscleRow => ({ id: 'x', slug: 'x', name: 'X', class: 'muscle', fxm: k('soleus'), notes: [], ...over });
  const check = (r: MuscleRow) => checkMuscleRow(r, VOCABULARY);

  test('canonicalises the key', () => {
    const c = check(row({ fxm: 'FXM=1.0S/soleus' }));
    expect(c.problems).toEqual([]);
    expect(c.changed).toEqual(['fxm']);
    expect(c.row.fxm).toBe(k('soleus'));
  });

  test('refuses a key of the wrong kind for the class, a bad key, and a set-aside without a reason', () => {
    expect(check(row({ class: 'group' })).problems.join()).toMatch(/group row needs a g: key/);
    expect(check(row({ class: 'part' })).problems.join()).toMatch(/part row needs a <muscle>.<part> key/);
    expect(check(row({ fxm: 'FXM=1/soleus' })).problems.join()).toMatch(/fxm:.*rules revision/);
    expect(check(row({ fxm: null })).problems.join()).toMatch(/muscle row needs an fxm key/);
    expect(check(row({ class: 'region', fxm: null })).problems.join()).toMatch(/setAside/);
    expect(check(row({ class: 'region', fxm: k('soleus'), setAside: 'A body area.' })).problems.join()).toMatch(/takes no fxm key/);
    expect(check(row({ class: 'organ' })).problems.join()).toMatch(/class must be/);
    expect(check(row({ class: 'region', fxm: null, setAside: 'A body area.', members: [k('g:arms')] })).problems.join()).toMatch(/members/);
  });
});

describe('with no muscle vocabulary, the format alone is checked', () => {
  test('a well-formed key of any muscle, part or group is valid; a malformed one is not', () => {
    expect(parseFxm(k('any-muscle-name.any-part'))).toMatchObject({ ok: true, canonical: k('any-muscle-name.any-part') });
    expect(parseFxm('FXM=1.0S/g:any-group')).toMatchObject({ ok: true, canonical: k('g:any-group') });
    expect(parseFxm(k('Deltoid')).issues.map((i) => i.code)).toEqual(['token']);
    expect(parseFxm('FXM=1/deltoid').issues.map((i) => i.code)).toEqual(['no-rev']);
  });

  test('a muscle row is checked for format, and a group row for canonical member keys', () => {
    const r = (over: Partial<Record<keyof MuscleRow, unknown>>): MuscleRow => ({ id: 'x', slug: 'x', name: 'X', class: 'muscle', fxm: k('soleus'), ...over });
    expect(checkMuscleRow(r({ fxm: k('not-in-any-list') })).problems).toEqual([]);
    expect(checkMuscleRow(r({ class: 'group', fxm: k('g:legs'), members: [k('soleus'), 'FXM=1/soleus'] })).problems.join()).toMatch(/FXM=1\/soleus is not a canonical FXM key/);
  });

  test('a vocabulary file is {muscles, groups}', () => {
    expect(() => readFxmVocabulary({ groups: [] })).toThrow(/muscles/);
    expect(readFxmVocabulary({ muscles: [{ token: 'soleus', name: 'Soleus', anchors: [] }] }).muscles.has('soleus')).toBe(true);
  });
});
