// The types of cardio machine and the four standard layers each writes in its equipment key.

export interface ErgType {
  readonly label: string;
  readonly c: string;
  readonly l: string;
  readonly s: string;
  readonly m: string;
  /** The hold point of `erg` in an exercise key: the feet when the feet drive, else the hands. */
  readonly hold: string;
}

/** Cardio machine types, as the equipment key's track table lists them. */
export const ERG_TYPES: Readonly<Record<string, ErgType>> = {
  treadmill: { label: 'Treadmill', c: 'belt', l: 'feet', s: 'standing', m: 'gait', hold: 'feet' },
  stepmill: { label: 'Stepmill (revolving stairs)', c: 'belt', l: 'feet', s: 'standing', m: 'step', hold: 'feet' },
  stepper: { label: 'Stair stepper (pedals)', c: 'link', l: 'feet', s: 'standing', m: 'step', hold: 'feet' },
  stair: { label: 'Stair machine, stepper or stepmill not known', c: '?', l: 'feet', s: 'standing', m: 'step', hold: 'feet' },
  'bike-upright': { label: 'Upright or spin bike', c: 'loop', l: 'feet', s: 'seated', m: 'cycle', hold: 'feet' },
  'bike-recumbent': { label: 'Recumbent bike', c: 'loop', l: 'feet', s: 'supine.incline', m: 'cycle', hold: 'feet' },
  bike: { label: 'Stationary bike, upright or recumbent not known', c: 'loop', l: 'feet', s: '?', m: 'cycle', hold: 'feet' },
  'air-bike': { label: 'Air bike (moving arms)', c: 'loop', l: 'feet+hands', s: 'seated', m: 'cycle', hold: 'feet' },
  elliptical: { label: 'Elliptical', c: 'loop', l: 'feet+hands', s: 'standing', m: 'glide', hold: 'feet' },
  rower: { label: 'Rowing machine', c: 'rail', l: 'hands', s: 'seated', m: 'row', hold: 'hands' },
  ski: { label: 'Ski machine', c: 'cable', l: 'hands', s: 'standing', m: 'ski', hold: 'hands' },
  ube: { label: 'Arm crank, seated', c: 'loop', l: 'hands', s: 'seated', m: 'cycle', hold: 'hands' },
  'vertical-climber': { label: 'Vertical climber', c: 'line', l: 'feet+hands', s: 'standing', m: 'climb', hold: 'feet' },
  'ladder-climber': { label: 'Ladder climber', c: 'belt', l: 'feet+hands', s: 'standing', m: 'climb', hold: 'feet' },
};
