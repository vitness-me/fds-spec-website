import { describe, expect, test } from 'vitest';
import { JOINT_ACTIONS, LINES } from '../src/alphabet';
import { QUESTIONS } from '../src/builder/flow';
import { compare } from '../src/compare';
import { parseFxi } from '../src/syntax';


const relation = (a: string, b: string): string => compare(a, b).relation;
const issues = (s: string): string[] => parseFxi(s).issues.map((i) => i.code);
const question = (id: string) => QUESTIONS.find((q) => q.id === id)!;


describe('shoulder extension from overhead is a child of shoulder extension', () => {
  const ROW = 'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mac@hands/g:ne';
  const PULLDOWN = 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands/g:ne';

  test('sh.ext.oh is a joint action and parses', () => {
    expect(JOINT_ACTIONS['sh.ext.oh']).toBeDefined();
    expect(issues(PULLDOWN)).toEqual([]);
    expect(parseFxi(PULLDOWN).canonical).toBe(PULLDOWN);
  });
  test('a neutral-grip pulldown is not the same as a seated row: the row covers it, so the pair is more specific', () => {
    expect(relation(ROW, PULLDOWN)).toBe('refined-by');
    expect(relation(PULLDOWN, ROW)).toBe('refines');
    expect(compare(PULLDOWN, ROW).layers.m).toBe('narrower');
  });
  test('the parent covers the child under any prefix, beside other actions, and in a held part', () => {
    expect(relation('FXI=1.0S/m:^sh.ext+sp.flex/o:standing/l:ball.med@hands', 'FXI=1.0S/m:^sh.ext.oh+sp.flex/o:standing/l:ball.med@hands')).toBe('refined-by');
    expect(relation('FXI=1.0S/m:=sp.flex|sh.ext/o:prone/l:none', 'FXI=1.0S/m:=sp.flex|sh.ext.oh/o:prone/l:none')).toBe('refined-by');
    expect(relation('FXI=1.0S/m:sh.?/o:standing/l:none', 'FXI=1.0S/m:sh.ext.oh/o:standing/l:none')).toBe('refined-by');
  });
  test('the child contradicts every other shoulder action, and two children never meet', () => {
    expect(relation('FXI=1.0S/m:el.flex+sh.add/o:seated/l:mac@hands', 'FXI=1.0S/m:el.flex+sh.ext.oh/o:seated/l:mac@hands')).toBe('contradicting');
    expect(relation('FXI=1.0S/m:sh.flex/o:standing/l:none', 'FXI=1.0S/m:sh.ext.oh/o:standing/l:none')).toBe('contradicting');
  });
  test('shoulder flexion and extension from overhead are opposites in one part', () => {
    expect(issues('FXI=1.0S/m:sh.ext.oh+sh.flex/o:standing/l:none')).toContain('opposite-actions');
    expect(issues('FXI=1.0S/m:sh.ext.oh+sh.ext/o:standing/l:none')).toEqual([]);
  });
  test('the canonical form drops a parent written beside its child in the same part', () => {
    expect(parseFxi('FXI=1.0S/m:sh.ext.oh+sh.ext/o:standing/l:none').canonical).toBe('FXI=1.0S/m:sh.ext.oh/o:standing/l:none');
    expect(parseFxi('FXI=1.0S/m:^sh.ext-+sh.ext.oh+sp.flex/o:standing/l:ball.med@hands').canonical).toBe('FXI=1.0S/m:^sh.ext.oh+sp.flex/o:standing/l:ball.med@hands');
    expect(parseFxi('FXI=1.0S/m:=sh.ext|sh.ext.oh/o:standing/l:none').canonical).toBe('FXI=1.0S/m:=sh.ext|sh.ext.oh/o:standing/l:none');
  });
  test('the joint-by-joint answer for a pull from overhead writes the child, a row the parent', () => {
    const sh = question('p1.sh').options;
    expect(sh.find((o) => o.id === 'pull-front')?.value).toBe('sh.ext.oh');
    expect(sh.find((o) => o.id === 'row-close')?.value).toBe('sh.ext');
  });
});


describe('a load lowered to the neck (JM press)', () => {
  const CLOSE_GRIP = 'FXI=1.0S/m:el.ext+sh.hadd/o:supine/s:bench/l:bar.straight@hands/g:w-n';
  test('p:neck is a line code', () => {
    expect(LINES.neck).toBeDefined();
    expect(issues(`${CLOSE_GRIP}/p:neck`)).toEqual([]);
  });
  test('the line question offers it', () => {
    expect(question('line').options.find((o) => o.id === 'neck')?.value).toBe('neck');
  });
});



describe('keys that write the parent shoulder extension are canonical', () => {
  const PARENT = [
    'FXI=1.0S/m:el.flex+sh.ext/o:hanging/s:bar.fixed/l:none/g:su',
    'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mac@hands/g:w-n',
    'FXI=1.0S/m:sh.ext/o:standing/l:cable@hands',
    'FXI=1.0S/m:^sh.ext+sp.flex/o:standing/l:ball.med@hands',
    'FXI=1.0S/m:hip.flex+sp.flex/o:supine/k:trunk/l:none',
    'FXI=1.0S/m:~ank.pf/o:standing/l:rope.jump@hands',
    'FXI=1.0S/m:el.ext+sh.hadd/o:supine/s:bench/l:bar.straight@hands/g:w-n',
  ];
  test('each is canonical', () => {
    for (const s of PARENT) {
      expect(issues(s), s).toEqual([]);
      expect(parseFxi(s).canonical).toBe(s);
    }
  });
});
