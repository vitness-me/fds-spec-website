// The muscles and parts a muscle key (FXM) may name. The published registry is generated from this file.

/** An identifier for the same structure in an open anatomy ontology. */
export interface Anchor {
  /** FMA (Foundational Model of Anatomy 5.1.0) or UBERON. */
  readonly system: 'FMA' | 'UBERON';
  /** The ontology's CURIE: `FMA:34678`, `UBERON:0001476`. */
  readonly id: string;
  /** The term's label as the ontology writes it. */
  readonly label: string;
}

/** A part or head of a muscle that trains differently from the rest of it. */
export interface FxmPart {
  readonly token: string;
  readonly name: string;
  readonly anchors: readonly Anchor[];
  /** Why the part has no Uberon anchor, and what Uberon has instead. */
  readonly uberonNote?: string;
}

/** An anatomical muscle. When it has parts, the whole muscle is exactly the union of its parts. */
export interface FxmMuscle {
  readonly token: string;
  readonly name: string;
  readonly anchors: readonly Anchor[];
  readonly uberonNote?: string;
  readonly parts?: readonly FxmPart[];
}

/** An FMA anchor. */
export const fma = (id: string, label: string): Anchor => ({ system: 'FMA', id: `FMA:${id}`, label });
/** An UBERON anchor. */
export const uberon = (id: string, label: string): Anchor => ({ system: 'UBERON', id: `UBERON:${id}`, label });
const wholeOnly = (what: string, id: string): string => `Uberon names the whole ${what} (UBERON:${id}), not its parts.`;
const headsOnly = (what: string, id: string): string => `Uberon names the whole ${what} (UBERON:${id}), not its heads.`;
/** The note for a structure Uberon has no term for. */
export const noTerm = (what: string): string => `Uberon has no term for the ${what}.`;
const RHOMBOID_NOTE = 'Uberon has one term, rhomboid (UBERON:0005621), for both rhomboid muscles.';

/**
 * The anatomical muscles FXM names. Each anchor is the FMA 5.1.0 or UBERON term the EBI Ontology Lookup
 * Service returns for that structure. Parts exist only where they train differently: the deltoid,
 * pectoralis major and trapezius parts, and the heads of biceps brachii, triceps brachii and gastrocnemius.
 *
 * Token rules: a muscle token is the FMA name, lowercased and hyphenated, without the word "muscle"; a part
 * token is the qualifier FMA gives the part or head.
 */
export const FXM_MUSCLES: readonly FxmMuscle[] = [
  {
    token: 'deltoid', name: 'Deltoid', anchors: [fma('32521', 'Deltoid'), uberon('0001476', 'deltoid')],
    parts: [
      { token: 'clavicular', name: 'Clavicular part of deltoid', anchors: [fma('34677', 'Clavicular part of deltoid')], uberonNote: wholeOnly('deltoid', '0001476') },
      { token: 'acromial', name: 'Acromial part of deltoid', anchors: [fma('34678', 'Acromial part of deltoid')], uberonNote: wholeOnly('deltoid', '0001476') },
      { token: 'spinal', name: 'Spinal part of deltoid', anchors: [fma('34679', 'Spinal part of deltoid')], uberonNote: wholeOnly('deltoid', '0001476') },
    ],
  },
  {
    token: 'pectoralis-major', name: 'Pectoralis major', anchors: [fma('9627', 'Pectoralis major'), uberon('0002381', 'pectoralis major')],
    parts: [
      { token: 'clavicular', name: 'Clavicular part of pectoralis major', anchors: [fma('34687', 'Clavicular part of pectoralis major')], uberonNote: wholeOnly('pectoralis major', '0002381') },
      { token: 'sternocostal', name: 'Sternocostal part of pectoralis major', anchors: [fma('34696', 'Sternocostal part of pectoralis major')], uberonNote: wholeOnly('pectoralis major', '0002381') },
      { token: 'abdominal', name: 'Abdominal part of pectoralis major', anchors: [fma('34699', 'Abdominal part of pectoralis major')], uberonNote: wholeOnly('pectoralis major', '0002381') },
    ],
  },
  {
    token: 'trapezius', name: 'Trapezius', anchors: [fma('9626', 'Trapezius'), uberon('0002380', 'trapezius muscle')],
    parts: [
      { token: 'descending', name: 'Descending part of trapezius', anchors: [fma('32557', 'Descending part of trapezius')], uberonNote: wholeOnly('trapezius', '0002380') },
      { token: 'transverse', name: 'Transverse part of trapezius', anchors: [fma('32556', 'Transverse part of trapezius')], uberonNote: wholeOnly('trapezius', '0002380') },
      { token: 'ascending', name: 'Ascending part of trapezius', anchors: [fma('32555', 'Ascending part of trapezius')], uberonNote: wholeOnly('trapezius', '0002380') },
    ],
  },
  { token: 'latissimus-dorsi', name: 'Latissimus dorsi', anchors: [fma('13357', 'Latissimus dorsi'), uberon('0001112', 'latissimus dorsi muscle')] },
  { token: 'rhomboid-major', name: 'Rhomboid major', anchors: [fma('13379', 'Rhomboid major')], uberonNote: RHOMBOID_NOTE },
  { token: 'rhomboid-minor', name: 'Rhomboid minor', anchors: [fma('13380', 'Rhomboid minor')], uberonNote: RHOMBOID_NOTE },
  {
    token: 'biceps-brachii', name: 'Biceps brachii', anchors: [fma('37670', 'Biceps brachii'), uberon('0001507', 'biceps brachii')],
    parts: [
      { token: 'long', name: 'Long head of biceps brachii', anchors: [fma('37683', 'Long head of biceps brachii'), uberon('0007168', 'long head of biceps brachii')] },
      { token: 'short', name: 'Short head of biceps brachii', anchors: [fma('37682', 'Short head of biceps brachii'), uberon('0007169', 'short head of biceps brachii')] },
    ],
  },
  { token: 'brachialis', name: 'Brachialis', anchors: [fma('37667', 'Brachialis'), uberon('0001506', 'brachialis muscle')] },
  { token: 'brachioradialis', name: 'Brachioradialis', anchors: [fma('38485', 'Brachioradialis'), uberon('0011011', 'brachioradialis')] },
  {
    token: 'triceps-brachii', name: 'Triceps brachii', anchors: [fma('37688', 'Triceps brachii'), uberon('0001509', 'triceps brachii')],
    parts: [
      { token: 'long', name: 'Long head of triceps brachii', anchors: [fma('37692', 'Long head of triceps brachii')], uberonNote: headsOnly('triceps brachii', '0001509') },
      { token: 'lateral', name: 'Lateral head of triceps brachii', anchors: [fma('37694', 'Lateral head of triceps brachii')], uberonNote: headsOnly('triceps brachii', '0001509') },
      { token: 'medial', name: 'Medial head of triceps brachii', anchors: [fma('37693', 'Medial head of triceps brachii')], uberonNote: headsOnly('triceps brachii', '0001509') },
    ],
  },
  { token: 'rectus-abdominis', name: 'Rectus abdominis', anchors: [fma('9628', 'Rectus abdominis'), uberon('0002382', 'rectus abdominis muscle')] },
  { token: 'external-oblique', name: 'External oblique', anchors: [fma('13335', 'External oblique'), uberon('0005442', 'abdominal external oblique muscle')] },
  { token: 'internal-oblique', name: 'Internal oblique', anchors: [fma('13891', 'Internal oblique'), uberon('0005454', 'abdominal internal oblique muscle')] },
  { token: 'serratus-anterior', name: 'Serratus anterior', anchors: [fma('13397', 'Serratus anterior'), uberon('0001125', 'serratus ventralis')] },
  { token: 'iliocostalis', name: 'Iliocostalis', anchors: [fma('77177', 'Iliocostalis'), uberon('0002251', 'iliocostalis muscle')] },
  { token: 'longissimus', name: 'Longissimus', anchors: [fma('77178', 'Longissimus'), uberon('0000392', 'longissimus muscle')] },
  { token: 'spinalis', name: 'Spinalis', anchors: [fma('77179', 'Spinalis'), uberon('0011013', 'spinalis muscle')] },
  { token: 'quadratus-lumborum', name: 'Quadratus lumborum', anchors: [fma('15569', 'Quadratus lumborum'), uberon('0001220', 'quadratus lumborum')] },
  { token: 'gluteus-maximus', name: 'Gluteus maximus', anchors: [fma('22314', 'Gluteus maximus'), uberon('0001370', 'gluteus maximus')] },
  { token: 'gluteus-medius', name: 'Gluteus medius', anchors: [fma('22315', 'Gluteus medius'), uberon('0001371', 'gluteus medius')] },
  { token: 'gluteus-minimus', name: 'Gluteus minimus', anchors: [fma('22317', 'Gluteus minimus'), uberon('0008521', 'gluteus minimus')] },
  { token: 'tensor-fasciae-latae', name: 'Tensor fasciae latae', anchors: [fma('22423', 'Tensor fasciae latae'), uberon('0001376', 'tensor fasciae latae muscle')] },
  { token: 'biceps-femoris', name: 'Biceps femoris', anchors: [fma('22356', 'Biceps femoris'), uberon('0001374', 'biceps femoris')] },
  { token: 'semitendinosus', name: 'Semitendinosus', anchors: [fma('22357', 'Semitendinosus'), uberon('0001375', 'semitendinosus')] },
  { token: 'semimembranosus', name: 'Semimembranosus', anchors: [fma('22438', 'Semimembranosus'), uberon('0001381', 'semimembranosus muscle')] },
  { token: 'rectus-femoris', name: 'Rectus femoris', anchors: [fma('22430', 'Rectus femoris'), uberon('0001378', 'rectus femoris')] },
  { token: 'vastus-lateralis', name: 'Vastus lateralis', anchors: [fma('22431', 'Vastus lateralis'), uberon('0001379', 'vastus lateralis')] },
  { token: 'vastus-medialis', name: 'Vastus medialis', anchors: [fma('22432', 'Vastus medialis'), uberon('0001380', 'vastus medialis')] },
  { token: 'vastus-intermedius', name: 'Vastus intermedius', anchors: [fma('22433', 'Vastus intermedius'), uberon('0014847', 'vastus intermedius')] },
  { token: 'adductor-longus', name: 'Adductor longus', anchors: [fma('22441', 'Adductor longus'), uberon('0000303', 'adductor longus')] },
  { token: 'adductor-brevis', name: 'Adductor brevis', anchors: [fma('22442', 'Adductor brevis'), uberon('0000368', 'adductor brevis')] },
  { token: 'adductor-magnus', name: 'Adductor magnus', anchors: [fma('22443', 'Adductor magnus'), uberon('0000370', 'adductor magnus')] },
  { token: 'gracilis', name: 'Gracilis', anchors: [fma('43882', 'Gracilis'), uberon('0000950', 'gracilis')] },
  { token: 'pectineus', name: 'Pectineus', anchors: [fma('22440', 'Pectineus'), uberon('0001382', 'pectineus muscle')] },
  { token: 'psoas-major', name: 'Psoas major', anchors: [fma('18060', 'Psoas major'), uberon('0001298', 'psoas major muscle')] },
  { token: 'iliacus', name: 'Iliacus', anchors: [fma('22310', 'Iliacus'), uberon('0001369', 'iliacus muscle')] },
  { token: 'sartorius', name: 'Sartorius', anchors: [fma('22353', 'Sartorius'), uberon('0001373', 'sartorius muscle')] },
  {
    token: 'gastrocnemius', name: 'Gastrocnemius', anchors: [fma('22541', 'Gastrocnemius'), uberon('0001388', 'gastrocnemius')],
    parts: [
      { token: 'medial', name: 'Medial head of gastrocnemius', anchors: [fma('45956', 'Medial head of gastrocnemius'), uberon('0011907', 'gastrocnemius medialis')] },
      { token: 'lateral', name: 'Lateral head of gastrocnemius', anchors: [fma('45959', 'Lateral head of gastrocnemius'), uberon('0011908', 'gastrocnemius lateralis')] },
    ],
  },
  { token: 'soleus', name: 'Soleus', anchors: [fma('22542', 'Soleus'), uberon('0001389', 'soleus muscle')] },
  { token: 'tibialis-anterior', name: 'Tibialis anterior', anchors: [fma('22532', 'Tibialis anterior'), uberon('0001385', 'tibialis anterior')] },
  { token: 'sternocleidomastoid', name: 'Sternocleidomastoid', anchors: [fma('13407', 'Sternocleidomastoid'), uberon('0001128', 'sternocleidomastoid')] },
  { token: 'splenius-capitis', name: 'Splenius capitis', anchors: [fma('22653', 'Splenius capitis'), uberon('0000711', 'splenius capitis')] },
  { token: 'semispinalis-capitis', name: 'Semispinalis capitis', anchors: [fma('22830', 'Semispinalis capitis'), uberon('0001409', 'semispinalis capitis')] },
  { token: 'flexor-carpi-radialis', name: 'Flexor carpi radialis', anchors: [fma('38459', 'Flexor carpi radialis'), uberon('0001521', 'flexor carpi radialis muscle')] },
  { token: 'flexor-carpi-ulnaris', name: 'Flexor carpi ulnaris', anchors: [fma('38465', 'Flexor carpi ulnaris'), uberon('0001522', 'flexor carpi ulnaris muscle')] },
  { token: 'palmaris-longus', name: 'Palmaris longus', anchors: [fma('38462', 'Palmaris longus'), uberon('0016493', 'palmaris longus muscle')] },
  { token: 'extensor-carpi-radialis-longus', name: 'Extensor carpi radialis longus', anchors: [fma('38494', 'Extensor carpi radialis longus'), uberon('0001524', 'extensor carpi radialis longus muscle')] },
  { token: 'extensor-carpi-radialis-brevis', name: 'Extensor carpi radialis brevis', anchors: [fma('38497', 'Extensor carpi radialis brevis'), uberon('0001525', 'extensor carpi radialis brevis muscle')] },
  { token: 'extensor-carpi-ulnaris', name: 'Extensor carpi ulnaris', anchors: [fma('38506', 'Extensor carpi ulnaris'), uberon('0001526', 'extensor carpi ulnaris muscle')] },
  { token: 'transversus-abdominis', name: 'Transversus abdominis', anchors: [fma('15570', 'Transversus abdominis'), uberon('0001221', 'transversus abdominis muscle')] },
  { token: 'pyramidalis', name: 'Pyramidalis', anchors: [fma('15568', 'Pyramidalis'), uberon('0011016', 'pyramidalis')] },
  { token: 'pectoralis-minor', name: 'Pectoralis minor', anchors: [fma('13109', 'Pectoralis minor'), uberon('0001100', 'pectoralis minor')] },
  { token: 'subclavius', name: 'Subclavius', anchors: [fma('13410', 'Subclavius'), uberon('0008779', 'subclavius')] },
  { token: 'supraspinatus', name: 'Supraspinatus', anchors: [fma('9629', 'Supraspinatus'), uberon('0002383', 'supraspinatus muscle')] },
  { token: 'infraspinatus', name: 'Infraspinatus', anchors: [fma('32546', 'Infraspinatus'), uberon('0001477', 'infraspinatus muscle')] },
  { token: 'teres-minor', name: 'Teres minor', anchors: [fma('32550', 'Teres minor'), uberon('0010496', 'teres minor muscle')] },
  { token: 'teres-major', name: 'Teres major', anchors: [fma('32549', 'Teres major'), uberon('0001478', 'teres major muscle')] },
  { token: 'subscapularis', name: 'Subscapularis', anchors: [fma('13413', 'Subscapularis'), uberon('0001129', 'subscapularis muscle')] },
  { token: 'coracobrachialis', name: 'Coracobrachialis', anchors: [fma('37664', 'Coracobrachialis'), uberon('0001505', 'coracobrachialis muscle')] },
  { token: 'articularis-cubiti', name: 'Articularis cubiti', anchors: [fma('37701', 'Articularis cubiti')], uberonNote: noTerm('articularis cubiti') },
  { token: 'anconeus', name: 'Anconeus', anchors: [fma('37704', 'Anconeus'), uberon('0002989', 'anconeus muscle')] },
  { token: 'pronator-teres', name: 'Pronator teres', anchors: [fma('38450', 'Pronator teres'), uberon('0001520', 'pronator teres')] },
  { token: 'flexor-digitorum-superficialis', name: 'Flexor digitorum superficialis', anchors: [fma('38469', 'Flexor digitorum superficialis'), uberon('0003222', 'flexor digitorum superficialis')] },
  { token: 'pronator-quadratus', name: 'Pronator quadratus', anchors: [fma('38453', 'Pronator quadratus')], uberonNote: noTerm('pronator quadratus') },
  { token: 'flexor-digitorum-profundus', name: 'Flexor digitorum profundus', anchors: [fma('38478', 'Flexor digitorum profundus'), uberon('0001523', 'flexor digitorum profundus')] },
  { token: 'flexor-pollicis-longus', name: 'Flexor pollicis longus', anchors: [fma('38481', 'Flexor pollicis longus'), uberon('0008446', 'flexor pollicis longus muscle')] },
  { token: 'extensor-digitorum', name: 'Extensor digitorum', anchors: [fma('38500', 'Extensor digitorum'), uberon('0007612', 'extensor digitorum communis')] },
  { token: 'extensor-digiti-minimi', name: 'Extensor digiti minimi', anchors: [fma('38503', 'Extensor digiti minimi'), uberon('0007614', 'extensor digiti minimi muscle')] },
  { token: 'supinator', name: 'Supinator', anchors: [fma('38512', 'Supinator'), uberon('0003228', 'supinator muscle')] },
  { token: 'abductor-pollicis-longus', name: 'Abductor pollicis longus', anchors: [fma('38515', 'Abductor pollicis longus'), uberon('0001527', 'abductor pollicis longus')] },
  { token: 'extensor-pollicis-brevis', name: 'Extensor pollicis brevis', anchors: [fma('38518', 'Extensor pollicis brevis'), uberon('0017618', 'extensor pollicis brevis muscle')] },
  { token: 'extensor-pollicis-longus', name: 'Extensor pollicis longus', anchors: [fma('38521', 'Extensor pollicis longus'), uberon('0003234', 'extensor pollicis longus muscle')] },
  { token: 'extensor-indicis', name: 'Extensor indicis', anchors: [fma('38524', 'Extensor indicis')], uberonNote: noTerm('extensor indicis') },
  { token: 'adductor-minimus', name: 'Adductor minimus', anchors: [fma('43885', 'Adductor minimus')], uberonNote: noTerm('adductor minimus') },
  { token: 'articularis-genus', name: 'Articularis genus', anchors: [fma('22437', 'Articularis genus')], uberonNote: noTerm('articularis genus') },
  { token: 'extensor-hallucis-longus', name: 'Extensor hallucis longus', anchors: [fma('22533', 'Extensor hallucis longus')], uberonNote: noTerm('extensor hallucis longus') },
  { token: 'extensor-digitorum-longus', name: 'Extensor digitorum longus', anchors: [fma('22534', 'Extensor digitorum longus'), uberon('0001386', 'extensor digitorum longus')] },
  { token: 'fibularis-tertius', name: 'Fibularis tertius', anchors: [fma('22538', 'Fibularis tertius'), uberon('0010524', 'fibularis tertius')] },
  { token: 'plantaris', name: 'Plantaris', anchors: [fma('22543', 'Plantaris'), uberon('0011905', 'plantaris')] },
];
