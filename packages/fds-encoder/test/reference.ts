// The VITNESS reference tool, for the tests that compare the package with it. Its directory comes from
// FDS_ENCODER_REFERENCE; when the variable is unset, as it is in CI, those tests are skipped.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const REF = process.env.FDS_ENCODER_REFERENCE ?? '';
export const present = REF !== '' && existsSync(join(REF, 'syntax.ts'));
export const skipReason = REF === '' ? 'FDS_ENCODER_REFERENCE is not set' : `the reference tool is not at ${REF}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Mod = Record<string, any>;

/** A module of the reference tool, by its path inside the tool. */
export const load = async (rel: string): Promise<Mod> => (await import(/* @vite-ignore */ join(REF, rel))) as Mod;

/** The reference tool's modules the tests use. */
export interface Reference {
  readonly alphabet: Mod; readonly syntax: Mod; readonly compare: Mod; readonly crosscheck: Mod; readonly fxm: Mod; readonly fxmg: Mod;
  readonly fxmAlphabet: Mod; readonly fxmgAlphabet: Mod; readonly match: Mod; readonly build: Mod;
}

export async function loadReference(): Promise<Reference> {
  return {
    alphabet: await load('alphabet.ts'), syntax: await load('syntax.ts'), compare: await load('compare.ts'), crosscheck: await load('crosscheck.ts'),
    fxm: await load('fxm.ts'), fxmg: await load('fxmg.ts'), fxmAlphabet: await load('fxm-alphabet.ts'), fxmgAlphabet: await load('fxmg-alphabet.ts'),
    match: await load('match.ts'), build: await load('builder/build.ts'),
  };
}

/** The reference tool's cross-check gives messages; the package gives codes. */
const WARNING_CODE: [RegExp, string][] = [
  [/^cannot cross-check/, 'invalid'], [/contradicts the row FXE/, 'main-equipment'], [/^floor@feet is implied/, 'feet-implied'],
  [/^FXE posture/, 'posture'], [/does not fit FXE load interface/, 'load-interface'], [/^off-design use/, 'off-design'],
];
export const warningCode = (message: string): string => WARNING_CODE.find(([re]) => re.test(message))?.[1] ?? `unmapped: ${message}`;

/** The reference tool's builder asks for a movement word first; without one, an exercise is described joint by joint. */
export const referenceAnswers = <T extends Record<string, unknown>>(answers: T): T =>
  (answers.subject === 'equipment' ? answers : { movement: 'other', ...answers });
