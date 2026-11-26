import { describe, expect, test } from 'vitest';
import { FXM_MAJOR, FXM_REV } from '../src/alphabet';
import { FXM_MUSCLES } from '../src/fxm-alphabet';
import type { FxmMuscle } from '../src/fxm-alphabet';
import { canonicalFxm, createFxmVocabulary, expandFxm, formatFxm, gradeFxm, parseFxm } from '../src/fxm';

const k = (body: string): string => `FXM=1.0/${body}`;
const codes = (input: string): string[] => parseFxm(input).issues.map((i) => i.code);


describe('FXM header', () => {
  test('FXM is version 1.0, written without a standard flag', () => {
    expect([FXM_MAJOR, FXM_REV]).toEqual([1, 0]);
    expect(parseFxm('FXM=1.0/deltoid')).toMatchObject({ ok: true, canonical: 'FXM=1.0/deltoid' });
  });

  test('a bare FXM=1/ draft is refused as no-rev, like FXI and FXE', () => {
    expect(codes('FXM=1/deltoid')).toEqual(['no-rev']);
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
    expect(canonicalFxm('FXM=1.0S/deltoid.acromial')).toBe(k('deltoid.acromial'));
    expect(canonicalFxm('FXM=1.0N/soleus')).toBe(k('soleus'));
  });
});

describe('FXM body', () => {
  test('reads a whole muscle and a part', () => {
    expect(parseFxm(k('latissimus-dorsi')).key).toEqual({ kind: 'muscle', muscle: 'latissimus-dorsi' });
    expect(parseFxm(k('deltoid.acromial')).key).toEqual({ kind: 'part', muscle: 'deltoid', part: 'acromial' });
  });

  test('a group is refused with a pointer to the muscle category key', () => {
    const p = parseFxm(k('g:hamstrings'));
    expect(p).toMatchObject({ ok: false, issues: [{ code: 'group' }] });
    expect(p.issues[0]!.message).toContain('FXMG=1.0/');
  });

  test('canonical form: surrounding space trimmed, everything else already canonical', () => {
    expect(canonicalFxm(`  ${k('soleus')}\n`)).toBe(k('soleus'));
    for (const text of [k('deltoid.acromial'), k('iliocostalis'), k('extensor-carpi-radialis-longus')]) {
      const p = parseFxm(text);
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
    [k('g:'), 'group'],
    [k('g:hamstrings'), 'group'],
    [k('deltoid/acromial'), 'token'],
    [k('deltoidus'), 'unknown-muscle'],
    [k('deltoid.anterior'), 'unknown-part'],
    [k('deltoid.acromial-left'), 'unknown-part'],
    [k('soleus.medial'), 'unknown-part'],
    [k('erector-spinae'), 'unknown-muscle'],
  ])('refuses %j with %s', (text, code) => {
    expect(parseFxm(text).ok).toBe(false);
    expect(codes(text)).toEqual([code]);
  });

  test('canonicalFxm throws with every issue', () => {
    expect(() => canonicalFxm(k('deltoidus'))).toThrow(/no muscle "deltoidus"/);
  });
});

describe('leaves and grades', () => {
  test('a muscle with parts expands to its parts; a part or a muscle without parts to itself', () => {
    expect(expandFxm(k('deltoid'))).toEqual(['deltoid.acromial', 'deltoid.clavicular', 'deltoid.spinal']);
    expect(expandFxm(k('soleus'))).toEqual(['soleus']);
    expect(expandFxm(k('deltoid.spinal'))).toEqual(['deltoid.spinal']);
  });

  test('grades two keys by the leaves they cover', () => {
    expect(gradeFxm(k('deltoid.acromial'), k('deltoid.acromial'))).toEqual({ grade: 'identical', shared: ['deltoid.acromial'] });
    expect(gradeFxm(k('deltoid'), k('deltoid.acromial'))).toEqual({ grade: 'contains', container: 'a', shared: ['deltoid.acromial'] });
    expect(gradeFxm(k('deltoid.acromial'), k('deltoid'))).toMatchObject({ grade: 'contains', container: 'b' });
    expect(gradeFxm(k('pectoralis-major.sternocostal'), k('pectoralis-major.abdominal'))).toEqual({ grade: 'disjoint', shared: [] });
    expect(() => gradeFxm(k('g:hamstrings'), k('deltoid'))).toThrow(/group/);
  });
});

describe('building a vocabulary', () => {
  const muscle = (token: string, parts: string[] = []): FxmMuscle => ({
    token, name: token, anchors: [], ...(parts.length > 0 ? { parts: parts.map((p) => ({ token: p, name: p, anchors: [] })) } : {}),
  });

  test('refuses duplicates and bad tokens', () => {
    expect(() => createFxmVocabulary([muscle('a'), muscle('a')])).toThrow(/duplicate muscle token "a"/);
    expect(() => createFxmVocabulary([muscle('a', ['x', 'x'])])).toThrow(/duplicate part token "a.x"/);
    expect(() => createFxmVocabulary([muscle('Deltoid')])).toThrow(/token/);
    expect(() => createFxmVocabulary([muscle('deltoid', ['Front'])])).toThrow(/token/);
  });
});

describe('anatomy anchors', () => {
  const terms = FXM_MUSCLES.flatMap((m) => [{ key: k(m.token), ...m }, ...(m.parts ?? []).map((p) => ({ key: k(`${m.token}.${p.token}`), ...p }))]);

  test('every muscle and part carries an FMA anchor', () => {
    for (const t of terms) expect(t.anchors.filter((a) => a.system === 'FMA').length, t.key).toBe(1);
  });

  test('every muscle and part carries an UBERON anchor or a listed gap, never both', () => {
    for (const t of terms) {
      const uberon = t.anchors.some((a) => a.system === 'UBERON');
      expect(uberon !== (t.uberonNote !== undefined), t.key).toBe(true);
    }
  });

  test('anchor ids are well-formed and no two terms share one', () => {
    const ids = terms.flatMap((t) => t.anchors.map((a) => a.id));
    for (const id of ids) expect(id).toMatch(/^(FMA:\d+|UBERON:\d{7})$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('95 terms: 95 FMA, 75 UBERON, 20 UBERON gaps', () => {
    expect(terms.length).toBe(95);
    expect(terms.filter((t) => t.anchors.some((a) => a.system === 'UBERON')).length).toBe(75);
    expect(terms.filter((t) => t.uberonNote !== undefined).length).toBe(20);
  });

  test('names the muscles the categories need: the rotator cuff, the erector spinae columns, the pectorals, the abdominal wall, the arm, forearm and shank compartments', () => {
    for (const token of [
      'supraspinatus', 'infraspinatus', 'subscapularis', 'teres-minor', 'teres-major', 'pectoralis-minor', 'subclavius', 'transversus-abdominis',
      'plantaris', 'coracobrachialis', 'iliocostalis', 'longissimus', 'spinalis',
    ]) expect(parseFxm(k(token)).ok, token).toBe(true);
  });
});
