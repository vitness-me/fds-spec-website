export interface PlatformData {
  id: string;
  name: string;
  description: string;
  format: object;
  fullSchema?: object;
}

export const platformData: PlatformData[] = [
  {
    id: 'fitapp-pro',
    name: 'FitApp Pro',
    description: 'snake_case, flat structure',
    format: {
      exercise_id: 'ex_12847',
      exercise_name: 'back_squat',
      muscle_groups: 'quads,glutes,hamstrings',
      equipment_list: 'barbell,rack',
      difficulty: 3,
      is_compound: true,
      created_date: '09/02/2025'
    },
    fullSchema: {
      exercise_id: 'ex_12847',
      exercise_name: 'back_squat',
      display_name: 'Back Squat',
      muscle_groups: 'quads,glutes,hamstrings',
      primary_muscle: 'quads',
      equipment_list: 'barbell,rack',
      optional_equipment: 'belt,knee_sleeves',
      difficulty: 3,
      is_compound: true,
      movement_type: 'lower',
      created_date: '09/02/2025',
      modified_date: '09/02/2025',
      video_url: 'https://fitapp.io/v/back-squat.mp4',
      instructions: 'Stand with feet shoulder-width apart...'
    }
  },
  {
    id: 'gymtracker',
    name: 'GymTracker',
    description: 'camelCase, nested objects',
    format: {
      id: 984521,
      exerciseName: 'Back Squat',
      muscles: {
        primaryIds: [101, 102],
        secondaryIds: [201, 202, 203]
      },
      equipment: {
        requiredIds: [1, 5],
        optionalIds: [12]
      },
      meta: {
        createdAt: 1725289200,
        updatedAt: 1725289200
      }
    },
    fullSchema: {
      id: 984521,
      exerciseName: 'Back Squat',
      slug: 'back-squat',
      muscles: {
        primaryIds: [101, 102],
        primaryNames: ['Quadriceps', 'Gluteus Maximus'],
        secondaryIds: [201, 202, 203],
        secondaryNames: ['Hamstrings', 'Erector Spinae', 'Core']
      },
      equipment: {
        requiredIds: [1, 5],
        requiredNames: ['Barbell', 'Squat Rack'],
        optionalIds: [12],
        optionalNames: ['Lifting Belt']
      },
      category: { id: 3, name: 'Legs' },
      difficulty: { level: 2, label: 'Intermediate' },
      meta: {
        createdAt: 1725289200,
        updatedAt: 1725289200,
        version: 4
      }
    }
  },
  {
    id: 'workoutdb',
    name: 'WorkoutDB',
    description: 'XML-like verbose structure',
    format: {
      Exercise_Record: {
        _id: 'WDB-EX-00847',
        _type: 'strength',
        Name_Text: 'Back Squat',
        Muscle_Target_Primary: {
          _ref: 'MUS-004',
          _text: 'Quadriceps'
        },
        Equipment_Required: {
          Item_List: [
            { _ref: 'EQ-001', _text: 'Barbell' },
            { _ref: 'EQ-015', _text: 'Power Rack' }
          ]
        }
      }
    },
    fullSchema: {
      Exercise_Record: {
        _id: 'WDB-EX-00847',
        _type: 'strength',
        _status: 'active',
        Name_Text: 'Back Squat',
        Description_Text: 'Compound lower body exercise',
        Muscle_Target_Primary: {
          _ref: 'MUS-004',
          _text: 'Quadriceps'
        },
        Muscle_Target_Secondary_List: [
          { _ref: 'MUS-007', _text: 'Hamstrings' },
          { _ref: 'MUS-012', _text: 'Glutes' }
        ],
        Equipment_Required: {
          Item_List: [
            { _ref: 'EQ-001', _text: 'Barbell' },
            { _ref: 'EQ-015', _text: 'Power Rack' }
          ]
        },
        Equipment_Optional: {
          Item_List: [
            { _ref: 'EQ-022', _text: 'Lifting Belt' }
          ]
        },
        Metadata_Block: {
          Created_Timestamp: '2025-09-02T15:00:00.000Z',
          Modified_Timestamp: '2025-09-02T15:00:00.000Z',
          Author_Ref: 'USR-ADMIN-001'
        }
      }
    }
  },
  {
    id: 'ironlog',
    name: 'IronLog',
    description: 'Minimal, abbreviated codes',
    format: {
      eid: 'BS001',
      nm: 'BkSqt',
      tp: 'STR',
      mp: ['QD', 'GL'],
      ms: ['HM', 'ES'],
      eq: ['BB', 'RK'],
      df: 'INT',
      ts: '20250902'
    },
    fullSchema: {
      eid: 'BS001',
      nm: 'BkSqt',
      fn: 'Back Squat',
      tp: 'STR',
      mp: ['QD', 'GL'],
      ms: ['HM', 'ES', 'CR'],
      eq: ['BB', 'RK'],
      oeq: ['BT'],
      df: 'INT',
      mv: 'CMP',
      kc: 'CLS',
      ts: '20250902',
      v: 1
    }
  }
];

export const fdsFormat = {
  schemaVersion: '1.0.0',
  exerciseId: '550e8400-e29b-41d4-a716-446655440000',
  canonical: {
    name: 'Back Squat',
    slug: 'back-squat',
    description: 'A compound lower body exercise...'
  },
  classification: {
    exerciseType: 'strength',
    movement: 'squat',
    mechanics: 'compound',
    level: 'intermediate'
  },
  targets: {
    primary: [
      { id: 'mus.quadriceps', name: 'Quadriceps' }
    ],
    secondary: [
      { id: 'mus.hamstrings', name: 'Hamstrings' },
      { id: 'mus.erectorSpinae', name: 'Erector Spinae' }
    ]
  },
  equipment: {
    required: [
      { id: 'eq.barbell', name: 'Barbell' },
      { id: 'eq.rack', name: 'Power Rack' }
    ]
  },
  metadata: {
    createdAt: '2025-09-02T15:00:00Z',
    updatedAt: '2025-09-02T15:00:00Z',
    status: 'active'
  }
};

export const fdsFullSchema = {
  schemaVersion: '1.0.0',
  exerciseId: '550e8400-e29b-41d4-a716-446655440000',
  canonical: {
    name: 'Back Squat',
    slug: 'back-squat',
    description: 'A compound lower body exercise that primarily targets the quadriceps, hamstrings, and glutes while engaging core stability',
    aliases: ['Barbell Back Squat', 'BB Back Squat'],
    localized: [
      { lang: 'es', name: 'Sentadilla trasera' }
    ]
  },
  classification: {
    exerciseType: 'strength',
    movement: 'squat',
    mechanics: 'compound',
    force: 'push',
    level: 'intermediate',
    unilateral: false,
    kineticChain: 'closed',
    tags: ['bilateral', 'hipDominant']
  },
  targets: {
    primary: [
      { id: 'mus.quadriceps', name: 'Quadriceps', categoryId: 'cat.legs' }
    ],
    secondary: [
      { id: 'mus.hamstrings', name: 'Hamstrings', categoryId: 'cat.legs' },
      { id: 'mus.erectorSpinae', name: 'Erector Spinae', categoryId: 'cat.back' }
    ]
  },
  equipment: {
    required: [
      { id: 'eq.barbell', name: 'Barbell' },
      { id: 'eq.rack', name: 'Power Rack' }
    ],
    optional: [
      { id: 'eq.belt', name: 'Lifting Belt' }
    ]
  },
  constraints: {
    contraindications: ['Acute knee injury without professional clearance'],
    prerequisites: ['Bodyweight squat competency'],
    progressions: ['High-bar back squat', 'Paused back squat'],
    regressions: ['Goblet squat', 'Box squat']
  },
  metrics: {
    primary: { type: 'reps', unit: 'count' },
    secondary: [
      { type: 'weight', unit: 'lb' },
      { type: 'tempo', unit: 'count' }
    ]
  },
  metadata: {
    createdAt: '2025-09-02T15:00:00Z',
    updatedAt: '2025-09-02T15:00:00Z',
    status: 'active',
    source: 'vitness.core',
    version: '1.0.0'
  }
};
