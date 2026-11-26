// Types for conformance.mjs, for the encoder package's tests.

export interface ConformanceAdapter {
  readonly name: string;
  readonly issueCodes?: boolean;
  check(key: string): { ok: boolean; written: string; issues?: readonly string[] };
  compare(a: string, b: string): { result: string; specific?: 'a' | 'b' };
  crossCheck(fxi: string, fxe: string): readonly string[];
  muscleInCategory(fxm: string, fxmg: string): string;
  build?(answers: Record<string, unknown>): { fxi: string | null; fxe: string } | null;
}

export interface ConformanceCases {
  readonly syntax: readonly Record<string, unknown>[];
  readonly compare: readonly Record<string, unknown>[];
  readonly build: readonly Record<string, unknown>[];
  readonly exerciseEquipment: readonly Record<string, unknown>[];
  readonly muscleInCategory: readonly Record<string, unknown>[];
}

export interface GroupReport {
  readonly total: number;
  readonly passed: number;
  readonly skipped: number;
  readonly failures: readonly Record<string, unknown>[];
}

export const CASES_DIR: string;
export function loadCases(dir?: string): ConformanceCases;
export function adapterFor(encoder: unknown, name?: string): ConformanceAdapter;
export function runCases(adapter: ConformanceAdapter, cases: ConformanceCases): Record<keyof ConformanceCases, GroupReport>;
export function failuresOf(report: Record<string, GroupReport>): ({ group: string; id: unknown } & Record<string, unknown>)[];
