/**
 * The scenario coverage matrix — every training structure this batch of RFCs is
 * answerable for, and the example that answers it.
 *
 * The rows come from a planning document rather than from any schema, so they
 * are declared rather than derived. Adding a row without adding an example is
 * the failure `check:scenarios` exists to catch.
 *
 * They live here rather than inside that check because a second gate needs the
 * same list: `check:versions` asserts the counts documentation quotes, and "87
 * scenarios" is a count of these rows. Two copies of the matrix would be two
 * numbers to keep in step, which is the class of bug both gates exist to stop.
 *
 * One entity's examples, and the matrix sections they answer.
 *
 * `entity` is the directory under specification/schemas and, by default, the
 * filename prefix — `workout` covers specification/schemas/workout/v1.1.0 and
 * files named `workout.<row>.example.json`.
 *
 * The prescription fixtures are named for the *definition* they exemplify
 * rather than the entity, so that suite sets `prefixed: false` and its rows are
 * full basenames. It also opts out of the unmatched-example and README rules:
 * check:prescription already enforces both, against a different and stricter
 * standard, and running two checks over the same list means fixing a rename in
 * two places.
 */
export const SUITES = [
  {
    entity: 'workout',
    version: 'v1.1.0',
    sections: [
      [
        '§4.1 set and rep schemes',
        [
          'straight', 'ramping', 'reverse-pyramid', 'drop-sets', 'rest-pause',
          'cluster', 'myo-reps', 'amrap-reps', 'top-set-backoff', 'wave-loading',
          'ladders', 'density', 'technical-failure', 'tempo-reps', 'paused-reps',
          'partials', 'one-and-a-half-reps', 'isometric-holds', 'timed-sets',
        ],
      ],
      [
        '§4.4 cardio and endurance',
        [
          'duration', 'distance', 'pace', 'hr-zone', 'power-zone',
          'structured-intervals', 'fartlek', 'machine-settings',
          'negative-splits', 'progressive',
        ],
      ],
      [
        '§4.2 grouping structures',
        [
          'single', 'superset', 'triset', 'giant-set', 'compound-set',
          'antagonist-pairing', 'barbell-complex', 'circuit', 'emom',
          'amrap-block', 'for-time', 'chipper', 'tabata', 'ladder-circuit',
          'warmup-block', 'cooldown-block', 'finisher',
        ],
      ],
    ],
  },
  {
    entity: 'prescription',
    version: 'v1.0.0',
    prefixed: false,
    allowUnmatched: true,
    checkReadme: false,
    sections: [
      [
        '§4.3 load prescription',
        [
          'loadTarget.absolute', 'loadTarget.percent1RM', 'loadTarget.percent-bodyweight',
          'loadTarget.rpe', 'loadTarget.rir', 'loadTarget.velocity-with-loss-threshold',
          'loadTarget.machine-level', 'loadTarget.band-resistance', 'loadTarget.autoregulated',
          'loadTarget.relative-last-session', 'loadTarget.relative-e1rm',
          'loadTarget.relative-training-max', 'loadTarget.percent1RM-of-another-lift',
          'loadTarget.bodyweight', 'loadTarget.assisted',
        ],
      ],
      [
        '§4.5 rest',
        [
          'restSpec.fixed', 'restSpec.range', 'restSpec.to-heart-rate', 'restSpec.as-needed',
          'restSpec.work-to-rest-ratio',
          'restScope.set', 'restScope.group', 'restScope.round',
        ],
      ],
    ],
  },
  {
    entity: 'program',
    version: 'v1.0.0',
    sections: [
      [
        '§4.6 periodization models',
        [
          'linear', 'daily-undulating', 'weekly-undulating', 'block', 'conjugate',
          'percentage-waves', 'deload-weeks', 'double-progression', 'test-weeks',
          'conditional-branching', 'adaptive',
        ],
      ],
      [
        '§4.7 scheduling structures',
        [
          'fixed-weekday', 'relative-offsets', 'rolling', 'sequence',
          'optional-days', 'accessory-days', 'rest-days',
        ],
      ],
    ],
  },
];

/** How many rows the matrix has — in total, or for one entity. */
export function matrixRows(entity) {
  return SUITES.filter((suite) => !entity || suite.entity === entity).reduce(
    (total, suite) => total + suite.sections.reduce((n, [, rows]) => n + rows.length, 0),
    0
  );
}
