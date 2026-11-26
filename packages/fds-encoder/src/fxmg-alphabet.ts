// The muscle categories a muscle category key (FXMG) may name. The published registry is generated from this file.
// The anchor labels and ids, and the members of each FMA set, are quoted unchanged from the Foundational Model of
// Anatomy Ontology (FMA) 5.1.0, University of Washington, under CC BY 3.0 Unported, and from Uberon, release
// 2026-11-05, under CC BY 3.0.
import { JOINT_ACTIONS } from './alphabet';
import { fma, FXM_MUSCLES, noTerm, uberon } from './fxm-alphabet';
import { FXM_PREFIX, FXMG_PREFIX } from './headers';
import type { Anchor } from './fxm-alphabet';
import { ACTION_PRIME_MOVERS } from './movers';

export type { Anchor } from './fxm-alphabet';

/**
 * How a member belongs to its category: FMA's `member` or `regional_part`, UBERON's `part_of` where FMA names no
 * member, `whole-body` for the entire musculature, and `prime-mover` for an action's members.
 */
export type FxmgRelation = 'member' | 'regional_part' | 'part_of' | 'whole-body' | 'prime-mover';

/** One member of a category, traced to the term that makes it a member. */
export interface FxmgMember {
  /** An FXM key for a muscle, or an FXMG key for a set the category holds. */
  readonly key: string;
  readonly relation: FxmgRelation;
  /** The ontology term the composition names. Absent for an action's prime movers, which come from the joint-action table. */
  readonly source?: Anchor;
}

/**
 * A named set of muscles. The code is the FMA term rewritten by the muscle key's rule: "Set of", "Musculature of",
 * "muscle", "muscles" and "muscle group" dropped, and "<qualifier> (compartment) of <region>" written
 * `<region>.<qualifier>`.
 */
export interface FxmgSet {
  readonly code: string;
  /** The FMA term. */
  readonly name: string;
  /** The FMA term, then the UBERON term for the same structure when one exists. */
  readonly anchors: readonly Anchor[];
  /** Why the set has no Uberon anchor, and what Uberon has instead. */
  readonly uberonNote?: string;
  readonly members: readonly FxmgMember[];
  /** Where the members come from when FMA lists none. */
  readonly membersSource?: string;
}

/** The prime movers of one joint action, named by the exercise key's joint-action code. */
export interface FxmgAction {
  /** The joint-action code, written after `a:` in a key. */
  readonly action: string;
  readonly name: string;
  readonly members: readonly FxmgMember[];
  /** Ontology terms that cover part of the category. FMA and UBERON have no class for the movers of a joint action. */
  readonly related?: readonly Anchor[];
}

const fxm = (body: string): string => `${FXM_PREFIX}${body}`;
const fxmg = (body: string): string => `${FXMG_PREFIX}${body}`;
/** A member FMA asserts with `member`: its FXM token, the FMA id and label of the member term. */
const m = (token: string, id: string, label: string): FxmgMember => ({ key: fxm(token), relation: 'member', source: fma(id, label) });
/** A set FMA asserts with `member`, written as its FXMG code. */
const ms = (code: string, id: string, label: string): FxmgMember => ({ key: fxmg(code), relation: 'member', source: fma(id, label) });
/** A member FMA asserts with `regional_part`. */
const rp = (token: string, id: string, label: string): FxmgMember => ({ key: fxm(token), relation: 'regional_part', source: fma(id, label) });

const HAMSTRING_MEMBERS = [m('biceps-femoris', '22356', 'Biceps femoris'), m('semitendinosus', '22357', 'Semitendinosus'), m('semimembranosus', '22438', 'Semimembranosus')];
const ANTERIOR_ARM = [m('coracobrachialis', '37664', 'Coracobrachialis'), m('brachialis', '37667', 'Brachialis'), m('biceps-brachii', '37670', 'Biceps brachii')];
const POSTERIOR_ARM = [m('triceps-brachii', '37688', 'Triceps brachii'), m('articularis-cubiti', '37701', 'Articularis cubiti'), m('anconeus', '37704', 'Anconeus')];
const ROTATOR_CUFF = [
  m('subscapularis', '13413', 'Subscapularis'), m('infraspinatus', '32546', 'Infraspinatus'),
  m('teres-minor', '32550', 'Teres minor'), m('supraspinatus', '9629', 'Supraspinatus'),
];

/**
 * The FMA sets FXMG names, each with the members FMA 5.1.0 asserts for it through `member` or `regional_part`, as
 * the EBI Ontology Lookup Service returns them. A member FMA lists by side (Right external oblique) is traced to its
 * right-side term and keyed without the side. A member that is itself a set is written as that set's FXMG key.
 */
export const FXMG_SETS: readonly FxmgSet[] = [
  {
    code: 'hamstring', name: 'Set of hamstring muscles',
    anchors: [fma('81022', 'Set of hamstring muscles'), uberon('0002463', 'muscle of posterior compartment of hindlimb stylopod')],
    members: HAMSTRING_MEMBERS,
  },
  {
    code: 'quadriceps-femoris', name: 'Quadriceps femoris',
    anchors: [fma('22428', 'Quadriceps femoris'), uberon('0001377', 'quadriceps femoris')],
    members: [
      rp('rectus-femoris', '22430', 'Rectus femoris'), rp('vastus-lateralis', '22431', 'Vastus lateralis'),
      rp('vastus-medialis', '22432', 'Vastus medialis'), rp('vastus-intermedius', '22433', 'Vastus intermedius'),
    ],
  },
  {
    code: 'thigh', name: 'Musculature of thigh',
    anchors: [fma('50208', 'Musculature of thigh'), uberon('0004463', 'musculature of hindlimb stylopod')],
    members: [
      m('sartorius', '22353', 'Sartorius'), ...HAMSTRING_MEMBERS, ms('quadriceps-femoris', '22428', 'Quadriceps femoris'),
      m('articularis-genus', '22437', 'Articularis genus'), m('pectineus', '22440', 'Pectineus'), m('adductor-longus', '22441', 'Adductor longus'),
      m('adductor-brevis', '22442', 'Adductor brevis'), m('adductor-magnus', '22443', 'Adductor magnus'), m('gracilis', '43882', 'Gracilis'),
      m('adductor-minimus', '43885', 'Adductor minimus'),
    ],
  },
  {
    code: 'thigh.anterior', name: 'Musculature of anterior compartment of thigh',
    anchors: [fma('51035', 'Musculature of anterior compartment of thigh')], uberonNote: noTerm('anterior compartment of the thigh'),
    members: [m('sartorius', '22353', 'Sartorius'), ms('quadriceps-femoris', '22428', 'Quadriceps femoris'), m('articularis-genus', '22437', 'Articularis genus')],
  },
  {
    code: 'thigh.medial', name: 'Musculature of medial compartment of thigh',
    anchors: [fma('74149', 'Musculature of medial compartment of thigh')], uberonNote: noTerm('medial compartment of the thigh'),
    members: [
      m('pectineus', '22440', 'Pectineus'), m('adductor-longus', '22441', 'Adductor longus'), m('adductor-brevis', '22442', 'Adductor brevis'),
      m('adductor-magnus', '22443', 'Adductor magnus'), m('gracilis', '43882', 'Gracilis'), m('adductor-minimus', '43885', 'Adductor minimus'),
    ],
  },
  {
    code: 'thigh.posterior', name: 'Musculature of posterior compartment of thigh',
    anchors: [fma('51036', 'Musculature of posterior compartment of thigh')], uberonNote: noTerm('posterior compartment of the thigh'),
    members: HAMSTRING_MEMBERS,
  },
  {
    code: 'buttock', name: 'Musculature of buttock',
    anchors: [fma('50230', 'Musculature of buttock')], uberonNote: 'Uberon has no term for the musculature of the buttock; its gluteal muscle (UBERON:0002000) includes the deep hip rotators.',
    members: [m('gluteus-maximus', '22314', 'Gluteus maximus'), m('gluteus-medius', '22315', 'Gluteus medius'), m('gluteus-minimus', '22317', 'Gluteus minimus')],
  },
  {
    code: 'triceps-surae', name: 'Triceps surae',
    anchors: [fma('51062', 'Triceps surae'), uberon('0001665', 'triceps surae')],
    // FMA's third regional part, the calcaneal tendon (FMA:51061), is a tendon and has no FXM key.
    members: [rp('gastrocnemius', '22541', 'Gastrocnemius'), rp('soleus', '22542', 'Soleus')],
  },
  {
    code: 'leg.posterior.superficial', name: 'Set of superficial muscles of posterior compartment of leg',
    anchors: [fma('51065', 'Set of superficial muscles of posterior compartment of leg')], uberonNote: noTerm('superficial muscles of the posterior compartment of the leg'),
    members: [m('gastrocnemius', '22541', 'Gastrocnemius'), m('soleus', '22542', 'Soleus'), m('plantaris', '22543', 'Plantaris')],
  },
  {
    code: 'leg.anterior', name: 'Musculature of anterior compartment of leg',
    anchors: [fma('51052', 'Musculature of anterior compartment of leg')], uberonNote: noTerm('anterior compartment of the leg'),
    members: [
      m('tibialis-anterior', '22532', 'Tibialis anterior'), m('extensor-hallucis-longus', '22533', 'Extensor hallucis longus'),
      m('extensor-digitorum-longus', '22534', 'Extensor digitorum longus'), m('fibularis-tertius', '22538', 'Fibularis tertius'),
    ],
  },
  {
    code: 'erector-spinae', name: 'Erector spinae muscle group',
    anchors: [fma('71302', 'Erector spinae muscle group'), uberon('0002462', 'erector spinae muscle group')],
    membersSource: 'FMA lists no members for the erector spinae or its left and right sets (FMA:22731, FMA:22732). Its members are its three columns, the parts of erector spinae in Uberon (UBERON:0002462), each named by its FMA term.',
    members: [
      { key: fxm('iliocostalis'), relation: 'part_of', source: uberon('0002251', 'iliocostalis muscle') },
      { key: fxm('longissimus'), relation: 'part_of', source: uberon('0000392', 'longissimus muscle') },
      { key: fxm('spinalis'), relation: 'part_of', source: uberon('0011013', 'spinalis muscle') },
    ],
  },
  {
    code: 'anterior-abdominal-wall', name: 'Musculature of anterior abdominal wall',
    anchors: [fma('78435', 'Musculature of anterior abdominal wall')], uberonNote: 'Uberon has no term for this set; each of its muscles is an anterior abdominal wall muscle (UBERON:0002461).',
    members: [
      m('external-oblique', '13336', 'Right external oblique'), m('internal-oblique', '13892', 'Right internal oblique'),
      m('rectus-abdominis', '9628', 'Rectus abdominis'), m('transversus-abdominis', '15570', 'Transversus abdominis'), m('pyramidalis', '22346', 'Right pyramidalis'),
    ],
  },
  {
    code: 'pectoral', name: 'Pectoral musculature',
    anchors: [fma('50223', 'Pectoral musculature')], uberonNote: 'Uberon has no term for this set; each of its muscles is a pectoral muscle (UBERON:0001495).',
    members: [m('pectoralis-major', '9627', 'Pectoralis major'), m('pectoralis-minor', '13109', 'Pectoralis minor'), m('subclavius', '13410', 'Subclavius')],
  },
  {
    code: 'rotator-cuff', name: 'Set of rotator cuff muscles',
    anchors: [fma('82650', 'Set of rotator cuff muscles')],
    uberonNote: 'Uberon has no term for this set; its rotator cuff (UBERON:0003683) is the tendinous cuff (FMA:37018) the four tendons form.',
    members: ROTATOR_CUFF,
  },
  {
    code: 'shoulder.intrinsic', name: 'Set of intrinsic muscles of shoulder',
    anchors: [fma('33522', 'Set of intrinsic muscles of shoulder')], uberonNote: noTerm('intrinsic muscles of the shoulder'),
    members: [m('deltoid', '32521', 'Deltoid'), ...ROTATOR_CUFF, m('teres-major', '32549', 'Teres major')],
  },
  {
    code: 'arm', name: 'Musculature of arm',
    anchors: [fma('50202', 'Musculature of arm'), uberon('0014791', 'musculature of forelimb stylopod')],
    members: [...ANTERIOR_ARM, ...POSTERIOR_ARM],
  },
  {
    code: 'arm.anterior', name: 'Musculature of anterior compartment of arm',
    anchors: [fma('50193', 'Musculature of anterior compartment of arm')], uberonNote: noTerm('anterior compartment of the arm'),
    members: ANTERIOR_ARM,
  },
  {
    code: 'arm.posterior', name: 'Musculature of posterior compartment of arm',
    anchors: [fma('50194', 'Musculature of posterior compartment of arm')], uberonNote: noTerm('posterior compartment of the arm'),
    members: POSTERIOR_ARM,
  },
  {
    code: 'forearm', name: 'Musculature of forearm',
    anchors: [fma('39089', 'Musculature of forearm'), uberon('0004487', 'musculature of forelimb zeugopod')],
    members: [
      ms('forearm.anterior', '39098', 'Musculature of anterior compartment of forearm'),
      ms('forearm.posterior', '39101', 'Musculature of posterior compartment of forearm'),
    ],
  },
  {
    code: 'forearm.anterior', name: 'Musculature of anterior compartment of forearm',
    anchors: [fma('39098', 'Musculature of anterior compartment of forearm')], uberonNote: noTerm('anterior compartment of the forearm'),
    members: [
      ms('forearm.anterior.superficial', '39092', 'Set of superficial muscles of anterior compartment of forearm'),
      ms('forearm.anterior.deep', '39095', 'Set of deep muscles of anterior compartment of forearm'),
    ],
  },
  {
    code: 'forearm.anterior.superficial', name: 'Set of superficial muscles of anterior compartment of forearm',
    anchors: [fma('39092', 'Set of superficial muscles of anterior compartment of forearm')], uberonNote: noTerm('superficial muscles of the anterior compartment of the forearm'),
    members: [
      m('pronator-teres', '38450', 'Pronator teres'), m('flexor-carpi-radialis', '38459', 'Flexor carpi radialis'), m('palmaris-longus', '38462', 'Palmaris longus'),
      m('flexor-carpi-ulnaris', '38465', 'Flexor carpi ulnaris'), m('flexor-digitorum-superficialis', '38469', 'Flexor digitorum superficialis'),
    ],
  },
  {
    code: 'forearm.anterior.deep', name: 'Set of deep muscles of anterior compartment of forearm',
    anchors: [fma('39095', 'Set of deep muscles of anterior compartment of forearm')], uberonNote: noTerm('deep muscles of the anterior compartment of the forearm'),
    members: [
      m('pronator-quadratus', '38453', 'Pronator quadratus'), m('flexor-digitorum-profundus', '38478', 'Flexor digitorum profundus'),
      m('flexor-pollicis-longus', '38481', 'Flexor pollicis longus'),
    ],
  },
  {
    code: 'forearm.posterior', name: 'Musculature of posterior compartment of forearm',
    anchors: [fma('39101', 'Musculature of posterior compartment of forearm')], uberonNote: noTerm('posterior compartment of the forearm'),
    members: [
      ms('forearm.posterior.superficial', '39104', 'Set of superficial muscles of posterior compartment of forearm'),
      ms('forearm.posterior.deep', '39105', 'Set of deep muscles of posterior compartment of forearm'),
    ],
  },
  {
    code: 'forearm.posterior.superficial', name: 'Set of superficial muscles of posterior compartment of forearm',
    anchors: [fma('39104', 'Set of superficial muscles of posterior compartment of forearm')], uberonNote: noTerm('superficial muscles of the posterior compartment of the forearm'),
    members: [
      m('brachioradialis', '38485', 'Brachioradialis'), m('extensor-carpi-radialis-longus', '38494', 'Extensor carpi radialis longus'),
      m('extensor-carpi-radialis-brevis', '38497', 'Extensor carpi radialis brevis'), m('extensor-digitorum', '38500', 'Extensor digitorum'),
      m('extensor-digiti-minimi', '38503', 'Extensor digiti minimi'), m('extensor-carpi-ulnaris', '38506', 'Extensor carpi ulnaris'),
    ],
  },
  {
    code: 'forearm.posterior.deep', name: 'Set of deep muscles of posterior compartment of forearm',
    anchors: [fma('39105', 'Set of deep muscles of posterior compartment of forearm')], uberonNote: noTerm('deep muscles of the posterior compartment of the forearm'),
    members: [
      m('supinator', '38512', 'Supinator'), m('abductor-pollicis-longus', '38515', 'Abductor pollicis longus'),
      m('extensor-pollicis-brevis', '38518', 'Extensor pollicis brevis'), m('extensor-pollicis-longus', '38521', 'Extensor pollicis longus'),
      m('extensor-indicis', '38524', 'Extensor indicis'),
    ],
  },
  {
    code: 'entire', name: 'Entire musculature',
    anchors: [fma('72954', 'Entire musculature'), uberon('0000383', 'musculature of body')],
    membersSource: 'The entire musculature is every muscle of the body: its members are all the muscles the muscle key names.',
    members: FXM_MUSCLES.map((muscle) => ({ key: fxm(muscle.token), relation: 'whole-body', source: muscle.anchors.find((a) => a.system === 'FMA')! })),
  },
];

/** Ontology terms that cover part of an action's movers, by action. */
const ACTION_RELATED: Readonly<Record<string, readonly Anchor[]>> = {
  'hip.flex': [fma('64918', 'Iliopsoas'), uberon('0001999', 'iliopsoas')],
  'hip.add': [uberon('0011144', 'adductor muscle of hip')],
};

const actionName = (action: string): string => {
  const gloss = JOINT_ACTIONS[action] ?? action;
  const head = gloss.split(':')[0]!;
  return `Prime movers of ${head.charAt(0).toLowerCase()}${head.slice(1)}`;
};

/**
 * The action categories: one for every joint action of the exercise key with a keyed prime mover. Their members are
 * the action's prime movers (`ACTION_PRIME_MOVERS`), never the muscles that only assist it.
 */
export const FXMG_ACTIONS: readonly FxmgAction[] = Object.entries(ACTION_PRIME_MOVERS)
  .filter(([, prime]) => prime.length > 0)
  .map(([action, prime]) => ({
    action,
    name: actionName(action),
    members: prime.map((key): FxmgMember => ({ key, relation: 'prime-mover' })),
    ...(ACTION_RELATED[action] ? { related: ACTION_RELATED[action] } : {}),
  }));
