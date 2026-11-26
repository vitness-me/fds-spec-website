import { describe, expect, test } from 'vitest';
import { ACCESSORIES, BODY_POINTS, EQUIPMENT_TOKENS, ERG_CYCLES, FORMS, FXE_KINDS, ORIENTATIONS } from '../src/alphabet';
import { build } from '../src/builder/build';
import { exercise, ROW_MACHINE } from './helpers';
import { QUESTIONS } from '../src/builder/flow';
import { compare } from '../src/compare';
import { crossCheck } from '../src/crosscheck';
import { parseFxe, parseFxi } from '../src/syntax';

const fxeOk = (s: string): boolean => parseFxe(s).ok;
const fxiOk = (s: string): boolean => parseFxi(s).ok;
const optionValues = (id: string): string[] =>
  QUESTIONS.find((q) => q.id === id)!.options.map((o) => o.value ?? o.id).filter((v) => !['usual', '?'].includes(v));

describe('one body-point vocabulary: FXI hold and support points are FXE load interfaces', () => {
  const points = Object.keys(BODY_POINTS);

  test('every FXI body point is an FXE load interface', () => {
    expect(points.filter((p) => !fxeOk(`FXE=1.0S/k:mac/l:${p}/s:?/m:?`))).toEqual([]);
  });

  test('every FXE load interface is an FXI body point, as a hold and as a support point', () => {
    const ifaces = optionValues('eq.mac.contact');
    expect(ifaces.sort()).toEqual([...points].sort());
    expect(ifaces.filter((p) => !fxiOk(`FXI=1.0S/m:kn.ext/o:seated/l:mac@${p}`) || !fxiOk(`FXI=1.0S/m:kn.ext/o:seated/s:bench@${p}/l:none`))).toEqual([]);
  });

  test('a code outside the shared list is no FXE load interface', () => {
    for (const old of ['hand', 'foot', 'ankle', 'thigh', 'knee', 'arm', 'shoulder', 'hip']) expect(fxeOk(`FXE=1.0S/k:mac/l:${old}/s:?/m:?`), old).toBe(false);
  });

  test('a machine hold and its FXE interface name the same point', () => {
    expect(crossCheck('FXI=1.0S/m:kn.flex/o:seated/l:mac@ankles/x:u', 'FXE=1.0S/k:mac/l:ankles/s:seated/m:kn.flex')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:sh.hadd/o:seated/l:mac@forearms', 'FXE=1.0S/k:mac/l:arms/s:seated/m:sh.hadd')).toHaveLength(1);
    expect(crossCheck('FXI=1.0S/m:el.ext+sh.flex/o:standing/l:mac@overhead', 'FXE=1.0S/k:mac/l:hands/s:standing/m:push.up')).toEqual([]);
  });

  test('a cardio machine hold is checked for every cycle code, not only plain erg', () => {
    const rower = 'FXE=1.0S/k:erg/c:rail/l:hands/s:seated/m:row';
    expect(crossCheck('FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg@hands', rower)).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@hands', rower)).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:~el.flex+hip.ext+kn.ext+sh.ext/o:seated/l:erg.row@feet', rower)).toHaveLength(1);
    expect(crossCheck('FXI=1.0S/m:~el.ext+sh.ext/o:standing/l:erg.ski@feet', 'FXE=1.0S/k:erg/c:cable/l:hands/s:standing/m:ski')).toHaveLength(1);
  });
});

describe('one posture vocabulary: FXE machine postures are FXI orientations', () => {
  const orientations = Object.keys(ORIENTATIONS);

  test('every FXI orientation is an FXE posture', () => {
    expect(orientations.filter((o) => !fxeOk(`FXE=1.0S/k:mac/l:?/s:${o}/m:?`))).toEqual([]);
  });

  test('every FXE posture is an FXI orientation', () => {
    const postures = optionValues('eq.mac.posture');
    expect(postures.sort()).toEqual([...orientations].sort());
    expect(postures.filter((o) => !fxiOk(`FXI=1.0S/m:?/o:${o}/l:?`))).toEqual([]);
  });

  test('the chest-supported positions are FXI orientations', () => {
    expect(fxiOk('FXI=1.0S/m:el.flex+sh.ext/o:seated.chest/l:mac@hands')).toBe(true);
    expect(fxiOk('FXI=1.0S/m:ank.pf/o:standing.chest/l:mac@hips')).toBe(true);
  });

  test('a code outside the shared list is no FXE posture', () => {
    for (const old of ['seat', 'seat.chest', 'stand', 'stand.chest', 'recline', 'kneel', 'hang', 'side']) expect(fxeOk(`FXE=1.0S/k:mac/l:?/s:${old}/m:?`), old).toBe(false);
  });

  test('a machine posture is the FXI start orientation', () => {
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:seated.chest/l:mac@hands', 'FXE=1.0S/k:mac/l:hands/s:seated.chest/m:pull.back')).toEqual([]);
    expect(crossCheck('FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mac@hands', 'FXE=1.0S/k:mac/l:hands/s:seated.chest/m:pull.back')).toHaveLength(1);
  });

  test('the builder writes a chest pad into both keys', () => {
    const row = build({ id: 'row', answers: exercise({ sh: ['row-close'], el: ['flex'] }, 'seated', { ...ROW_MACHINE, 'mac.chest': 'yes' }) });
    expect(row).toMatchObject({ fxi: 'FXI=1.0S/m:el.flex+sh.ext/o:seated.chest/l:mac@hands', fxe: 'FXE=1.0S/k:mac/l:hands/s:seated.chest/m:pull.back' });
    const noPad = build({ id: 'row', answers: exercise({ sh: ['row-close'], el: ['flex'] }, 'seated.chest', { ...ROW_MACHINE, 'mac.chest': 'no' }) });
    expect(noPad).toMatchObject({ fxi: 'FXI=1.0S/m:el.flex+sh.ext/o:seated/l:mac@hands', fxe: 'FXE=1.0S/k:mac/l:hands/s:seated/m:pull.back' });
  });
});

describe('the ski machine', () => {
  test('is erg.ski in FXI and m:ski in FXE', () => {
    expect(Object.keys(ERG_CYCLES)).toContain('ski');
    expect(fxiOk('FXI=1.0S/m:~el.ext+sh.ext/o:standing/l:erg.ski@hands')).toBe(true);
    expect(fxeOk('FXE=1.0S/k:erg/c:cable/l:hands/s:standing/m:ski')).toBe(true);
  });
  test('pole is only the support form', () => {
    expect(fxiOk('FXI=1.0S/m:?/o:standing/l:erg.pole@hands')).toBe(false);
    expect(fxeOk('FXE=1.0S/k:erg/c:cable/l:hands/s:standing/m:pole')).toBe(false);
    expect(EQUIPMENT_TOKENS.pole?.load).toBe(false);
  });
});

describe('every FXE form code is an FXI code', () => {
  test('every implement, station and support form is an FXI equipment code, children included', () => {
    const left = Object.entries(FORMS).filter(([code, f]) => f.k !== 'acc' && EQUIPMENT_TOKENS[code] === undefined);
    expect(left.map(([code]) => code)).toEqual([]);
  });

  test('every accessory form is an FXI accessory code', () => {
    const left = Object.entries(FORMS).filter(([code, f]) => f.k === 'acc' && !Object.hasOwn(ACCESSORIES, code));
    expect(left.map(([code]) => code)).toEqual([]);
  });

  test('a band child loads with the same hold, count and parent rules as the band', () => {
    expect(parseFxi('FXI=1.0S/m:hip.abd/o:standing/l:band.mini*1@knees').canonical).toBe('FXI=1.0S/m:hip.abd/o:standing/l:band.mini@knees');
    expect(parseFxi('FXI=1.0S/m:hip.abd/o:standing/l:band.mini').issues.map((i) => i.code)).toContain('missing-hold');
    expect(compare('FXI=1.0S/m:el.flex/o:standing/l:band.loop@hands', 'FXI=1.0S/m:el.flex/o:standing/l:band@hands').relation).toBe('refines');
    expect(compare('FXI=1.0S/m:el.flex/o:standing/l:band.loop@hands', 'FXI=1.0S/m:el.flex/o:standing/l:band.tube@hands').relation).toBe('contradicting');
  });

  test('a named band type is the FXI load and the row FXE', () => {
    const b = build({ id: 'walk', answers: exercise({ hip: ['abd'] }, 'standing', { load: 'implement', imp1: 'band', hold1: 'knees', 'band.type': 'mini' }, ['footwork'], { footwork: 'travel.side' }) });
    expect(b.fxi).toContain('l:band.mini@');
    expect(b.fxe).toBe('FXE=1.0S/k:imp/f:band.mini');
  });
});

describe('every FXI equipment and accessory code is an FXE code', () => {
  test('each equipment code is an FXE form, an FXE kind or a cardio machine of one cycle', () => {
    const bad = Object.keys(EQUIPMENT_TOKENS).filter((code) => !Object.hasOwn(FORMS, code) && !Object.hasOwn(FXE_KINDS, code)
      && !(code.startsWith('erg.') && Object.hasOwn(ERG_CYCLES, code.slice(4))));
    expect(bad).toEqual([]);
  });

  test('each accessory code but none and partner is an FXE accessory form', () => {
    const bad = Object.keys(ACCESSORIES).filter((code) => !['none', 'partner'].includes(code) && FORMS[code]?.k !== 'acc');
    expect(bad).toEqual([]);
    expect(parseFxi('FXI=1.0S/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch').canonical).toBe('FXI=1.0N/m:%ank.df+kn.ext/o:seated/l:none/x:u/a:strap.stretch');
    expect(fxiOk('FXI=1.0N/m:%ank.df/o:seated/l:none/a:strap')).toBe(false);
    expect(fxiOk('FXI=1.0N/m:%ank.df/o:seated/l:none/a:partner')).toBe(true);
  });
});
