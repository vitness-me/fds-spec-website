// The prime movers of each joint action of the exercise key, as muscle keys. They are the members of the action
// categories of the muscle category key (`FXMG=1.0/a:<joint>.<action>`).
import { FXM_MAJOR, FXM_REV } from './alphabet';

const keys = (...bodies: string[]): readonly string[] => bodies.map((body) => `FXM=${FXM_MAJOR}.${FXM_REV}/${body}`);

const SCAPULAR_RETRACTORS = ['trapezius.transverse', 'rhomboid-major', 'rhomboid-minor'];
const OBLIQUES = ['external-oblique', 'internal-oblique'];
const ERECTOR_SPINAE = ['iliocostalis', 'longissimus', 'spinalis'];
const HAMSTRINGS = ['biceps-femoris', 'semitendinosus', 'semimembranosus'];
const QUADRICEPS = ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'];

/**
 * Every joint action of the exercise key to its prime movers. An action whose prime movers have no muscle key has an
 * empty list and no action category: ankle eversion, whose prime movers are fibularis longus and fibularis brevis.
 * `<joint>.circ` and `<joint>.?` name no single action and have no entry.
 */
export const ACTION_PRIME_MOVERS: Readonly<Record<string, readonly string[]>> = {
  'nk.flex': keys('sternocleidomastoid'),
  'nk.ext': keys('splenius-capitis', 'semispinalis-capitis'),
  'nk.lflex': keys('sternocleidomastoid', 'splenius-capitis'),
  'nk.rot': keys('sternocleidomastoid', 'splenius-capitis'),
  'sp.flex': keys('rectus-abdominis'),
  'sp.ext': keys(...ERECTOR_SPINAE),
  'sp.lflex': keys(...OBLIQUES, 'quadratus-lumborum'),
  'sp.rot': keys(...OBLIQUES),
  'sc.elev': keys('trapezius.descending'),
  'sc.dep': keys('trapezius.ascending'),
  'sc.pro': keys('serratus-anterior'),
  'sc.ret': keys(...SCAPULAR_RETRACTORS),
  'sh.flex': keys('deltoid.clavicular'),
  'sh.ext': keys('latissimus-dorsi'),
  'sh.ext.oh': keys('latissimus-dorsi'),
  'sh.abd': keys('deltoid.acromial'),
  'sh.add': keys('latissimus-dorsi'),
  'sh.hadd': keys('pectoralis-major.sternocostal'),
  'sh.habd': keys('deltoid.spinal'),
  'sh.ir': keys('subscapularis', 'teres-major'),
  'sh.er': keys('infraspinatus', 'teres-minor'),
  'el.flex': keys('biceps-brachii', 'brachialis'),
  'el.ext': keys('triceps-brachii'),
  'fa.pron': keys('pronator-teres', 'pronator-quadratus'),
  'fa.sup': keys('biceps-brachii'),
  'wr.flex': keys('flexor-carpi-radialis', 'flexor-carpi-ulnaris', 'palmaris-longus'),
  'wr.ext': keys('extensor-carpi-radialis-longus', 'extensor-carpi-radialis-brevis', 'extensor-carpi-ulnaris'),
  'wr.rdev': keys('flexor-carpi-radialis', 'extensor-carpi-radialis-longus', 'extensor-carpi-radialis-brevis'),
  'wr.udev': keys('flexor-carpi-ulnaris', 'extensor-carpi-ulnaris'),
  'hip.flex': keys('psoas-major', 'iliacus', 'rectus-femoris'),
  'hip.ext': keys('gluteus-maximus', ...HAMSTRINGS),
  'hip.abd': keys('gluteus-medius', 'gluteus-minimus'),
  'hip.add': keys('adductor-longus', 'adductor-brevis', 'adductor-magnus', 'gracilis', 'pectineus'),
  'hip.ir': keys('gluteus-minimus', 'tensor-fasciae-latae'),
  'hip.er': keys('gluteus-maximus'),
  'kn.flex': keys(...HAMSTRINGS),
  'kn.ext': keys(...QUADRICEPS),
  'ank.df': keys('tibialis-anterior'),
  'ank.pf': keys('gastrocnemius', 'soleus'),
  'ank.inv': keys('tibialis-anterior'),
  'ank.ev': [],
};
