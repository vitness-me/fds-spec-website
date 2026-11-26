// The published code registries, generated from the package's code lists so the two cannot drift apart.
import {
  ACCESSORIES, ACTION_PARENT, BODY_POINTS, CIRC_JOINTS, COMPLIANCE, DESIGN_ATTRS, DRIVES, EQUIPMENT_TOKENS, ERG_CYCLES, ERG_TRACKS,
  FORMS, FOOTWORK, FXE_EXTENDED, FXE_KINDS, FXE_MAJOR, FXE_REV, FXE_STANDARD, FXI_LAYERS, FXI_LAYER_ORDER, FXI_MAJOR, FXI_REV, FXM_MAJOR,
  FXM_REV, FXMG_MAJOR, FXMG_REV, GRIP_WIDTHS, GUIDE_ANGLES, HAND_ORIENTATIONS, HELD, HELD_CONFLICTS, HOLD_ONLY, IMPLIED_POINTS,
  JOINT_ACTIONS, JOINTS, LINES, MAC_CONSTRAINTS, MAC_DIRECTIONS, MAC_SINGLE_JOINT, MAC_VERB_GLOSSES, MOVING_END, OPPOSITE_ACTIONS,
  ORIENTATIONS, PHASE_PREFIXES, RANGE_PARENT, RANGES, START_RANGES, STANCES, SYMMETRY, SYMMETRY_SCOPES,
} from './alphabet';
import type { FxeKind, Glossary } from './alphabet';
import { ERG_TYPES } from './builder/cardio';
import { FXM_MUSCLES } from './fxm-alphabet';
import { FXMG_ACTIONS, FXMG_SETS } from './fxmg-alphabet';
import { fxmgMembers } from './fxmg';

/** A registry document, ready to be written as JSON. */
export type Registry = Readonly<Record<string, unknown>>;

const governs = (source: string, pointer: string): { source: string; pointer: string } => ({ source, pointer });

const head = (registry: string, key: string, description: string, governed: readonly { source: string; pointer: string }[]): Record<string, unknown> => ({
  registry,
  version: '1.0.0',
  key,
  description,
  policy: 'closed',
  governs: governed,
});

/** Every code of a glossary as `{ value, description }`, with `default: true` on the code a key leaves out. */
const entries = (g: Glossary, dflt?: string): Record<string, unknown>[] =>
  Object.entries(g).map(([value, description]) => ({ value, description, ...(value === dflt ? { default: true } : {}) }));

const opposites = new Map<string, string>(OPPOSITE_ACTIONS.flatMap(([a, b]) => [[a, b], [b, a]] as const));

function exerciseKey(): Registry {
  return {
    ...head('exercise-key', `FXI=${FXI_MAJOR}.${FXI_REV}`,
      'The layers and codes of the exercise key, the structural key in an exercise\'s fxi field. Closed: a key that uses a code not listed here does not check. Body points are in body-points.registry.json and orientations in body-positions.registry.json; equipment codes are listed here and stand for keys of the equipment key.',
      [governs('specification/schema-sources/exercises/v1.2.0/exercise.schema.json', 'fxi')]),
    layers: FXI_LAYER_ORDER.map((letter) => ({
      letter, name: FXI_LAYERS[letter].name, standard: FXI_LAYERS[letter].std, required: ['m', 'o', 'l'].includes(letter), description: FXI_LAYERS[letter].gloss,
    })),
    motion: {
      joints: entries(JOINTS).map((e) => ({ ...e, circles: CIRC_JOINTS.includes(e.value as string) })),
      jointActions: Object.entries(JOINT_ACTIONS).map(([value, description]) => ({
        value, joint: value.split('.')[0], description,
        ...(ACTION_PARENT[value] === undefined ? {} : { parent: ACTION_PARENT[value] }),
        ...(opposites.has(value) ? { opposite: opposites.get(value) } : {}),
      })),
      prefixes: Object.entries(PHASE_PREFIXES).filter(([v]) => v !== '').map(([value, description]) => ({ value, description })),
    },
    movingEnd: entries(MOVING_END, 'limbs'),
    footwork: entries(FOOTWORK, 'level'),
    equipment: Object.entries(EQUIPMENT_TOKENS).map(([value, t]) => ({
      value, fxe: t.fxe, inLoad: t.load, inSupport: value !== 'none', ...(t.parent === undefined ? {} : { parent: t.parent }), description: t.gloss,
    })),
    holdPoints: entries(HOLD_ONLY),
    sides: entries(SYMMETRY, 'b'),
    sideScopes: entries(SYMMETRY_SCOPES),
    grip: [
      ...entries(HAND_ORIENTATIONS).map((e) => ({ ...e, group: 'hand' })),
      ...entries(GRIP_WIDTHS, 'w-m').map((e) => ({ ...e, group: 'width' })),
      ...entries(STANCES, 'st-m').map((e) => ({ ...e, group: 'stance' })),
    ],
    range: Object.entries(RANGES).map(([value, description]) => ({
      value, description, start: START_RANGES.includes(value), ...(RANGE_PARENT[value] === undefined ? {} : { parent: RANGE_PARENT[value] }),
    })),
    held: entries(HELD, 'none'),
    heldConflicts: HELD_CONFLICTS.map(([a, b]) => [a, b]),
    lineOfPull: entries(LINES, 'usual'),
    accessory: Object.entries(ACCESSORIES).map(([value, description]) => ({
      value, description, ...(FORMS[value] === undefined ? {} : { fxe: `FXE=${FXE_MAJOR}.${FXE_REV}S/k:acc/f:${value}` }), ...(value === 'none' ? { default: true } : {}),
    })),
  };
}

const KINDS = Object.keys(FXE_KINDS) as FxeKind[];
const FXE_LAYER_NAMES: Readonly<Record<string, string>> = {
  f: 'Form', l: 'Load interface', s: 'Posture', m: 'Motion', r: 'Drive', g: 'Guide angle', a: 'Design',
};

function equipmentKey(): Registry {
  const kindsWith = (letter: string, table: Readonly<Record<FxeKind, readonly string[]>>): FxeKind[] => KINDS.filter((k) => table[k].includes(letter));
  const layer = (letter: string, name: string, standard: boolean): Record<string, unknown> => ({
    letter, name, standard, kinds: kindsWith(letter, standard ? FXE_STANDARD : FXE_EXTENDED).filter((k) => standard || !FXE_STANDARD[k].includes(letter)),
  });
  return {
    ...head('equipment-key', `FXE=${FXE_MAJOR}.${FXE_REV}`,
      'The kinds, forms and layer codes of the equipment key, the structural key in an equipment record\'s fxe field. Closed: a key that uses a code not listed here does not check. Load interfaces are body points (body-points.registry.json) and postures are body positions (body-positions.registry.json).',
      [governs('specification/schema-sources/equipment/v1.2.0/equipment.schema.json', 'fxe')]),
    layers: [
      { letter: 'k', name: 'Kind', standard: true, kinds: KINDS },
      layer('f', FXE_LAYER_NAMES.f!, true),
      { letter: 'c', name: 'Track', standard: true, kinds: ['erg'] },
      layer('l', FXE_LAYER_NAMES.l!, true), layer('s', FXE_LAYER_NAMES.s!, true), layer('m', FXE_LAYER_NAMES.m!, true),
      layer('r', FXE_LAYER_NAMES.r!, false),
      { letter: 'c', name: 'Constraint or compliance', standard: false, kinds: KINDS.filter((k) => FXE_EXTENDED[k].includes('c') && !FXE_STANDARD[k].includes('c')) },
      layer('g', FXE_LAYER_NAMES.g!, false), layer('a', FXE_LAYER_NAMES.a!, false),
    ],
    kinds: KINDS.map((value) => ({
      value, description: FXE_KINDS[value], standardLayers: FXE_STANDARD[value], extendedLayers: FXE_EXTENDED[value],
    })),
    forms: Object.entries(FORMS).map(([value, f]) => ({
      value, kind: f.k, ...(f.parent === undefined ? {} : { parent: f.parent }),
      ...(f.r === undefined ? {} : { impliesDrive: f.r }), ...(f.c === undefined ? {} : { impliesConstraint: f.c }), description: f.gloss,
    })),
    tracks: entries(ERG_TRACKS),
    motion: {
      singleJoint: MAC_SINGLE_JOINT.map((value) => ({ value, description: JOINT_ACTIONS[value] })),
      verbs: entries(MAC_VERB_GLOSSES),
      directions: entries(MAC_DIRECTIONS),
      cardio: entries(ERG_CYCLES),
    },
    cardioMachines: Object.values(ERG_TYPES).map((e) => ({ name: e.label, c: e.c, l: e.l, s: e.s, m: e.m })),
    drives: entries(DRIVES),
    constraints: entries(MAC_CONSTRAINTS),
    compliance: entries(COMPLIANCE),
    guideAngles: entries(GUIDE_ANGLES),
    design: entries(DESIGN_ATTRS),
  };
}

function bodyPoints(): Registry {
  return {
    ...head('body-points', `FXI=${FXI_MAJOR}.${FXI_REV} FXE=${FXE_MAJOR}.${FXE_REV}`,
      'The body points both keys share: where an exercise key holds a load (after @ in l) and where the body bears weight on a support (after @ in s), and an equipment key\'s load interface (l).',
      [governs('specification/schema-sources/exercises/v1.2.0/exercise.schema.json', 'fxi'), governs('specification/schema-sources/equipment/v1.2.0/equipment.schema.json', 'fxe')]),
    entries: entries(BODY_POINTS),
  };
}

function bodyPositions(): Registry {
  return {
    ...head('body-positions', `FXI=${FXI_MAJOR}.${FXI_REV} FXE=${FXE_MAJOR}.${FXE_REV}`,
      'The body positions both keys share: an exercise key\'s orientation (o) and an equipment key\'s posture (s). impliedPoints are the body points the position bears weight on, which a support layer never writes.',
      [governs('specification/schema-sources/exercises/v1.2.0/exercise.schema.json', 'fxi'), governs('specification/schema-sources/equipment/v1.2.0/equipment.schema.json', 'fxe')]),
    entries: Object.entries(ORIENTATIONS).map(([value, description]) => ({ value, description, impliedPoints: IMPLIED_POINTS[value] ?? [] })),
  };
}

function muscleKey(): Registry {
  return {
    ...head('muscle-key', `FXM=${FXM_MAJOR}.${FXM_REV}`,
      'The muscle and part codes of the muscle key, each derived from its term in the Foundational Model of Anatomy (FMA 5.1.0) and anchored to its FMA id, with the UBERON id where UBERON has the structure. A muscle with parts is exactly the union of its parts.',
      [governs('specification/schema-sources/muscle/v1.1.0/muscle.schema.json', 'fxm')]),
    muscles: FXM_MUSCLES.map((m) => ({
      code: m.token, name: m.name, anchors: m.anchors, ...(m.uberonGap === undefined ? {} : { uberonGap: m.uberonGap }),
      ...(m.parts === undefined ? {} : {
        parts: m.parts.map((p) => ({ code: p.token, key: `FXM=${FXM_MAJOR}.${FXM_REV}/${m.token}.${p.token}`, name: p.name, anchors: p.anchors, ...(p.uberonGap === undefined ? {} : { uberonGap: p.uberonGap }) })),
      }),
    })),
  };
}

function muscleCategoryKey(): Registry {
  const prefix = `FXMG=${FXMG_MAJOR}.${FXMG_REV}/`;
  return {
    ...head('muscle-category-key', `FXMG=${FXMG_MAJOR}.${FXMG_REV}`,
      'The category codes of the muscle category key. A set or compartment is the FMA 5.1.0 set of that term, anchored to its FMA id and, where UBERON has it, its UBERON id; its members are the ones FMA asserts. An action category holds the prime movers of one joint action of the exercise key. muscles lists every category\'s members followed down to muscle keys.',
      [governs('specification/schema-sources/muscle/muscle-category/v1.1.0/muscle-category.schema.json', 'fxmg')]),
    categories: FXMG_SETS.map((c) => ({
      code: c.code, form: c.code.includes('.') ? 'compartment' : 'set', name: c.name, anchors: c.anchors,
      ...(c.uberonGap === undefined ? {} : { uberonGap: c.uberonGap }), ...(c.derivation === undefined ? {} : { derivation: c.derivation }),
      members: c.members, muscles: fxmgMembers(`${prefix}${c.code}`),
    })),
    actions: FXMG_ACTIONS.map((a) => ({
      code: `a:${a.action}`, action: a.action, name: a.name, ...(a.related === undefined ? {} : { related: a.related }),
      members: a.members.map((m) => m.key),
    })),
  };
}

/** Every code registry, by file name under `specification/registries/`. */
export function buildRegistries(): Readonly<Record<string, Registry>> {
  return {
    'exercise-key.registry.json': exerciseKey(),
    'equipment-key.registry.json': equipmentKey(),
    'body-points.registry.json': bodyPoints(),
    'body-positions.registry.json': bodyPositions(),
    'muscle-key.registry.json': muscleKey(),
    'muscle-category-key.registry.json': muscleCategoryKey(),
  };
}
