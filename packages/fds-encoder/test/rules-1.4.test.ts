import { describe, expect, test } from 'vitest';
import { FXI_RULES, JOINT_ACTIONS, LINES } from '../src/alphabet.js';
import { compare } from '../src/compare.js';
import { crossCheck } from '../src/crosscheck.js';
import { parseFxi } from '../src/syntax.js';
import { FLOW, ex, fxi } from './support.js';

const relation = (a: string, b: string): string => compare(a, b).relation;
const issues = (s: string): string[] => parseFxi(s).issues.map((i) => i.code);
const question = (id: string) => FLOW.byId.get(id)!;

describe('rules 1.4', () => {
  test('is the rules revision the encoder implements', () => expect(FXI_RULES).toBe('1.4'));
});

describe('ballistic means flight or release', () => {
  test('the motion-kind help never calls a held implement ballistic', () => {
    for (const id of ['p1.kind', 'p2.kind']) expect(question(id)?.help ?? '').not.toMatch(/ballistic even when|stays in the hands/);
  });
});

describe('shoulder extension from overhead is a child of shoulder extension', () => {
  const ROW = 'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:ne';
  const PULLDOWN = 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands/g:ne';

  test('sh.ext.oh is a joint action and parses', () => {
    expect(JOINT_ACTIONS['sh.ext.oh']).toBeDefined();
    expect(issues(PULLDOWN)).toEqual([]);
    expect(parseFxi(PULLDOWN).canonical).toBe(PULLDOWN);
  });
  test('a neutral-grip pulldown and a seated row with the same grip only refine: the row covers it', () => {
    expect(relation(ROW, PULLDOWN)).toBe('refined-by');
    expect(relation(PULLDOWN, ROW)).toBe('refines');
    expect(compare(PULLDOWN, ROW).layers.m).toBe('narrower');
  });
  test('the parent covers the child under any prefix, beside other actions, and in a held part', () => {
    expect(relation('FXI=1.0S/m:^sh.ext+sp.flex/o:standing/l:mb@hands', 'FXI=1.0S/m:^sh.ext.oh+sp.flex/o:standing/l:mb@hands')).toBe('refined-by');
    expect(relation('FXI=1.0S/m:=sp.flex|sh.ext/o:prone/l:bw', 'FXI=1.0S/m:=sp.flex|sh.ext.oh/o:prone/l:bw')).toBe('refined-by');
    expect(relation('FXI=1.0S/m:sh.?/o:standing/l:bw', 'FXI=1.0S/m:sh.ext.oh/o:standing/l:bw')).toBe('refined-by');
  });
  test('the child contradicts every other shoulder action', () => {
    expect(relation('FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands', 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands')).toBe('contradicting');
    expect(relation('FXI=1.0S/m:sh.flex/o:standing/l:bw', 'FXI=1.0S/m:sh.ext.oh/o:standing/l:bw')).toBe('contradicting');
  });
  test('shoulder flexion and extension from overhead are opposites in one part; the child beside its parent is not', () => {
    expect(issues('FXI=1.0S/m:sh.ext.oh+sh.flex/o:standing/l:bw')).toContain('opposite-actions');
    expect(issues('FXI=1.0S/m:sh.ext.oh+sh.ext/o:standing/l:bw')).toEqual([]);
  });
  test('the canonical form drops a parent written beside its child in the same part', () => {
    expect(parseFxi('FXI=1.0S/m:sh.ext.oh+sh.ext/o:standing/l:bw').canonical).toBe('FXI=1.0S/m:sh.ext.oh/o:standing/l:bw');
    expect(parseFxi('FXI=1.0S/m:^sh.ext-+sh.ext.oh+sp.flex/o:standing/l:mb@hands').canonical).toBe('FXI=1.0S/m:^sh.ext.oh+sp.flex/o:standing/l:mb@hands');
    expect(parseFxi('FXI=1.0S/m:=sh.ext|sh.ext.oh/o:standing/l:bw').canonical).toBe('FXI=1.0S/m:=sh.ext|sh.ext.oh/o:standing/l:bw');
  });
  test('a row and a pull from overhead picked together refine the parent, never contradict it', () => {
    const both = fxi(ex('lat-pulldown', ['motion'], {
      'motion.phases': '1', 'p1.kind': 'usual', 'p1.joints': ['el', 'sh'], 'p1.el': ['flex'], 'p1.sh': ['row-close', 'pull-front'], 'p1.short': ['usual'], 'p1.also': 'usual',
      symmetry: 'usual',
    }));
    expect(both).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands');
    expect(relation(both!, 'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands')).toBe('refines');
    expect(relation(both!, 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mach@hands')).toBe('identical');
  });
  test('the grip switch on a pull-up or pulldown word writes the child', () => {
    expect(fxi(ex('lat-pulldown', ['hand'], { 'grip.hand': 'ne' }))).toBe(PULLDOWN);
    expect(fxi(ex('pull-up', ['hand'], { 'grip.hand': 'su' }))).toBe('FXI=1.0S/m:el.flex+sh.ext.oh/o:hanging/s:bar/l:bw/g:su');
    expect(fxi(ex('lat-pulldown'))).toBe('FXI=1.0S/m:el.flex+sh.add/o:seated/l:mach@hands');
  });
  test('the joint-by-joint answer for a pull from overhead writes the child, a row the parent', () => {
    const sh = question('p1.sh').options;
    expect(sh.find((o) => o.id === 'pull-front')?.value).toBe('sh.ext.oh');
    expect(sh.find((o) => o.id === 'row-close')?.value).toBe('sh.ext');
  });
  test('a single-joint machine that guides the parent accepts the child', () => {
    expect(crossCheck('FXI=1.0S/m:sh.ext.oh/o:seated/l:mach@arms', 'FXE=1.0S/k:mac/l:arm/s:seat/m:sh.ext')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:sh.flex/o:seated/l:mach@arms', 'FXE=1.0S/k:mac/l:arm/s:seat/m:sh.ext')).not.toEqual([]);
  });
});

describe('a load lowered to the neck', () => {
  const CLOSE_GRIP = 'FXI=1.0S/m:el.ext+sh.hadd/o:supine/s:bench/l:bb@hands/g:w-n';
  test('p:neck is a line code, offered by the line question', () => {
    expect(LINES.neck).toBeDefined();
    expect(issues(`${CLOSE_GRIP}/p:neck`)).toEqual([]);
    expect(question('line').options.find((o) => o.id === 'neck')?.value).toBe('neck');
  });
  test('a word that carries it contradicts the close-grip press on p only', () => {
    const neck = fxi(ex('press-to-throat', ['equipment'], { load: 'implement', imp1: 'bb', hold1: 'usual' }))!;
    expect(neck).toBe(`${CLOSE_GRIP}/p:neck`);
    expect(compare(neck, CLOSE_GRIP).contradicting).toEqual(['p']);
  });
});

describe('a held push of a limb that does not move', () => {
  test('is a held part under the moving trunk, and contradicts the plain sit-up on m', () => {
    const held = fxi(ex('heel-pull-sit-up'))!;
    expect(held).toBe('FXI=1.0S/m:=kn.flex|hip.flex+sp.flex/o:supine/k:trunk/l:bw');
    expect(issues(held)).toEqual([]);
    expect(compare(held, fxi(ex('sit-up'))!).contradicting).toEqual(['m']);
  });
});

describe('a rope passing twice in each jump', () => {
  test('p:double is a line code, and separates it from plain rope jumping on p only', () => {
    expect(LINES.double).toBeDefined();
    const twice = fxi(ex('rope-twice'))!;
    expect(twice).toBe('FXI=1.0S/m:~ank.pf/o:standing/l:jrope@hands/p:double');
    expect(compare(twice, fxi(ex('jump-rope'))!).contradicting).toEqual(['p']);
    expect(question('line').options.find((o) => o.id === 'double')?.value).toBe('double');
  });
});

describe('strings built under rules 1.3 still parse and compare', () => {
  const RULES_13 = [
    'FXI=1.0S/m:el.flex+sh.ext/o:hanging/s:bar/l:bw/g:su',
    'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mach@hands/g:w-n',
    'FXI=1.0S/m:sh.ext/o:standing/l:cable@hands',
    'FXI=1.0S/m:^sh.ext+sp.flex/o:standing/l:mb@hands',
    'FXI=1.0S/m:hip.flex+sp.flex/o:supine/k:trunk/l:bw',
    'FXI=1.0S/m:~ank.pf/o:standing/l:jrope@hands',
    'FXI=1.0S/m:el.ext+sh.hadd/o:supine/s:bench/l:bb@hands/g:w-n',
  ];
  test('each is still canonical', () => {
    for (const s of RULES_13) {
      expect(issues(s), s).toEqual([]);
      expect(parseFxi(s).canonical).toBe(s);
    }
  });
  test('a 1.3 pull from overhead is refined by its 1.4 string; 1.3 strings still equal each other', () => {
    expect(relation(RULES_13[0]!, fxi(ex('chin-up'))!)).toBe('refined-by');
    expect(relation(RULES_13[1]!, RULES_13[1]!)).toBe('identical');
  });
});
