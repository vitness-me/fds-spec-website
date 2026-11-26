import { describe, expect, test } from 'vitest';
import { build } from '../src/builder/build';
import { compare } from '../src/compare';
import { crossCheck } from '../src/crosscheck';
import { parseFxe, parseFxi } from '../src/syntax';





describe('feet on the floor are implied only under a surface that bears the trunk', () => {
  test('a lean-back row keeps its feet; a body lying on a ball or bench does not', () => {
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:supine/s:bar.fixed@hands+floor@feet/l:none', 'FXE=1.0S/k:sup/f:bar.fixed')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:supine.incline/s:floor@feet+strap.susp@hands/l:none', 'FXE=1.0S/k:sup/f:strap.susp')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:sp.flex/o:supine/k:trunk/s:ball.stab+floor@feet/l:none', 'FXE=1.0S/k:sup/f:ball.stab').some((w) => w.code === 'feet-implied')).toBe(true);
    expect(crossCheck('FXI=1.0S/m:hip.ext/o:supine/k:trunk/s:bench@back+floor@feet/l:none', 'FXE=1.0S/k:sup/f:bench').some((w) => w.code === 'feet-implied')).toBe(true);
  });
});

describe('an implement of unknown kind stays an implement when its hold point is unknown too', () => {
  test('?@? is kept; a bare ? stays open', () => {
    expect(parseFxi('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball.stab/l:?@?').canonical).toBe('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball.stab/l:?@?');
    expect(parseFxi('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball.stab/l:?').canonical).toBe('FXI=1.0S/m:sp.lflex/o:side-lying/s:ball.stab/l:?');
  });
  test('compare: ?@? is narrower than ? and broader than a named implement', () => {
    const s = (l: string): string => `FXI=1.0S/m:el.ext+sh.hadd/o:prone/s:floor@feet,hands/l:${l}`;
    expect(compare(s('bell.dumb@hands'), s('?@?')).relation).toBe('refines');
    expect(compare(s('?@?'), s('?')).relation).toBe('compatible');
  });
});


describe('a drop start (depth jump)', () => {
  const jump = 'm:^ank.pf+hip.ext+kn.ext/o:standing';
  test('from-drop is a start code', () => {
    expect(parseFxi(`FXI=1.0S/${jump}/l:none/r:from-drop`).ok).toBe(true);
    expect(parseFxi(`FXI=1.0S/${jump}/l:none/r:from-drop+from-floor`).ok).toBe(false);
  });
});

describe('a stretching strap is an equipment form', () => {
  test('FXE strap.stretch is an accessory', () => {
    expect(parseFxe('FXE=1.0S/k:acc/f:strap.stretch').ok).toBe(true);
    expect(build({ id: 'e', answers: { subject: 'equipment', 'eq.kind': 'acc', 'eq.form.acc': 'strap.stretch' } }).fxe).toBe('FXE=1.0S/k:acc/f:strap.stretch');
  });
});




describe('held codes that cannot combine', () => {
  test('straight legs and bent knees, upper arms overhead and out to the sides', () => {
    expect(parseFxi('FXI=1.0S/m:hip.flex/o:hanging/s:bar.fixed/l:none/h:kn.bent+legs.l').ok).toBe(false);
    expect(parseFxi('FXI=1.0S/m:el.ext/o:standing/l:bell.dumb@hands/h:ua.oh+ua.side').ok).toBe(false);
  });
});

