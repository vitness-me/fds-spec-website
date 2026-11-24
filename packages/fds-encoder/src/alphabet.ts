// The FXI and FXE vocabularies, read from the FDS descriptor registries.
//
// `specification/registries/descriptors/*.registry.json` is the one source for every code an encoder may write; the
// build inlines it. This module reshapes those entries into the tables the parser, compare and builder read, and fails
// at load when a registry no longer has the shape this code implements.
import fxiRegistry from '../../../specification/registries/descriptors/fxi.registry.json';
import fxeRegistry from '../../../specification/registries/descriptors/fxe.registry.json';

export type Glossary = Readonly<Record<string, string>>;

interface RegistryEntry {
  readonly value: string;
  readonly description: string;
  readonly [field: string]: unknown;
}
interface Vocabulary { readonly layer: string; readonly description: string; readonly entries: readonly RegistryEntry[] }
interface Registry {
  readonly registry: string;
  readonly syntax: string;
  readonly rules: string;
  readonly layers?: readonly { readonly layer: string; readonly standard: boolean; readonly source: string; readonly description: string }[];
  readonly vocabularies: Readonly<Record<string, Vocabulary>>;
}

const FXI_REGISTRY = fxiRegistry as unknown as Registry;
const FXE_REGISTRY = fxeRegistry as unknown as Registry;

function entries(registry: Registry, name: string): readonly RegistryEntry[] {
  const v = registry.vocabularies[name];
  if (v === undefined) throw new Error(`The ${registry.registry} registry has no "${name}" vocabulary, which this encoder reads.`);
  return v.entries;
}
const glossary = (registry: Registry, name: string): Glossary =>
  Object.fromEntries(entries(registry, name).map((e) => [e.value, e.description]));
const values = (registry: Registry, name: string, where: (e: RegistryEntry) => boolean = () => true): string[] =>
  entries(registry, name).filter(where).map((e) => e.value);
const list = (v: unknown): readonly string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** The one entry of a vocabulary marked `default`. */
function defaultOf(registry: Registry, name: string): string {
  const d = values(registry, name, (e) => e.default === true);
  if (d.length !== 1) throw new Error(`The ${registry.registry} "${name}" vocabulary marks ${d.length} defaults; this encoder needs exactly one.`);
  return d[0]!;
}

/** Each unordered pair once, in the order its first member appears, from an entry field naming the other member(s). */
function pairs(registry: Registry, name: string, field: string): readonly (readonly [string, string])[] {
  const out: [string, string][] = [];
  for (const e of entries(registry, name)) {
    const others = typeof e[field] === 'string' ? [e[field] as string] : list(e[field]);
    for (const o of others) if (!out.some(([a, b]) => (a === o && b === e.value) || (a === e.value && b === o))) out.push([e.value, o]);
  }
  return out;
}

function syntaxOf(registry: Registry): [number, number] {
  const m = /^(\d+)\.(\d+)$/.exec(registry.syntax);
  if (m === null) throw new Error(`The ${registry.registry} registry syntax "${registry.syntax}" is not <major>.<revision>.`);
  return [Number(m[1]), Number(m[2])];
}

export const UNKNOWN = '?';
export const GENERIC = '*';

export const [FXI_MAJOR, FXI_REV] = syntaxOf(FXI_REGISTRY);
export const [FXE_MAJOR, FXE_REV] = syntaxOf(FXE_REGISTRY);
/** The rules revision this encoder implements: the revision of the registries it was built from. Never written in a string. */
export const FXI_RULES = FXI_REGISTRY.rules;
if (FXE_REGISTRY.rules !== FXI_RULES) throw new Error(`The FXI registry is rules ${FXI_RULES} and the FXE registry rules ${FXE_REGISTRY.rules}; one encoder implements one rules revision.`);

// ───────────────────────────── FXI layers ─────────────────────────────

/** The FXI layers this code has a reader for, in their fixed order. The registry must list exactly these. */
const CODE_LAYERS = ['m', 'o', 'k', 'f', 's', 'l', 'x', 'g', 'r', 'h', 'p', 'a'] as const;
export type FxiLayer = (typeof CODE_LAYERS)[number];

const registryLayers = FXI_REGISTRY.layers ?? [];
if (registryLayers.map((l) => l.layer).join() !== CODE_LAYERS.join()) {
  throw new Error(`The FXI registry lists layers ${registryLayers.map((l) => l.layer).join(', ')}; this encoder reads ${CODE_LAYERS.join(', ')}. A new layer needs a reader.`);
}

/** FXI layers in their fixed order. `std` layers form the standard FXI; the others are extended and compared only when both strings carry them. */
export const FXI_LAYERS: Readonly<Record<FxiLayer, { readonly std: boolean; readonly source: string; readonly gloss: string }>> =
  Object.fromEntries(registryLayers.map((l) => [l.layer, { std: l.standard, source: l.source, gloss: l.description }])) as Record<FxiLayer, { std: boolean; source: string; gloss: string }>;
export const FXI_LAYER_ORDER: readonly FxiLayer[] = [...CODE_LAYERS];
export const FXI_STANDARD_LAYERS: readonly FxiLayer[] = FXI_LAYER_ORDER.filter((l) => FXI_LAYERS[l].std);

export const JOINTS: Glossary = glossary(FXI_REGISTRY, 'joints');
export const ARM_JOINTS: readonly string[] = values(FXI_REGISTRY, 'joints', (e) => e.limb === 'arm');
export const LEG_JOINTS: readonly string[] = values(FXI_REGISTRY, 'joints', (e) => e.limb === 'leg');
/** Joints that take the `.circ` action: circling the joint through all directions. */
export const CIRC_JOINTS: readonly string[] = values(FXI_REGISTRY, 'joints', (e) => e.circles === true);

export const JOINT_ACTIONS: Glossary = glossary(FXI_REGISTRY, 'jointActions');
export const OPPOSITE_ACTIONS = pairs(FXI_REGISTRY, 'jointActions', 'opposite');
/** Joint actions that refine a parent action. A parent covers its children in compare and shares their opposite. */
export const ACTION_PARENT: Readonly<Record<string, string>> =
  Object.fromEntries(entries(FXI_REGISTRY, 'jointActions').filter((e) => typeof e.parent === 'string').map((e) => [e.value, e.parent as string]));

export const ORIENTATIONS: Glossary = glossary(FXI_REGISTRY, 'orientations');
/** Body points each start orientation implies on its support. Never written. */
export const IMPLIED_POINTS: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(entries(FXI_REGISTRY, 'orientations').map((e) => [e.value, list(e.impliedPoints)]));

export const MOVING_END: Glossary = glossary(FXI_REGISTRY, 'movingEnds');
export const FOOTWORK: Glossary = glossary(FXI_REGISTRY, 'footwork');
/** Body points: where a load is held (`l`) and which points bear weight on a support (`s`). */
export const BODY_POINTS: Glossary = glossary(FXI_REGISTRY, 'bodyPoints');
/** Hold points that are not body points. */
export const HOLD_ONLY: Glossary = glossary(FXI_REGISTRY, 'holdOnlyPoints');

export const SYMMETRY: Glossary = glossary(FXI_REGISTRY, 'symmetry');
export const SYMMETRY_SCOPES: Glossary = glossary(FXI_REGISTRY, 'symmetryScopes');

export const HAND_ORIENTATIONS: Glossary = glossary(FXI_REGISTRY, 'handOrientations');
export const GRIP_WIDTHS: Glossary = glossary(FXI_REGISTRY, 'gripWidths');
export const STANCES: Glossary = glossary(FXI_REGISTRY, 'stances');
export const GRIP_ELEMENTS: Glossary = { ...HAND_ORIENTATIONS, ...GRIP_WIDTHS, ...STANCES };

export const RANGES: Glossary = glossary(FXI_REGISTRY, 'ranges');
export const START_RANGES: readonly string[] = values(FXI_REGISTRY, 'ranges', (e) => e.start === true);
/** Range codes that refine a parent code. A parent covers its children in compare. */
export const RANGE_PARENT: Readonly<Record<string, string>> =
  Object.fromEntries(entries(FXI_REGISTRY, 'ranges').filter((e) => typeof e.parent === 'string').map((e) => [e.value, e.parent as string]));

export const HELD: Glossary = glossary(FXI_REGISTRY, 'heldPostures');
/** Held codes that describe incompatible postures and never appear together. */
export const HELD_CONFLICTS = pairs(FXI_REGISTRY, 'heldPostures', 'conflictsWith');

export const LINES: Glossary = glossary(FXI_REGISTRY, 'lines');
/** Lines of pull that contradict each other. */
export const LINE_CONFLICTS = pairs(FXI_REGISTRY, 'lines', 'conflictsWith');

/** Accessories (`a`, extended): help the exercise without loading the working muscles. */
export const ACCESSORIES: Glossary = glossary(FXI_REGISTRY, 'accessories');

/** The published default of each defaulted FXI value: never written, and equal to the layer left out. */
export const DEFAULTS = {
  movingEnd: defaultOf(FXI_REGISTRY, 'movingEnds'),
  footwork: defaultOf(FXI_REGISTRY, 'footwork'),
  symmetry: defaultOf(FXI_REGISTRY, 'symmetry'),
  width: defaultOf(FXI_REGISTRY, 'gripWidths'),
  stance: defaultOf(FXI_REGISTRY, 'stances'),
  held: defaultOf(FXI_REGISTRY, 'heldPostures'),
  line: defaultOf(FXI_REGISTRY, 'lines'),
  accessory: defaultOf(FXI_REGISTRY, 'accessories'),
} as const;

// ───────────────────────────── FXE alphabet ─────────────────────────────

const CODE_KINDS = ['none', 'imp', 'sup', 'acc', 'stn', 'mac', 'erg'] as const;
export type FxeKind = (typeof CODE_KINDS)[number];

const kindEntries = entries(FXE_REGISTRY, 'kinds');
if (kindEntries.map((k) => k.value).join() !== CODE_KINDS.join()) {
  throw new Error(`The FXE registry lists kinds ${kindEntries.map((k) => k.value).join(', ')}; this encoder reads ${CODE_KINDS.join(', ')}.`);
}

export const FXE_KINDS: Glossary = glossary(FXE_REGISTRY, 'kinds');
export const FXE_STANDARD: Readonly<Record<FxeKind, readonly string[]>> =
  Object.fromEntries(kindEntries.map((k) => [k.value, list(k.standard)])) as Record<FxeKind, readonly string[]>;
export const FXE_EXTENDED: Readonly<Record<FxeKind, readonly string[]>> =
  Object.fromEntries(kindEntries.map((k) => [k.value, list(k.extended)])) as Record<FxeKind, readonly string[]>;
/** Order of extended FXE layers after the standard ones. */
export const FXE_EXTENDED_ORDER: readonly string[] = ['r', 'c', 'g', 'a'];

export interface FormAtom { readonly k: FxeKind; readonly r?: string; readonly c?: string; readonly parent?: string; readonly gloss: string }

/** Form atoms. `r` and `c` are the drive and constraint the atom implies; they are never written. */
export const FORMS: Readonly<Record<string, FormAtom>> = Object.fromEntries(entries(FXE_REGISTRY, 'forms').map((e) => {
  const implies = (e.implies ?? {}) as { r?: string; c?: string };
  return [e.value, {
    k: e.kind as FxeKind, gloss: e.description,
    ...(implies.r === undefined ? {} : { r: implies.r }),
    ...(implies.c === undefined ? {} : { c: implies.c }),
    ...(typeof e.parent === 'string' ? { parent: e.parent } : {}),
  }];
}));

export const LOAD_IFACES: Glossary = glossary(FXE_REGISTRY, 'loadInterfaces');
export const POSTURES: Glossary = glossary(FXE_REGISTRY, 'postures');
export const MAC_DIRECTIONS: Glossary = glossary(FXE_REGISTRY, 'guidedMotionDirections');
export const MAC_VERBS: readonly string[] = values(FXE_REGISTRY, 'guidedMotionVerbs');
export const MAC_SINGLE_JOINT: readonly string[] = values(FXE_REGISTRY, 'singleJointMotions');
export const ERG_CYCLES: Glossary = glossary(FXE_REGISTRY, 'cycles');
export const ERG_TRACKS: Glossary = glossary(FXE_REGISTRY, 'tracks');
export const DRIVES: Glossary = glossary(FXE_REGISTRY, 'drives');
export const MAC_CONSTRAINTS: Glossary = glossary(FXE_REGISTRY, 'constraints');
export const COMPLIANCE: Glossary = glossary(FXE_REGISTRY, 'compliance');
export const GUIDE_ANGLES: Glossary = glossary(FXE_REGISTRY, 'guideAngles');
export const DESIGN_ATTRS: Glossary = glossary(FXE_REGISTRY, 'designAttributes');

export interface ErgType {
  readonly label: string;
  readonly c: string;
  readonly l: string;
  readonly s: string;
  readonly m: string;
  /** FXI hold point of `erg`: the feet when the feet drive, else the hands. */
  readonly hold: string;
}

/** Cardio machine types and the standard `erg` layers each one writes. */
export const ERG_TYPES: Readonly<Record<string, ErgType>> = Object.fromEntries(entries(FXE_REGISTRY, 'cardioMachineTypes').map((e) => [
  e.value, { label: e.description, c: String(e.c), l: String(e.l), s: String(e.s), m: String(e.m), hold: String(e.hold) },
]));

// ───────────────────────────── FXI equipment tokens ─────────────────────────────

export interface EquipmentToken {
  readonly fxe: string;
  /** The token may appear in `l`. */
  readonly load: boolean;
  /** The token may appear in `s`. */
  readonly support: boolean;
  readonly gloss: string;
  /** A child token refines its parent; the parent covers it in compare. */
  readonly parent?: string;
}

/** FXI equipment tokens. Each is an alias of one standard FXE. */
export const EQUIPMENT_TOKENS: Readonly<Record<string, EquipmentToken>> = Object.fromEntries(entries(FXI_REGISTRY, 'equipmentTokens').map((e) => [
  e.value, {
    fxe: String(e.fxe), load: e.load === true, support: e.support === true, gloss: e.description,
    ...(typeof e.parent === 'string' ? { parent: e.parent } : {}),
  },
]));

/** FXI hold or support point → the FXE load interface it corresponds to, for cross-checks. */
export const POINT_TO_IFACE: Readonly<Record<string, string>> =
  Object.fromEntries(entries(FXE_REGISTRY, 'loadInterfaces').flatMap((e) => list(e.holdPoints).map((p) => [p, e.value])));

/** FXE posture → FXI start orientations it is consistent with, for cross-checks. */
export const POSTURE_TO_ORIENT: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(entries(FXE_REGISTRY, 'postures').map((e) => [e.value, list(e.orientations)]));

// ───────────────────────────── FXM ─────────────────────────────

/** FXM major version. FDS publishes no muscle list: a provider's vocabulary is an input. */
export const FXM_MAJOR = 1;
/** Syntax revision written in the header (`FXM=1.0/`). FXM has no extended layers, so it carries no S/N flag. */
export const FXM_REV = 0;
