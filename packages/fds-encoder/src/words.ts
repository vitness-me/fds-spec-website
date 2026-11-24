// Movement-word datasets. A movement word is the usual reading of every FXI layer at once ("squat"); the words are a
// provider's catalogue data, not part of the notation, so the encoder loads them from a dataset the user supplies.
// Without one, every exercise is still encoded through the `other` answer, joint by joint.
import {
  BODY_POINTS, EQUIPMENT_TOKENS, ERG_TYPES, FXI_LAYERS, FXI_MAJOR, FXI_REV, HOLD_ONLY, LOAD_IFACES, MAC_DIRECTIONS,
  MAC_SINGLE_JOINT, MAC_VERBS,
} from './alphabet.js';
import { parseFxi } from './syntax.js';

export interface MachineDefault {
  /** FXE guided motion (`m`) of the machine built for this movement. */
  readonly m: string;
  /** FXE load interface (`l`): where the machine's moving part meets the body. */
  readonly l: string;
  /** True when the usual machine has a chest pad (row machines, donkey calf raise). */
  readonly chest?: boolean;
}

/** A closed question inside a movement word. Each option patches the word's layers. */
export interface WordAsk {
  /** The option the word means when nothing else is said; absent when the owner must answer. */
  readonly usual?: string;
  /** Option id → patch: `layer:value` pairs joined by `/`. `layer:-` removes the layer; an empty patch changes nothing. */
  readonly options: Readonly<Record<string, string>>;
}

/** One movement word: the published default reading of a word, which the flow's "usual" answers come from. */
export interface MovementWord {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  /** FXI layers this word fixes, written as `layer:value` pairs joined by `/`. */
  readonly fxi: string;
  /** Usual hold point by implement token. `*` covers every token not listed. Bar-like tokens fall back to `bb`. */
  readonly hold?: Readonly<Record<string, string>>;
  /** Hold point of a bar when the load passes behind the head (`p:behind`). */
  readonly holdBehind?: string;
  readonly mac?: MachineDefault;
  /** The cardio machine type the word names. */
  readonly erg?: string;
  /** The word's grip width holds only with a two-hand bar. */
  readonly gBar?: boolean;
  /** Closed questions inside the word, by question id (see `WordSet.questions`). */
  readonly asks?: Readonly<Record<string, WordAsk>>;
  /** A "pick this, not that" note for near-synonym words. */
  readonly note?: string;
}

export interface WordQuestion {
  readonly text: string;
  readonly help: string;
  /** Option id → label. Each word that asks the question offers the options its `asks` entry lists. */
  readonly labels: Readonly<Record<string, string>>;
}

/** A movement-word dataset: its name and version, which an answers record cites, its words and their questions. */
export interface WordSet {
  readonly name: string;
  readonly version: string;
  readonly words: readonly MovementWord[];
  readonly questions: Readonly<Record<string, WordQuestion>>;
}

/** No dataset: the flow offers only `other` and `unknown` for the movement. */
export const NO_WORDS: WordSet = { name: '', version: '', words: [], questions: {} };

/** A dataset that does not meet the format. `problems` lists every fault, one line each. */
export class WordSetError extends Error {
  constructor(readonly origin: string, readonly problems: readonly string[]) {
    super(`${origin}: not a movement-word dataset:\n  ${problems.join('\n  ')}`);
  }
}

/** The word's FXI layers with the answers to its word questions applied. */
export function patchedLayers(t: MovementWord, answer: (q: string) => string | undefined): Record<string, string> {
  const out = layersOf(t.fxi);
  for (const [q, ask] of Object.entries(t.asks ?? {})) {
    const a = answer(q);
    const pick = a === undefined || a === 'usual' ? ask.usual : a;
    const patch = pick === undefined ? undefined : ask.options[pick];
    if (patch === undefined || patch === '') continue;
    applyPatch(out, patch);
  }
  return out;
}

function layersOf(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of text.split('/')) {
    if (part === '') continue;
    const i = part.indexOf(':');
    out[part.slice(0, i)] = part.slice(i + 1);
  }
  return out;
}

function applyPatch(layers: Record<string, string>, patch: string): void {
  for (const p of patch.split('/')) {
    const i = p.indexOf(':');
    const v = p.slice(i + 1);
    if (v === '-') delete layers[p.slice(0, i)];
    else layers[p.slice(0, i)] = v;
  }
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = ['other', 'unknown', 'usual'];
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const holdPoint = (p: string): boolean => Object.hasOwn(BODY_POINTS, p) || Object.hasOwn(HOLD_ONLY, p);

function layerProblems(where: string, text: string, allowRemove: boolean): string[] {
  const out: string[] = [];
  for (const part of text.split('/')) {
    if (part === '' && allowRemove) continue;
    const i = part.indexOf(':');
    const layer = i < 0 ? part : part.slice(0, i);
    if (i < 0 || part.slice(i + 1) === '') out.push(`${where}: "${part}" is not layer:value.`);
    else if (!Object.hasOwn(FXI_LAYERS, layer)) out.push(`${where}: "${layer}" is not an FXI layer.`);
    else if (part.slice(i + 1) === '-' && !allowRemove) out.push(`${where}: "${part}" removes a layer; only a word question's option may.`);
  }
  return out;
}

function fxiProblems(where: string, layers: Record<string, string>): string[] {
  const text = `FXI=${FXI_MAJOR}.${FXI_REV}/${Object.entries(layers).map(([k, v]) => `${k}:${v}`).join('/')}`;
  const p = parseFxi(text);
  return p.ok ? [] : [`${where}: ${p.issues.map((i) => i.message).join('; ')}`];
}

function machineProblems(where: string, mac: unknown): string[] {
  if (!isObject(mac)) return [`${where}: mac must be an object {m, l, chest?}.`];
  const out: string[] = [];
  const m = String(mac.m);
  const [verb = '', dir = ''] = m.split('.');
  if (!MAC_SINGLE_JOINT.includes(m) && !(MAC_VERBS.includes(verb) && Object.hasOwn(MAC_DIRECTIONS, dir))) out.push(`${where}: mac.m "${m}" is not a guided motion.`);
  if (typeof mac.l !== 'string' || !mac.l.split('+').every((l) => Object.hasOwn(LOAD_IFACES, l))) out.push(`${where}: mac.l "${String(mac.l)}" is not a load interface.`);
  if (mac.chest !== undefined && typeof mac.chest !== 'boolean') out.push(`${where}: mac.chest must be true or false.`);
  return out;
}

function wordProblems(w: Record<string, unknown>, where: string, questions: Readonly<Record<string, WordQuestion>>): string[] {
  const out: string[] = [];
  if (!isText(w.label)) out.push(`${where}: needs a "label".`);
  if (typeof w.group !== 'string') out.push(`${where}: needs a "group".`);
  if (typeof w.fxi !== 'string') return [...out, `${where}: needs "fxi", the layers the word fixes as layer:value joined by "/".`];
  const own = layerProblems(`${where} fxi`, w.fxi, false);
  out.push(...own);
  if (own.length === 0) out.push(...fxiProblems(`${where} fxi`, layersOf(w.fxi)));
  if (w.hold !== undefined) {
    if (!isObject(w.hold)) out.push(`${where}: hold must map implement tokens to hold points.`);
    else for (const [token, point] of Object.entries(w.hold)) {
      if (token !== '*' && !EQUIPMENT_TOKENS[token]?.load) out.push(`${where}: hold names "${token}", which is not a load token.`);
      if (typeof point !== 'string' || !holdPoint(point)) out.push(`${where}: hold.${token} "${String(point)}" is not a hold point.`);
    }
  }
  if (w.holdBehind !== undefined && (typeof w.holdBehind !== 'string' || !holdPoint(w.holdBehind))) out.push(`${where}: holdBehind "${String(w.holdBehind)}" is not a hold point.`);
  if (w.mac !== undefined) out.push(...machineProblems(where, w.mac));
  if (w.erg !== undefined && (typeof w.erg !== 'string' || ERG_TYPES[w.erg] === undefined)) out.push(`${where}: erg "${String(w.erg)}" is not a cardio machine type.`);
  if (w.gBar !== undefined && typeof w.gBar !== 'boolean') out.push(`${where}: gBar must be true or false.`);
  if (w.note !== undefined && typeof w.note !== 'string') out.push(`${where}: note must be a string.`);
  if (w.asks !== undefined) {
    if (!isObject(w.asks)) return [...out, `${where}: asks must map question ids to {usual?, options}.`];
    for (const [q, ask] of Object.entries(w.asks)) {
      const at = `${where} asks ${q}`;
      const question = questions[q];
      if (question === undefined) { out.push(`${at}: "${q}" is not in the dataset's questions.`); continue; }
      if (!isObject(ask) || !isObject(ask.options)) { out.push(`${at}: needs "options", option id → patch.`); continue; }
      for (const [o, patch] of Object.entries(ask.options)) {
        if (!Object.hasOwn(question.labels, o)) out.push(`${at}: option "${o}" has no label in the question.`);
        if (typeof patch !== 'string') { out.push(`${at}.${o}: a patch is a string.`); continue; }
        if (patch === '') continue;
        const bad = layerProblems(`${at}.${o}`, patch, true);
        out.push(...bad);
        if (bad.length === 0 && own.length === 0) {
          const patched = layersOf(w.fxi);
          applyPatch(patched, patch);
          out.push(...fxiProblems(`${at}.${o}`, patched));
        }
      }
      if (ask.usual !== undefined && (typeof ask.usual !== 'string' || !Object.hasOwn(ask.options, ask.usual))) out.push(`${at}: usual "${String(ask.usual)}" is not one of its options.`);
    }
  }
  return out;
}

/**
 * Reads and checks a movement-word dataset: `{name, version, words, questions}`. Every word must parse as FXI layers,
 * name only real tokens, points, machines and cardio types, and ask only questions the dataset defines; every option
 * patch must leave the word valid. Throws `WordSetError` listing every fault.
 */
export function readWordSet(raw: unknown, origin = 'movement-word dataset'): WordSet {
  if (!isObject(raw)) throw new WordSetError(origin, ['The dataset is a JSON object {name, version, words, questions}.']);
  const problems: string[] = [];
  if (!isText(raw.name)) problems.push('needs a "name", which answers records cite.');
  if (!isText(raw.version)) problems.push('needs a "version", which answers records cite.');
  const questionsRaw = raw.questions ?? {};
  if (!isObject(questionsRaw)) problems.push('"questions" maps question ids to {text, help, labels}.');
  const questions: Record<string, WordQuestion> = {};
  for (const [id, q] of Object.entries(isObject(questionsRaw) ? questionsRaw : {})) {
    if (!/^word\.[a-z][a-z0-9-]*$/.test(id)) problems.push(`question "${id}": a word question id is "word." and a lowercase name.`);
    if (!isObject(q) || !isText(q.text) || typeof q.help !== 'string' || !isObject(q.labels) || !Object.values(q.labels).every(isText)) {
      problems.push(`question "${id}": needs "text", "help" and "labels" (option id → label).`);
      continue;
    }
    questions[id] = q as unknown as WordQuestion;
  }
  if (!Array.isArray(raw.words)) problems.push('"words" is a list of movement words.');
  const seen = new Set<string>();
  for (const [i, w] of (Array.isArray(raw.words) ? raw.words : []).entries()) {
    const where = `word ${i + 1}${isObject(w) && typeof w.id === 'string' ? ` (${w.id})` : ''}`;
    if (!isObject(w)) { problems.push(`${where}: a word is an object.`); continue; }
    if (typeof w.id !== 'string' || !ID.test(w.id)) problems.push(`${where}: "id" is lowercase kebab-case.`);
    else if (RESERVED.includes(w.id)) problems.push(`${where}: "${w.id}" is an answer the flow already has.`);
    else if (seen.has(w.id)) problems.push(`${where}: the id is repeated.`);
    if (typeof w.id === 'string') seen.add(w.id);
    problems.push(...wordProblems(w, where, questions));
  }
  if (problems.length > 0) throw new WordSetError(origin, problems);
  return { name: raw.name as string, version: raw.version as string, words: raw.words as MovementWord[], questions };
}
