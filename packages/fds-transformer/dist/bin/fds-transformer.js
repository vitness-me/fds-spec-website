#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var init_esm_shims = __esm({
  "node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// src/schemas/bundled/v1.0.0/exercise.schema.json
var exercise_schema_default;
var init_exercise_schema = __esm({
  "src/schemas/bundled/v1.0.0/exercise.schema.json"() {
    exercise_schema_default = {
      $id: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "FDS Exercise (v1.0.0)",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "exerciseId",
        "canonical",
        "classification",
        "targets",
        "metrics",
        "metadata"
      ],
      properties: {
        schemaVersion: {
          type: "string",
          pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        exerciseId: {
          type: "string"
        },
        canonical: {
          type: "object",
          required: [
            "name",
            "slug"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              minLength: 1
            },
            slug: {
              type: "string",
              pattern: "^[a-z0-9-]{2,}$"
            },
            description: {
              type: "string",
              minLength: 1
            },
            aliases: {
              type: "array",
              items: {
                type: "string",
                minLength: 1
              },
              uniqueItems: true
            },
            localized: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "lang",
                  "name"
                ],
                additionalProperties: false,
                properties: {
                  lang: {
                    type: "string"
                  },
                  name: {
                    type: "string",
                    minLength: 1
                  },
                  description: {
                    type: "string",
                    minLength: 1
                  },
                  aliases: {
                    type: "array",
                    items: {
                      type: "string",
                      minLength: 1
                    },
                    uniqueItems: true
                  }
                }
              }
            }
          }
        },
        classification: {
          type: "object",
          required: [
            "exerciseType",
            "movement",
            "mechanics",
            "force",
            "level"
          ],
          additionalProperties: false,
          properties: {
            exerciseType: {
              type: "string"
            },
            movement: {
              $ref: "#/$defs/movement"
            },
            mechanics: {
              $ref: "#/$defs/mechanics"
            },
            force: {
              $ref: "#/$defs/force"
            },
            level: {
              $ref: "#/$defs/level"
            },
            unilateral: {
              type: "boolean",
              default: false
            },
            kineticChain: {
              $ref: "#/$defs/kineticChain"
            },
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            },
            taxonomyRefs: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "registry",
                  "id"
                ],
                additionalProperties: false,
                properties: {
                  registry: {
                    type: "string",
                    format: "uri-reference"
                  },
                  id: {
                    type: "string"
                  },
                  label: {
                    type: "string"
                  }
                }
              }
            }
          }
        },
        targets: {
          type: "object",
          required: [
            "primary"
          ],
          additionalProperties: false,
          properties: {
            primary: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/$defs/muscleRef"
              }
            },
            secondary: {
              type: "array",
              items: {
                $ref: "#/$defs/muscleRef"
              }
            }
          }
        },
        equipment: {
          type: "object",
          additionalProperties: false,
          properties: {
            required: {
              type: "array",
              items: {
                $ref: "#/$defs/equipmentRef"
              }
            },
            optional: {
              type: "array",
              items: {
                $ref: "#/$defs/equipmentRef"
              }
            }
          }
        },
        constraints: {
          type: "object",
          additionalProperties: false,
          properties: {
            contraindications: {
              type: "array",
              items: {
                type: "string"
              }
            },
            prerequisites: {
              type: "array",
              items: {
                type: "string"
              }
            },
            progressions: {
              type: "array",
              items: {
                type: "string"
              }
            },
            regressions: {
              type: "array",
              items: {
                type: "string"
              }
            },
            environment: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        relations: {
          type: "array",
          items: {
            type: "object",
            required: [
              "type",
              "targetId"
            ],
            additionalProperties: false,
            properties: {
              type: {
                $ref: "#/$defs/relationTypes"
              },
              targetId: {
                type: "string"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              notes: {
                type: "string"
              }
            }
          }
        },
        metrics: {
          type: "object",
          additionalProperties: false,
          required: [
            "primary"
          ],
          properties: {
            primary: {
              $ref: "#/$defs/metricRef"
            },
            secondary: {
              type: "array",
              items: {
                $ref: "#/$defs/metricRef"
              },
              uniqueItems: true
            }
          }
        },
        media: {
          $ref: "#/$defs/media"
        },
        attributes: {
          type: "object",
          additionalProperties: true
        },
        extensions: {
          type: "object",
          additionalProperties: true
        },
        metadata: {
          type: "object",
          required: [
            "createdAt",
            "updatedAt",
            "status"
          ],
          additionalProperties: false,
          properties: {
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            },
            source: {
              type: "string"
            },
            version: {
              type: "string"
            },
            status: {
              $ref: "#/$defs/status"
            },
            deprecated: {
              type: "object",
              additionalProperties: false,
              properties: {
                since: {
                  type: "string",
                  pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
                },
                replacedBy: {
                  type: "string"
                }
              }
            },
            externalRefs: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "system",
                  "id"
                ],
                additionalProperties: false,
                properties: {
                  system: {
                    type: "string"
                  },
                  id: {
                    type: "string"
                  }
                }
              }
            },
            history: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  at: {
                    type: "string",
                    format: "date-time"
                  },
                  actor: {
                    type: "string"
                  },
                  change: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      },
      $defs: {
        muscleRef: {
          type: "object",
          required: [
            "id",
            "name",
            "categoryId"
          ],
          additionalProperties: false,
          properties: {
            id: {
              type: "string"
            },
            slug: {
              type: "string"
            },
            name: {
              type: "string"
            },
            categoryId: {
              type: "string"
            },
            aliases: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        equipmentRef: {
          type: "object",
          required: [
            "id",
            "name"
          ],
          additionalProperties: false,
          properties: {
            id: {
              type: "string"
            },
            slug: {
              type: "string"
            },
            name: {
              type: "string"
            },
            abbreviation: {
              type: "string"
            },
            categories: {
              type: "array",
              items: {
                type: "string"
              }
            },
            aliases: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        metricRef: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "unit"
          ],
          properties: {
            type: {
              $ref: "#/$defs/metricType"
            },
            unit: {
              $ref: "#/$defs/metricUnit"
            }
          }
        },
        metricType: {
          type: "string",
          enum: [
            "reps",
            "weight",
            "duration",
            "distance",
            "speed",
            "pace",
            "power",
            "heartRate",
            "steps",
            "calories",
            "height",
            "tempo",
            "rpe"
          ]
        },
        metricUnit: {
          type: "string",
          enum: [
            "count",
            "kg",
            "lb",
            "s",
            "min",
            "m",
            "km",
            "mi",
            "m_s",
            "km_h",
            "min_per_km",
            "min_per_mi",
            "W",
            "bpm",
            "kcal",
            "cm",
            "in"
          ]
        },
        movement: {
          type: "string",
          enum: [
            "squat",
            "hinge",
            "lunge",
            "push-horizontal",
            "push-vertical",
            "pull-horizontal",
            "pull-vertical",
            "carry",
            "core-anti-extension",
            "core-anti-rotation",
            "rotation",
            "locomotion",
            "isolation",
            "other"
          ]
        },
        mechanics: {
          type: "string",
          enum: [
            "compound",
            "isolation"
          ]
        },
        force: {
          type: "string",
          enum: [
            "push",
            "pull",
            "static",
            "mixed"
          ]
        },
        level: {
          type: "string",
          enum: [
            "beginner",
            "intermediate",
            "advanced"
          ]
        },
        kineticChain: {
          type: "string",
          enum: [
            "open",
            "closed",
            "mixed"
          ],
          default: "mixed"
        },
        relationTypes: {
          type: "string",
          enum: [
            "alternate",
            "variation",
            "substitute",
            "progression",
            "regression",
            "equipmentVariant",
            "accessory",
            "mobilityPrep",
            "similarPattern",
            "unilateralPair",
            "contralateralPair"
          ]
        },
        media: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "uri"],
            additionalProperties: false,
            properties: {
              type: {
                type: "string",
                enum: [
                  "image",
                  "video",
                  "doc",
                  "3d"
                ]
              },
              uri: {
                type: "string",
                format: "uri"
              },
              caption: {
                type: "string"
              },
              license: {
                type: "string"
              },
              attribution: {
                type: "string"
              }
            }
          }
        },
        status: {
          type: "string",
          enum: [
            "draft",
            "review",
            "active",
            "inactive",
            "deprecated"
          ],
          default: "active"
        }
      }
    };
  }
});

// src/schemas/bundled/v1.0.0/equipment.schema.json
var equipment_schema_default;
var init_equipment_schema = __esm({
  "src/schemas/bundled/v1.0.0/equipment.schema.json"() {
    equipment_schema_default = {
      $id: "https://spec.vitness.me/schemas/equipment/v1.0.0/equipment.schema.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "FDS Equipment (v1.0.0)",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "id",
        "canonical",
        "metadata"
      ],
      properties: {
        schemaVersion: {
          type: "string",
          pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        id: {
          type: "string"
        },
        canonical: {
          type: "object",
          required: [
            "name",
            "slug"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              minLength: 1
            },
            slug: {
              type: "string",
              pattern: "^[a-z0-9-]{2,}$"
            },
            description: {
              type: "string",
              minLength: 1
            },
            abbreviation: {
              type: "string"
            },
            aliases: {
              type: "array",
              items: {
                type: "string",
                minLength: 1
              },
              uniqueItems: true
            },
            localized: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "lang",
                  "name"
                ],
                additionalProperties: false,
                properties: {
                  lang: {
                    type: "string"
                  },
                  name: {
                    type: "string",
                    minLength: 1
                  },
                  description: {
                    type: "string",
                    minLength: 1
                  },
                  aliases: {
                    type: "array",
                    items: {
                      type: "string",
                      minLength: 1
                    },
                    uniqueItems: true
                  }
                }
              }
            }
          }
        },
        classification: {
          type: "object",
          additionalProperties: false,
          properties: {
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        media: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/$defs/media"
        },
        attributes: {
          type: "object",
          additionalProperties: true
        },
        extensions: {
          type: "object",
          additionalProperties: true
        },
        metadata: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/properties/metadata"
        }
      }
    };
  }
});

// src/schemas/bundled/v1.0.0/muscle.schema.json
var muscle_schema_default;
var init_muscle_schema = __esm({
  "src/schemas/bundled/v1.0.0/muscle.schema.json"() {
    muscle_schema_default = {
      $id: "https://spec.vitness.me/schemas/muscle/v1.0.0/muscle.schema.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "FDS Muscle (v1.0.0)",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "id",
        "canonical",
        "classification",
        "metadata"
      ],
      properties: {
        schemaVersion: {
          type: "string",
          pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        id: {
          type: "string"
        },
        canonical: {
          type: "object",
          required: [
            "name",
            "slug"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              minLength: 1
            },
            slug: {
              type: "string",
              pattern: "^[a-z0-9-]{2,}$"
            },
            description: {
              type: "string",
              minLength: 1
            },
            aliases: {
              type: "array",
              items: {
                type: "string",
                minLength: 1
              },
              uniqueItems: true
            },
            localized: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "lang",
                  "name"
                ],
                additionalProperties: false,
                properties: {
                  lang: {
                    type: "string"
                  },
                  name: {
                    type: "string",
                    minLength: 1
                  },
                  description: {
                    type: "string",
                    minLength: 1
                  },
                  aliases: {
                    type: "array",
                    items: {
                      type: "string",
                      minLength: 1
                    },
                    uniqueItems: true
                  }
                }
              }
            }
          }
        },
        classification: {
          type: "object",
          required: [
            "categoryId",
            "region"
          ],
          additionalProperties: false,
          properties: {
            categoryId: {
              type: "string"
            },
            region: {
              $ref: "#/$defs/regionGroup"
            },
            laterality: {
              $ref: "#/$defs/laterality"
            },
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        media: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/$defs/media"
        },
        attributes: {
          type: "object",
          additionalProperties: true
        },
        extensions: {
          type: "object",
          additionalProperties: true
        },
        heatmap: {
          type: "object",
          required: ["atlasId", "regions"],
          additionalProperties: false,
          properties: {
            atlasId: { type: "string" },
            regions: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["areaId"],
                additionalProperties: false,
                properties: {
                  areaId: { type: "string" },
                  weight: { type: "number", minimum: 0, maximum: 1, default: 1 }
                }
              }
            }
          }
        },
        metadata: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/properties/metadata"
        }
      },
      $defs: {
        regionGroup: {
          type: "string",
          enum: [
            "upper-front",
            "upper-back",
            "lower-front",
            "lower-back",
            "core",
            "full-body",
            "n/a"
          ]
        },
        laterality: {
          type: "string",
          enum: [
            "left",
            "right",
            "bilateral",
            "unilateral",
            "n/a"
          ]
        }
      }
    };
  }
});

// src/schemas/bundled/v1.0.0/muscle-category.schema.json
var muscle_category_schema_default;
var init_muscle_category_schema = __esm({
  "src/schemas/bundled/v1.0.0/muscle-category.schema.json"() {
    muscle_category_schema_default = {
      $id: "https://spec.vitness.me/schemas/muscle/muscle-category/v1.0.0/muscle-category.schema.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "FDS Muscle Category (v1.0.0)",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "id",
        "canonical",
        "metadata"
      ],
      properties: {
        schemaVersion: {
          type: "string",
          pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        id: {
          type: "string"
        },
        canonical: {
          type: "object",
          required: [
            "name",
            "slug"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              minLength: 1
            },
            slug: {
              type: "string",
              pattern: "^[a-z0-9-]{2,}$"
            },
            description: {
              type: "string",
              minLength: 1
            },
            aliases: {
              type: "array",
              items: {
                type: "string",
                minLength: 1
              },
              uniqueItems: true
            },
            localized: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "lang",
                  "name"
                ],
                additionalProperties: false,
                properties: {
                  lang: {
                    type: "string"
                  },
                  name: {
                    type: "string",
                    minLength: 1
                  },
                  description: {
                    type: "string",
                    minLength: 1
                  },
                  aliases: {
                    type: "array",
                    items: {
                      type: "string",
                      minLength: 1
                    },
                    uniqueItems: true
                  }
                }
              }
            }
          }
        },
        classification: {
          type: "object",
          additionalProperties: true,
          properties: {
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        media: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/$defs/media"
        },
        attributes: {
          type: "object",
          additionalProperties: true
        },
        extensions: {
          type: "object",
          additionalProperties: true
        },
        metadata: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/properties/metadata"
        }
      }
    };
  }
});

// src/schemas/bundled/v1.0.0/body-atlas.schema.json
var body_atlas_schema_default;
var init_body_atlas_schema = __esm({
  "src/schemas/bundled/v1.0.0/body-atlas.schema.json"() {
    body_atlas_schema_default = {
      $id: "https://spec.vitness.me/schemas/atlas/v1.0.0/body-atlas.schema.json",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "FDS Body Atlas (v1.0.0)",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "id",
        "canonical",
        "views",
        "areas",
        "metadata"
      ],
      properties: {
        schemaVersion: { type: "string", pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
        id: { type: "string" },
        canonical: {
          type: "object",
          required: [
            "name",
            "slug"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              minLength: 1
            },
            slug: {
              type: "string",
              pattern: "^[a-z0-9-]{2,}$"
            },
            description: {
              type: "string",
              minLength: 1
            },
            aliases: {
              type: "array",
              items: {
                type: "string",
                minLength: 1
              },
              uniqueItems: true
            },
            localized: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "lang",
                  "name"
                ],
                additionalProperties: false,
                properties: {
                  lang: {
                    type: "string"
                  },
                  name: {
                    type: "string",
                    minLength: 1
                  },
                  description: {
                    type: "string",
                    minLength: 1
                  },
                  aliases: {
                    type: "array",
                    items: {
                      type: "string",
                      minLength: 1
                    },
                    uniqueItems: true
                  }
                }
              }
            }
          }
        },
        views: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "kind", "asset"],
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              kind: {
                type: "string",
                enum: [
                  "anterior",
                  "posterior",
                  "left-lateral",
                  "right-lateral",
                  "superior",
                  "inferior"
                ]
              },
              asset: {
                type: "object",
                required: ["type", "uri"],
                additionalProperties: false,
                properties: {
                  type: { type: "string", enum: ["svg", "image", "3d"] },
                  uri: { type: "string", format: "uri" }
                }
              }
            }
          }
        },
        areas: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "canonical", "bindings"],
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              canonical: {
                type: "object",
                required: ["name", "slug"],
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  slug: { type: "string", pattern: "^[a-z0-9-.]+$" }
                }
              },
              bindings: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["viewId", "selector"],
                  additionalProperties: false,
                  properties: {
                    viewId: { type: "string" },
                    selector: { type: "string" }
                  }
                }
              }
            }
          }
        },
        attributes: { type: "object", additionalProperties: true },
        extensions: { type: "object", additionalProperties: true },
        metadata: {
          $ref: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json#/properties/metadata"
        }
      }
    };
  }
});

// src/schemas/bundled/v1.0.0/index.ts
var v1_0_exports = {};
__export(v1_0_exports, {
  bodyAtlasSchema: () => body_atlas_schema_default,
  default: () => v1_0_default,
  equipmentSchema: () => equipment_schema_default,
  exerciseSchema: () => exercise_schema_default,
  muscleCategorySchema: () => muscle_category_schema_default,
  muscleSchema: () => muscle_schema_default
});
var v1_0_default;
var init_v1_0 = __esm({
  "src/schemas/bundled/v1.0.0/index.ts"() {
    "use strict";
    init_esm_shims();
    init_exercise_schema();
    init_equipment_schema();
    init_muscle_schema();
    init_muscle_category_schema();
    init_body_atlas_schema();
    v1_0_default = {
      exercise: exercise_schema_default,
      equipment: equipment_schema_default,
      muscle: muscle_schema_default,
      "muscle-category": muscle_category_schema_default,
      "body-atlas": body_atlas_schema_default
    };
  }
});

// src/bin/fds-transformer.ts
init_esm_shims();
import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";

// src/core/transformer.ts
init_esm_shims();

// src/core/mapping-engine.ts
init_esm_shims();

// src/transforms/transform-registry.ts
init_esm_shims();

// src/transforms/builtin/slugify.ts
init_esm_shims();
var WORD_REPLACEMENTS = {
  "3/4": "three-quarter",
  "1/4": "quarter",
  "1/2": "half",
  "&": "and",
  "+": "plus",
  "@": "at"
};
var slugify = (value, _options = {}) => {
  if (value === null || value === void 0) {
    return "";
  }
  let str = String(value);
  for (const [pattern, replacement] of Object.entries(WORD_REPLACEMENTS)) {
    str = str.replace(new RegExp(escapeRegex(pattern), "gi"), replacement);
  }
  str = str.toLowerCase();
  str = str.replace(/[\s_]+/g, "-");
  str = str.replace(/[^a-z0-9-]/g, "");
  str = str.replace(/-+/g, "-");
  str = str.replace(/^-+|-+$/g, "");
  if (str.length < 2) {
    str = str.padEnd(2, "0");
  }
  return str;
};
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/transforms/builtin/title-case.ts
init_esm_shims();
var LOWERCASE_WORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "so",
  "the",
  "to",
  "up",
  "yet",
  "with"
]);
var UPPERCASE_WORDS = /* @__PURE__ */ new Set([
  "db",
  "bb",
  "kb",
  "ez",
  "trx",
  "hiit",
  "amrap",
  "emom",
  "bw"
]);
var titleCase = (value, options = {}) => {
  if (value === null || value === void 0) {
    return "";
  }
  const str = String(value);
  const preserveAcronyms = options.preserveAcronyms !== false;
  const words = str.split(/(\s+|-)/);
  return words.map((word, index) => {
    if (/^\s+$/.test(word) || word === "-") {
      return word;
    }
    const lowerWord = word.toLowerCase();
    if (preserveAcronyms && UPPERCASE_WORDS.has(lowerWord)) {
      return word.toUpperCase();
    }
    if (index > 0 && LOWERCASE_WORDS.has(lowerWord)) {
      return lowerWord;
    }
    if (word === word.toUpperCase() && word.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join("");
};

// src/transforms/builtin/uuid.ts
init_esm_shims();
import { v4 as uuidv4 } from "uuid";
var uuid = () => {
  return uuidv4();
};

// src/transforms/builtin/to-array.ts
init_esm_shims();
var toArray = (value, options = {}) => {
  if (value === null || value === void 0) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && options.delimiter) {
    return value.split(String(options.delimiter)).map((s) => s.trim()).filter(Boolean);
  }
  return [value];
};
var toMediaArray = (value, options = {}) => {
  if (value === null || value === void 0) {
    return [];
  }
  const mediaType = String(options.type || "image");
  const urls = Array.isArray(value) ? value : [value];
  return urls.filter((url) => url !== null && url !== void 0 && url !== "").map((url) => {
    let uri = String(url);
    if (options.urlTransform && typeof options.urlTransform === "object") {
      const transform = options.urlTransform;
      if (transform.pattern && transform.replace) {
        uri = uri.replace(new RegExp(transform.pattern), transform.replace);
      }
    }
    if (options.baseUrl) {
      const filename = uri.split("/").pop() || uri;
      uri = `${String(options.baseUrl).replace(/\/$/, "")}/${filename}`;
    }
    const mediaItem = {
      type: mediaType,
      uri
    };
    if (options.caption) {
      mediaItem.caption = String(options.caption);
    }
    if (options.license) {
      mediaItem.license = String(options.license);
    }
    if (options.attribution) {
      mediaItem.attribution = String(options.attribution);
    }
    return mediaItem;
  });
};

// src/transforms/builtin/auto-generate.ts
init_esm_shims();
var timestamp = (value, options = {}) => {
  const format = String(options.format || "iso8601");
  const date = value ? new Date(String(value)) : /* @__PURE__ */ new Date();
  switch (format) {
    case "iso8601":
    case "iso":
      return date.toISOString();
    case "unix":
      return String(Math.floor(date.getTime() / 1e3));
    case "unixms":
      return String(date.getTime());
    case "date":
      return date.toISOString().split("T")[0];
    default:
      return date.toISOString();
  }
};
var autoGenerate = (_value, options = {}, context) => {
  const result = {};
  for (const [key, val] of Object.entries(options)) {
    if (val === "now") {
      result[key] = (/* @__PURE__ */ new Date()).toISOString();
    } else if (val === "source") {
      result[key] = getNestedValue(context.source, key);
    } else if (typeof val === "string" && val.startsWith("source.")) {
      result[key] = getNestedValue(context.source, val.slice(7));
    } else {
      result[key] = val;
    }
  }
  return result;
};
function getNestedValue(obj, path2) {
  const parts = path2.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) {
      return void 0;
    }
    current = current[part];
  }
  return current;
}

// src/transforms/builtin/registry-lookup.ts
init_esm_shims();
function getRegistryLookupOptions(options) {
  const registry = options.registry;
  const matchField = options.matchField;
  const fuzzyMatch = options.fuzzyMatch;
  const toArray2 = options.toArray;
  const returnFields = options.returnFields;
  return {
    registry: registry === "muscles" || registry === "equipment" || registry === "muscleCategories" ? registry : "muscles",
    matchField: matchField === "name" || matchField === "slug" || matchField === "id" ? matchField : void 0,
    fuzzyMatch: typeof fuzzyMatch === "boolean" ? fuzzyMatch : void 0,
    toArray: typeof toArray2 === "boolean" ? toArray2 : void 0,
    returnFields: Array.isArray(returnFields) ? returnFields.filter((field) => typeof field === "string") : void 0
  };
}
var registryLookup = (value, options = {}, context) => {
  const lookupOptions = getRegistryLookupOptions(options);
  if (value === null || value === void 0 || value === "") {
    return lookupOptions.toArray ? [] : null;
  }
  const registryName = lookupOptions.registry;
  const registry = context.registries[registryName];
  if (!registry || registry.length === 0) {
    console.warn(`Registry "${registryName}" is empty or not loaded`);
    return lookupOptions.toArray ? [] : null;
  }
  const queries = Array.isArray(value) ? value : [value];
  const results = [];
  for (const query of queries) {
    const normalizedQuery = String(query).toLowerCase().trim();
    let match;
    if (lookupOptions.matchField === "id") {
      match = registry.find((entry) => String(entry.id).toLowerCase() === normalizedQuery);
    } else if (lookupOptions.matchField === "slug") {
      match = registry.find((entry) => entry.canonical.slug.toLowerCase() === normalizedQuery);
    } else if (lookupOptions.matchField === "name") {
      match = registry.find(
        (entry) => entry.canonical.name.toLowerCase() === normalizedQuery || entry.canonical.aliases?.some((alias) => alias.toLowerCase() === normalizedQuery)
      );
    } else {
      match = registry.find(
        (entry) => entry.canonical.name.toLowerCase() === normalizedQuery || entry.canonical.slug.toLowerCase() === normalizedQuery
      );
      if (!match) {
        match = registry.find(
          (entry) => entry.canonical.aliases?.some((alias) => alias.toLowerCase() === normalizedQuery)
        );
      }
    }
    if (!match && lookupOptions.fuzzyMatch && lookupOptions.matchField !== "id") {
      match = findFuzzyMatch(registry, normalizedQuery);
    }
    if (match) {
      let result;
      if (registryName === "muscles") {
        const muscleEntry = match;
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug,
          categoryId: muscleEntry.classification?.categoryId || ""
        };
      } else if (registryName === "equipment") {
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug
        };
      } else {
        result = {
          id: match.id,
          name: match.canonical.name,
          slug: match.canonical.slug
        };
      }
      if (lookupOptions.returnFields?.length) {
        const filtered = {};
        const resultRecord = { ...result };
        for (const field of lookupOptions.returnFields) {
          if (field in resultRecord) {
            filtered[field] = resultRecord[field];
          }
        }
        results.push(filtered);
      } else {
        results.push(result);
      }
    }
  }
  if (lookupOptions.toArray) {
    return results;
  }
  return results.length > 0 ? results[0] : null;
};
function findFuzzyMatch(registry, query) {
  let bestMatch = null;
  let bestScore = 0;
  const threshold = 0.6;
  for (const entry of registry) {
    const nameScore = calculateSimilarity(query, entry.canonical.name.toLowerCase());
    if (nameScore > bestScore && nameScore >= threshold) {
      bestScore = nameScore;
      bestMatch = entry;
    }
    const slugScore = calculateSimilarity(query, entry.canonical.slug);
    if (slugScore > bestScore && slugScore >= threshold) {
      bestScore = slugScore;
      bestMatch = entry;
    }
    if (entry.canonical.aliases) {
      for (const alias of entry.canonical.aliases) {
        const aliasScore = calculateSimilarity(query, alias.toLowerCase());
        if (aliasScore > bestScore && aliasScore >= threshold) {
          bestScore = aliasScore;
          bestMatch = entry;
        }
      }
    }
  }
  return bestMatch;
}
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

// src/transforms/builtin/template.ts
init_esm_shims();
var template = (value, options = {}, context) => {
  const templateValue = options.template;
  if (templateValue === void 0) {
    return value;
  }
  if (typeof templateValue === "object" && templateValue !== null) {
    return processTemplateObject(templateValue, value, context);
  }
  if (typeof templateValue === "string") {
    return replaceTemplatePlaceholders(templateValue, value, context);
  }
  return templateValue;
};
function processTemplateObject(template2, value, context) {
  if (Array.isArray(template2)) {
    return template2.map((item) => processTemplateObject(item, value, context));
  }
  if (typeof template2 === "object" && template2 !== null) {
    const result = {};
    for (const [key, val] of Object.entries(template2)) {
      result[key] = processTemplateObject(val, value, context);
    }
    return result;
  }
  if (typeof template2 === "string") {
    return replaceTemplatePlaceholders(template2, value, context);
  }
  return template2;
}
function replaceTemplatePlaceholders(template2, value, context) {
  return template2.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path2) => {
    if (path2 === "value") {
      return String(value ?? "");
    }
    if (path2 === "index") {
      return String(context.field || "");
    }
    const sourceValue = getNestedValue2(context.source, path2);
    if (sourceValue !== void 0) {
      return String(sourceValue);
    }
    const targetValue = getNestedValue2(context.target, path2);
    if (targetValue !== void 0) {
      return String(targetValue);
    }
    return "";
  });
}
function getNestedValue2(obj, path2) {
  const parts = path2.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) {
      return void 0;
    }
    current = current[part];
  }
  return current;
}

// src/transforms/builtin/url-transform.ts
init_esm_shims();
var urlTransform = (value, options = {}) => {
  if (value === null || value === void 0 || value === "") {
    return "";
  }
  let url = String(value);
  const opts = options;
  if (opts.pattern && opts.replace !== void 0) {
    try {
      url = url.replace(new RegExp(opts.pattern), opts.replace);
    } catch (error) {
      console.warn(`Invalid URL transform pattern: ${opts.pattern}`);
    }
  }
  if (opts.baseUrl) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    url = `${opts.baseUrl.replace(/\/$/, "")}/${filename}`;
  }
  if (opts.protocol) {
    url = url.replace(/^https?:/, opts.protocol);
  }
  return url;
};

// src/transforms/transform-registry.ts
var TransformRegistry = class {
  transforms = /* @__PURE__ */ new Map();
  plugins = /* @__PURE__ */ new Map();
  constructor() {
    this.registerBuiltins();
  }
  /**
   * Register built-in transforms
   */
  registerBuiltins() {
    this.register("slugify", slugify);
    this.register("titleCase", titleCase);
    this.register("lowerCase", (v) => String(v).toLowerCase());
    this.register("upperCase", (v) => String(v).toUpperCase());
    this.register("trim", (v) => String(v).trim());
    this.register("uuid", uuid);
    this.register("toArray", toArray);
    this.register("toMediaArray", toMediaArray);
    this.register("timestamp", timestamp);
    this.register("autoGenerate", autoGenerate);
    this.register("registryLookup", registryLookup);
    this.register("template", template);
    this.register("urlTransform", urlTransform);
    this.register("coalesce", (values) => {
      if (Array.isArray(values)) {
        return values.find((v) => v !== void 0 && v !== null && v !== "");
      }
      return values;
    });
    this.register("split", (value, options = {}) => {
      return String(value).split(options.delimiter || ",").map((s) => s.trim());
    });
    this.register("join", (value, options = {}) => {
      if (Array.isArray(value)) {
        return value.join(options.delimiter || ", ");
      }
      return value;
    });
    this.register("replace", (value, options = {}) => {
      if (!options.pattern) return value;
      return String(value).replace(new RegExp(options.pattern, "g"), options.replacement || "");
    });
    this.register("jsonParse", (value) => {
      try {
        return JSON.parse(String(value));
      } catch {
        return value;
      }
    });
    this.register("jsonStringify", (value) => {
      return JSON.stringify(value);
    });
  }
  /**
   * Register a transform function
   */
  register(name, fn) {
    this.transforms.set(name, fn);
  }
  /**
   * Register a plugin
   */
  registerPlugin(plugin) {
    this.plugins.set(plugin.name, plugin);
    for (const [name, fn] of Object.entries(plugin.transforms)) {
      this.transforms.set(`${plugin.name}:${name}`, fn);
    }
  }
  /**
   * Load a plugin from a module path
   */
  async loadPlugin(modulePath) {
    try {
      const module = await import(modulePath);
      const plugin = module.default || module;
      if (this.isValidPlugin(plugin)) {
        this.registerPlugin(plugin);
      } else {
        throw new Error("Invalid plugin structure");
      }
    } catch (error) {
      throw new Error(`Failed to load plugin from ${modulePath}: ${error}`);
    }
  }
  /**
   * Check if an object is a valid plugin
   */
  isValidPlugin(obj) {
    if (typeof obj !== "object" || obj === null) return false;
    const plugin = obj;
    return typeof plugin.name === "string" && typeof plugin.version === "string" && typeof plugin.transforms === "object";
  }
  /**
   * Get a transform function by name
   */
  get(name) {
    return this.transforms.get(name);
  }
  /**
   * Apply a transform
   */
  async apply(name, value, options, context) {
    const transform = this.get(name);
    if (!transform) {
      throw new Error(`Unknown transform: ${name}`);
    }
    return transform(value, options, context);
  }
  /**
   * Check if a transform exists
   */
  has(name) {
    return this.transforms.has(name);
  }
  /**
   * List all registered transforms
   */
  list() {
    return Array.from(this.transforms.keys());
  }
  /**
   * List registered plugins
   */
  listPlugins() {
    return Array.from(this.plugins.keys());
  }
};

// src/core/mapping-engine.ts
var MappingEngine = class {
  transformRegistry;
  constructor() {
    this.transformRegistry = new TransformRegistry();
  }
  /**
   * Apply all mappings to transform source to target
   */
  async apply(source, mappings, context) {
    const target = {};
    for (const [targetPath, mapping] of Object.entries(mappings)) {
      const normalizedMapping = this.normalizeMapping(mapping);
      const value = await this.applyMapping(
        source,
        normalizedMapping,
        { ...context, field: targetPath, target }
      );
      if (value !== void 0) {
        this.setNestedValue(target, targetPath, value);
      }
    }
    return target;
  }
  /**
   * Normalize string shorthand to full mapping object
   */
  normalizeMapping(mapping) {
    if (typeof mapping === "string") {
      return { from: mapping };
    }
    return mapping;
  }
  /**
   * Apply a single field mapping
   */
  async applyMapping(source, mapping, context) {
    if (mapping.condition) {
      const conditionMet = this.evaluateCondition(
        mapping.condition,
        source,
        context.config?.allowUnsafeEval === true
      );
      if (!conditionMet) {
        return void 0;
      }
    }
    let value;
    if (mapping.from === null || mapping.from === void 0) {
      value = void 0;
    } else if (Array.isArray(mapping.from)) {
      for (const path2 of mapping.from) {
        value = this.getNestedValue(source, path2);
        if (value !== void 0 && value !== null && value !== "") {
          break;
        }
      }
    } else {
      value = this.getNestedValue(source, mapping.from);
    }
    if ((value === void 0 || value === null || value === "") && mapping.default !== void 0) {
      value = mapping.default;
    }
    if (mapping.transform) {
      const transforms = Array.isArray(mapping.transform) ? mapping.transform : [mapping.transform];
      for (const transformName of transforms) {
        value = await this.transformRegistry.apply(
          transformName,
          value,
          mapping.options || {},
          context
        );
      }
    }
    if (mapping.required && (value === void 0 || value === null)) {
      throw new Error(`Required field ${context.field} could not be populated`);
    }
    return value;
  }
  /**
   * Get a nested value from an object using dot notation
   */
  getNestedValue(obj, path2) {
    const parts = path2.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === void 0) {
        return void 0;
      }
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        current = current[fieldName];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        } else {
          return void 0;
        }
      } else {
        current = current[part];
      }
    }
    return current;
  }
  /**
   * Set a nested value in an object using dot notation
   */
  setNestedValue(obj, path2, value) {
    const parts = path2.split(".");
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        const targetIndex = parseInt(index, 10);
        if (current === null || current === void 0 || typeof current !== "object") {
          return;
        }
        const currentRecord2 = current;
        if (!Array.isArray(currentRecord2[fieldName])) {
          currentRecord2[fieldName] = [];
        }
        const arrayRef = currentRecord2[fieldName];
        if (isLast) {
          arrayRef[targetIndex] = value;
          return;
        }
        if (arrayRef[targetIndex] === void 0) {
          const nextPart = parts[i + 1];
          arrayRef[targetIndex] = /^\w+\[\d+\]$/.test(nextPart) ? [] : {};
        }
        current = arrayRef[targetIndex];
        continue;
      }
      if (current === null || current === void 0 || typeof current !== "object") {
        return;
      }
      const currentRecord = current;
      if (isLast) {
        currentRecord[part] = value;
        return;
      }
      if (!(part in currentRecord)) {
        const nextPart = parts[i + 1];
        currentRecord[part] = /^\w+\[\d+\]$/.test(nextPart) ? [] : {};
      }
      current = currentRecord[part];
    }
  }
  /**
   * Evaluate a condition expression
   */
  evaluateCondition(condition, source, allowUnsafeEval) {
    if (!allowUnsafeEval) {
      console.warn("Conditional expressions are disabled. Set allowUnsafeEval to true to enable them.");
      return false;
    }
    try {
      const fn = new Function("source", `return ${condition}`);
      return Boolean(fn(source));
    } catch {
      console.warn(`Failed to evaluate condition: ${condition}`);
      return true;
    }
  }
};

// src/registries/registry-manager.ts
init_esm_shims();

// src/registries/fuzzy-matcher.ts
init_esm_shims();
import levenshtein from "fast-levenshtein";
var FuzzyMatcher = class {
  defaultThreshold = 0.6;
  /**
   * Find the best matching entry in a registry
   */
  findBestMatch(registry, query, options = {}) {
    const threshold = options.threshold ?? this.defaultThreshold;
    const normalizedQuery = options.caseSensitive ? query.trim() : query.toLowerCase().trim();
    let bestMatch = null;
    for (const entry of registry) {
      const nameScore = this.calculateSimilarity(
        normalizedQuery,
        options.caseSensitive ? entry.canonical.name : entry.canonical.name.toLowerCase()
      );
      if (nameScore > (bestMatch?.score ?? threshold)) {
        bestMatch = { entry, score: nameScore, matchedField: "name" };
      }
      const slugScore = this.calculateSimilarity(
        normalizedQuery,
        entry.canonical.slug
      );
      if (slugScore > (bestMatch?.score ?? threshold)) {
        bestMatch = { entry, score: slugScore, matchedField: "slug" };
      }
      if (entry.canonical.aliases) {
        for (const alias of entry.canonical.aliases) {
          const aliasScore = this.calculateSimilarity(
            normalizedQuery,
            options.caseSensitive ? alias : alias.toLowerCase()
          );
          if (aliasScore > (bestMatch?.score ?? threshold)) {
            bestMatch = { entry, score: aliasScore, matchedField: `alias:${alias}` };
          }
        }
      }
    }
    return bestMatch?.entry ?? null;
  }
  /**
   * Find all matches above threshold
   */
  findAllMatches(registry, query, options = {}) {
    const threshold = options.threshold ?? this.defaultThreshold;
    const normalizedQuery = options.caseSensitive ? query.trim() : query.toLowerCase().trim();
    const matches = [];
    for (const entry of registry) {
      const scores = [];
      scores.push({
        score: this.calculateSimilarity(
          normalizedQuery,
          options.caseSensitive ? entry.canonical.name : entry.canonical.name.toLowerCase()
        ),
        field: "name"
      });
      scores.push({
        score: this.calculateSimilarity(normalizedQuery, entry.canonical.slug),
        field: "slug"
      });
      if (entry.canonical.aliases) {
        for (const alias of entry.canonical.aliases) {
          scores.push({
            score: this.calculateSimilarity(
              normalizedQuery,
              options.caseSensitive ? alias : alias.toLowerCase()
            ),
            field: `alias:${alias}`
          });
        }
      }
      const best = scores.reduce((a, b) => a.score > b.score ? a : b);
      if (best.score >= threshold) {
        matches.push({
          entry,
          score: best.score,
          matchedField: best.field
        });
      }
    }
    return matches.sort((a, b) => b.score - a.score);
  }
  /**
   * Calculate similarity between two strings (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    const distance = levenshtein.get(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }
  /**
   * Normalize a string for comparison
   */
  normalize(str) {
    return str.toLowerCase().trim().replace(/[\s-_]+/g, " ").replace(/[^a-z0-9 ]/g, "");
  }
};

// src/registries/registry-manager.ts
var RegistryManager = class {
  muscles = [];
  equipment = [];
  muscleCategories = [];
  fuzzyMatcher;
  constructor() {
    this.fuzzyMatcher = new FuzzyMatcher();
  }
  /**
   * Load all registries from config
   */
  async load(config) {
    const loaders = [];
    if (config.muscles) {
      loaders.push(this.loadRegistry("muscles", config.muscles));
    }
    if (config.equipment) {
      loaders.push(this.loadRegistry("equipment", config.equipment));
    }
    if (config.muscleCategories) {
      loaders.push(this.loadRegistry("muscleCategories", config.muscleCategories));
    }
    await Promise.all(loaders);
  }
  /**
   * Load a single registry
   */
  async loadRegistry(type, config) {
    let data = [];
    try {
      if (config.inline && config.inline.length > 0) {
        data = config.inline;
      } else if (config.local) {
        data = await this.loadFromFile(config.local);
      } else if (config.source === "remote" || config.url) {
        data = await this.loadFromUrl(
          config.url || this.getDefaultUrl(type)
        );
      }
    } catch (error) {
      if (config.fallback) {
        console.warn(`Failed to load ${type} from primary source, trying fallback`);
        if (config.fallback === "local" && config.local) {
          data = await this.loadFromFile(config.local);
        } else if (config.fallback === "remote") {
          data = await this.loadFromUrl(this.getDefaultUrl(type));
        }
      } else {
        throw error;
      }
    }
    switch (type) {
      case "muscles":
        this.muscles = data;
        break;
      case "equipment":
        this.equipment = data;
        break;
      case "muscleCategories":
        this.muscleCategories = data;
        break;
    }
  }
  /**
   * Load registry from local file
   */
  async loadFromFile(path2) {
    const fs = await import("fs/promises");
    const content = await fs.readFile(path2, "utf-8");
    return JSON.parse(content);
  }
  /**
   * Load registry from URL
   */
  async loadFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch registry from ${url}: ${response.statusText}`);
    }
    return response.json();
  }
  /**
   * Get default URL for a registry type
   */
  getDefaultUrl(type) {
    const baseUrl = "https://spec.vitness.me/registries";
    switch (type) {
      case "muscles":
        return `${baseUrl}/muscles.registry.json`;
      case "equipment":
        return `${baseUrl}/equipment.registry.json`;
      case "muscleCategories":
        return `${baseUrl}/muscle-categories.registry.json`;
      default:
        throw new Error(`Unknown registry type: ${type}`);
    }
  }
  // Getters
  getMuscles() {
    return this.muscles;
  }
  getEquipment() {
    return this.equipment;
  }
  getMuscleCategories() {
    return this.muscleCategories;
  }
  // Lookup methods
  findMuscle(query, fuzzy = true) {
    return this.findInRegistry(this.muscles, query, fuzzy);
  }
  findEquipment(query, fuzzy = true) {
    return this.findInRegistry(this.equipment, query, fuzzy);
  }
  findMuscleCategory(query, fuzzy = true) {
    return this.findInRegistry(this.muscleCategories, query, fuzzy);
  }
  /**
   * Find an entry in a registry
   */
  findInRegistry(registry, query, fuzzy) {
    const normalizedQuery = query.toLowerCase().trim();
    let match = registry.find(
      (entry) => entry.canonical.name.toLowerCase() === normalizedQuery || entry.canonical.slug === normalizedQuery
    );
    if (match) return match;
    match = registry.find(
      (entry) => entry.canonical.aliases?.some(
        (alias) => alias.toLowerCase() === normalizedQuery
      )
    );
    if (match) return match;
    if (fuzzy) {
      return this.fuzzyMatcher.findBestMatch(registry, query);
    }
    return null;
  }
};

// src/schemas/schema-manager.ts
init_esm_shims();

// src/schemas/validator.ts
init_esm_shims();
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
var Validator = class {
  ajv;
  compiledSchemas = /* @__PURE__ */ new Map();
  schemaErrors = /* @__PURE__ */ new Map();
  silent;
  constructor(options = {}) {
    this.silent = options.silent ?? false;
    this.ajv = new Ajv2020({
      allErrors: true,
      verbose: true,
      strict: false,
      loadSchema: this.loadExternalSchema.bind(this)
    });
    addFormats(this.ajv);
  }
  /**
   * Load external schema by URI (for $ref resolution)
   * This is called by Ajv when it encounters an external $ref
   */
  async loadExternalSchema(uri) {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (!this.silent) {
        console.warn(`Could not load external schema ${uri}:`, error);
      }
      return { type: "object", additionalProperties: true };
    }
  }
  /**
   * Add schemas to the validator
   * First registers all schemas with their $id, then compiles them
   */
  addSchemas(schemas) {
    for (const [, schema] of schemas) {
      try {
        const schemaObj = schema;
        if (schemaObj.$id) {
          this.ajv.addSchema(schema, schemaObj.$id);
        }
      } catch {
      }
    }
    for (const [name, schema] of schemas) {
      try {
        const schemaObj = schema;
        let compiled = schemaObj.$id ? this.ajv.getSchema(schemaObj.$id) : void 0;
        if (!compiled) {
          compiled = this.ajv.compile(schema);
        }
        if (compiled) {
          this.compiledSchemas.set(name, compiled);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (!this.silent) {
          console.warn(`Failed to compile schema ${name}:`, message);
        }
        this.schemaErrors.set(name, message);
      }
    }
  }
  /**
   * Check if a schema had compilation errors
   */
  hasSchemaError(name) {
    return this.schemaErrors.has(name);
  }
  /**
   * Get schema compilation error
   */
  getSchemaError(name) {
    return this.schemaErrors.get(name);
  }
  /**
   * Validate data against a schema
   */
  validate(data, schema) {
    let validateFn;
    if (typeof schema === "string") {
      const schemaError = this.schemaErrors.get(schema);
      if (schemaError) {
        return {
          valid: true,
          errors: [],
          warnings: [
            {
              field: "_schema",
              message: `Schema "${schema}" could not be compiled: ${schemaError}. Validation skipped.`
            }
          ]
        };
      }
      const compiled = this.compiledSchemas.get(schema);
      if (!compiled) {
        return {
          valid: true,
          errors: [],
          warnings: [
            {
              field: "_schema",
              message: `Schema "${schema}" not found. Validation skipped.`
            }
          ]
        };
      }
      validateFn = compiled;
    } else {
      try {
        validateFn = this.ajv.compile(schema);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              field: "_schema",
              message: `Failed to compile schema: ${error instanceof Error ? error.message : "Unknown error"}`
            }
          ]
        };
      }
    }
    const valid = validateFn(data);
    if (valid) {
      return { valid: true, errors: [] };
    }
    const errors = (validateFn.errors || []).map((err) => ({
      field: err.instancePath ? err.instancePath.slice(1).replace(/\//g, ".") : err.params?.missingProperty || "_root",
      message: err.message || "Validation failed",
      value: err.data,
      constraint: err.keyword
    }));
    return { valid: false, errors };
  }
  /**
   * Validate and return typed result
   */
  validateTyped(data, schema) {
    const result = this.validate(data, schema);
    if (result.valid) {
      return { valid: true, data };
    }
    return { valid: false, errors: result.errors };
  }
  /**
   * Check if a value matches a specific type
   */
  isValidType(value, type) {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "integer":
        return typeof value === "number" && Number.isInteger(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return typeof value === "object" && value !== null && !Array.isArray(value);
      case "null":
        return value === null;
      default:
        return true;
    }
  }
  /**
   * Format validation errors for display
   */
  formatErrors(errors) {
    return errors.map((err) => {
      let msg = `${err.field}: ${err.message}`;
      if (err.constraint) {
        msg += ` (${err.constraint})`;
      }
      return msg;
    }).join("\n");
  }
};

// src/schemas/schema-manager.ts
var SchemaManager = class {
  schemas = /* @__PURE__ */ new Map();
  validator;
  cacheDir = null;
  lastLoadResult = null;
  constructor() {
    this.validator = new Validator();
  }
  /**
   * Load a specific schema version using hybrid approach:
   * 1. Try remote first (gets latest)
   * 2. Validate that schemas compile correctly (catch broken $ref paths)
   * 3. Fall back to bundled if remote fails or has compilation errors
   */
  async loadVersion(version) {
    if (this.schemas.has(version)) {
      return;
    }
    const entitySchemas = /* @__PURE__ */ new Map();
    const entities = ["exercise", "equipment", "muscle", "muscle-category", "body-atlas"];
    const errors = [];
    let source = "remote";
    let remoteSuccess = true;
    for (const entity of entities) {
      try {
        const schema = await this.fetchSchema(entity, version);
        entitySchemas.set(entity, schema);
      } catch (error) {
        remoteSuccess = false;
        errors.push(`Remote fetch failed for ${entity}: ${error instanceof Error ? error.message : "Unknown error"}`);
        break;
      }
    }
    if (remoteSuccess) {
      const testValidator = new Validator({ silent: true });
      testValidator.addSchemas(entitySchemas);
      for (const entity of entities) {
        if (testValidator.hasSchemaError(entity)) {
          remoteSuccess = false;
          errors.push(`Remote schema compilation failed for ${entity}: ${testValidator.getSchemaError(entity)}`);
        }
      }
    }
    if (!remoteSuccess) {
      entitySchemas.clear();
      source = "bundled";
      try {
        const bundled = await this.loadBundled(version);
        for (const [entity, schema] of Object.entries(bundled)) {
          entitySchemas.set(entity, schema);
        }
      } catch (bundledError) {
        errors.push(`Bundled fallback failed: ${bundledError instanceof Error ? bundledError.message : "Unknown error"}`);
        for (const err of errors) {
          console.warn(err);
        }
      }
    }
    this.lastLoadResult = {
      source,
      entities: Array.from(entitySchemas.keys()),
      errors
    };
    this.schemas.set(version, entitySchemas);
    this.validator.addSchemas(entitySchemas);
  }
  /**
   * Get information about how schemas were loaded
   */
  getLoadResult() {
    return this.lastLoadResult;
  }
  /**
   * Load bundled schemas (fallback for offline/network errors)
   */
  async loadBundled(version) {
    if (version === "1.0.0") {
      try {
        const bundled = await Promise.resolve().then(() => (init_v1_0(), v1_0_exports));
        return bundled.default || bundled;
      } catch {
        throw new Error(`Failed to load bundled schemas for version ${version}`);
      }
    }
    throw new Error(`No bundled schemas for version ${version}`);
  }
  /**
   * Fetch schema from remote URL
   */
  async fetchSchema(entity, version) {
    const baseUrl = "https://spec.vitness.me/schemas";
    let url;
    switch (entity) {
      case "exercise":
        url = `${baseUrl}/exercises/v${version}/exercise.schema.json`;
        break;
      case "equipment":
        url = `${baseUrl}/equipment/v${version}/equipment.schema.json`;
        break;
      case "muscle":
        url = `${baseUrl}/muscle/v${version}/muscle.schema.json`;
        break;
      case "muscle-category":
        url = `${baseUrl}/muscle/muscle-category/v${version}/muscle-category.schema.json`;
        break;
      case "body-atlas":
        url = `${baseUrl}/atlas/v${version}/body-atlas.schema.json`;
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }
    const schema = await response.json();
    if (this.cacheDir) {
      await this.cacheSchema(entity, version, schema);
    }
    return schema;
  }
  /**
   * Cache schema locally
   */
  async cacheSchema(entity, version, schema) {
    if (!this.cacheDir) return;
    const fs = await import("fs/promises");
    const path2 = await import("path");
    const dir = path2.join(this.cacheDir, `v${version}`);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path2.join(dir, `${entity}.schema.json`);
    await fs.writeFile(filePath, JSON.stringify(schema, null, 2));
  }
  /**
   * List available schema versions
   */
  async listVersions() {
    return [
      {
        version: "1.0.0",
        url: "https://spec.vitness.me/schemas/exercises/v1.0.0/exercise.schema.json",
        bundled: true
      }
    ];
  }
  /**
   * Get a specific schema
   */
  getSchema(entity, version = "1.0.0") {
    return this.schemas.get(version)?.get(entity) ?? null;
  }
  /**
   * Validate data against a schema
   */
  async validate(data, entity, version = "1.0.0") {
    await this.loadVersion(version);
    return this.validator.validate(data, entity);
  }
  /**
   * Set the cache directory
   */
  setCacheDir(dir) {
    this.cacheDir = dir;
  }
  /**
   * Update cached schemas
   */
  async updateCache() {
    const versions = await this.listVersions();
    for (const { version } of versions) {
      await this.loadVersion(version);
    }
  }
  /**
   * Force load bundled schemas only (skip remote fetch)
   * Useful for offline mode or when remote schemas are known to be broken
   */
  async loadBundledOnly(version) {
    if (this.schemas.has(version)) {
      return;
    }
    const entitySchemas = /* @__PURE__ */ new Map();
    try {
      const bundled = await this.loadBundled(version);
      for (const [entity, schema] of Object.entries(bundled)) {
        entitySchemas.set(entity, schema);
      }
      this.lastLoadResult = {
        source: "bundled",
        entities: Array.from(entitySchemas.keys()),
        errors: []
      };
    } catch (error) {
      this.lastLoadResult = {
        source: "bundled",
        entities: [],
        errors: [`Failed to load bundled schemas: ${error instanceof Error ? error.message : "Unknown error"}`]
      };
      throw error;
    }
    this.schemas.set(version, entitySchemas);
    this.validator.addSchemas(entitySchemas);
  }
  /**
   * Clear loaded schemas (useful for testing or reloading)
   */
  clearSchemas() {
    this.schemas.clear();
    this.lastLoadResult = null;
  }
};

// src/ai/enrichment-engine.ts
init_esm_shims();

// src/ai/providers/openrouter.ts
init_esm_shims();
var RateLimitError = class extends Error {
  statusCode = 429;
  retryAfter;
  constructor(message, retryAfter = null) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var OpenRouterAPIError = class extends Error {
  statusCode;
  constructor(message, statusCode) {
    super(message);
    this.name = "OpenRouterAPIError";
    this.statusCode = statusCode;
  }
};
var OpenRouterProvider = class {
  name = "openrouter";
  apiKey;
  model;
  baseUrl;
  defaultTemperature;
  defaultMaxTokens;
  maxRetries;
  retryDelay;
  rateLimiter;
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || "anthropic/claude-3.5-sonnet";
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultTemperature = config.temperature ?? 0.3;
    this.defaultMaxTokens = config.maxTokens ?? 1024;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1e3;
    this.rateLimiter = config.rateLimiter ?? null;
  }
  /**
   * Set or update the rate limiter
   */
  setRateLimiter(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }
  /**
   * Get the current rate limiter (for testing/monitoring)
   */
  getRateLimiter() {
    return this.rateLimiter;
  }
  /**
   * Get the current model
   */
  getModel() {
    return this.model;
  }
  /**
   * Set the model for subsequent requests
   */
  setModel(model) {
    this.model = model;
  }
  /**
   * Send a completion request with rate limiting and 429 handling
   */
  async complete(prompt, options = {}) {
    const messages = [
      ...options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : [],
      { role: "user", content: prompt }
    ];
    let lastError = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (this.rateLimiter) {
          await this.rateLimiter.acquire();
        }
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://spec.vitness.me",
            "X-Title": "FDS Transformer"
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: options.temperature ?? this.defaultTemperature,
            max_tokens: options.maxTokens ?? this.defaultMaxTokens
          })
        });
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response.headers.get("Retry-After"));
          if (this.rateLimiter) {
            this.rateLimiter.recordRateLimitHit();
          }
          const errorBody = await response.text();
          throw new RateLimitError(
            `Rate limited by OpenRouter: ${errorBody}`,
            retryAfter
          );
        }
        if (!response.ok) {
          const errorBody = await response.text();
          throw new OpenRouterAPIError(
            `OpenRouter API error: ${response.status} ${errorBody}`,
            response.status
          );
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const tokensUsed = data.usage?.total_tokens || 0;
        if (this.rateLimiter) {
          this.rateLimiter.recordSuccess();
        }
        return {
          content,
          tokensUsed,
          model: data.model || this.model
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isRateLimitError = error instanceof RateLimitError;
        if (attempt < this.maxRetries - 1) {
          let delay;
          if (isRateLimitError && error.retryAfter) {
            delay = error.retryAfter * 1e3;
          } else if (isRateLimitError && this.rateLimiter) {
            delay = this.rateLimiter.getBackoffRemaining();
            if (delay === 0) {
              delay = this.retryDelay * Math.pow(2, attempt);
            }
          } else {
            delay = this.retryDelay * Math.pow(2, attempt);
          }
          await this.sleep(delay);
        }
      }
    }
    throw lastError || new Error("Failed to complete request after retries");
  }
  /**
   * Parse the Retry-After header value
   * Can be either seconds or HTTP-date format
   */
  parseRetryAfter(value) {
    if (!value) return null;
    const seconds = parseInt(value, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1e3));
    }
    return null;
  }
  /**
   * Send a completion request expecting JSON response
   */
  async completeJSON(prompt, _schema, options = {}) {
    const systemPrompt = options.systemPrompt || "You are a helpful assistant that responds only with valid JSON. Do not include any text outside the JSON object.";
    const response = await this.complete(prompt, {
      ...options,
      systemPrompt
    });
    const content = response.content.trim();
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${content.slice(0, 200)}`);
    }
  }
  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
  }
};

// src/ai/rate-limiter.ts
init_esm_shims();
var DEFAULT_RATE_LIMIT_CONFIG = {
  requestsPerMinute: 50,
  backoffStrategy: "exponential",
  initialBackoffMs: 1e3,
  maxBackoffMs: 6e4
};
var RateLimiter = class {
  config;
  requestTimestamps = [];
  consecutiveHits = 0;
  currentBackoffMs = 0;
  backoffUntil = 0;
  lastRequestTime = null;
  constructor(config = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }
  /**
   * Acquire permission to make a request
   * Waits if necessary to stay within rate limits
   * @returns Promise that resolves when it's safe to make a request
   */
  async acquire() {
    const now = Date.now();
    if (this.backoffUntil > now) {
      const waitTime = this.backoffUntil - now;
      await this.sleep(waitTime);
    }
    this.cleanOldTimestamps();
    if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const windowEnd = oldestTimestamp + 6e4;
      const waitTime = Math.max(0, windowEnd - Date.now());
      if (waitTime > 0) {
        await this.sleep(waitTime);
        this.cleanOldTimestamps();
      }
    }
    this.requestTimestamps.push(Date.now());
    this.lastRequestTime = Date.now();
  }
  /**
   * Record a rate limit hit (429 response)
   * Increases backoff according to strategy
   */
  recordRateLimitHit() {
    this.consecutiveHits++;
    this.currentBackoffMs = this.calculateBackoff();
    this.backoffUntil = Date.now() + this.currentBackoffMs;
  }
  /**
   * Record a successful request
   * Resets backoff counter
   */
  recordSuccess() {
    this.consecutiveHits = 0;
    this.currentBackoffMs = 0;
    this.backoffUntil = 0;
  }
  /**
   * Get current rate limiter state for logging/monitoring
   */
  getState() {
    const now = Date.now();
    this.cleanOldTimestamps();
    let waitTimeMs = 0;
    if (this.backoffUntil > now) {
      waitTimeMs = this.backoffUntil - now;
    } else if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const windowEnd = oldestTimestamp + 6e4;
      waitTimeMs = Math.max(0, windowEnd - now);
    }
    return {
      requestsInWindow: this.requestTimestamps.length,
      requestsPerMinute: this.config.requestsPerMinute,
      currentBackoffMs: this.currentBackoffMs,
      consecutiveHits: this.consecutiveHits,
      isBackingOff: this.backoffUntil > now,
      lastRequestTime: this.lastRequestTime,
      waitTimeMs
    };
  }
  /**
   * Get the configured requests per minute
   */
  getRequestsPerMinute() {
    return this.config.requestsPerMinute;
  }
  /**
   * Check if currently in backoff state
   */
  isInBackoff() {
    return this.backoffUntil > Date.now();
  }
  /**
   * Get time remaining in backoff (0 if not in backoff)
   */
  getBackoffRemaining() {
    return Math.max(0, this.backoffUntil - Date.now());
  }
  /**
   * Reset the rate limiter state
   */
  reset() {
    this.requestTimestamps = [];
    this.consecutiveHits = 0;
    this.currentBackoffMs = 0;
    this.backoffUntil = 0;
    this.lastRequestTime = null;
  }
  /**
   * Calculate backoff based on strategy
   */
  calculateBackoff() {
    const { backoffStrategy, initialBackoffMs, maxBackoffMs } = this.config;
    let backoff;
    switch (backoffStrategy) {
      case "exponential":
        backoff = initialBackoffMs * Math.pow(2, this.consecutiveHits - 1);
        break;
      case "linear":
        backoff = initialBackoffMs * this.consecutiveHits;
        break;
      case "fixed":
        backoff = initialBackoffMs;
        break;
      default:
        backoff = initialBackoffMs;
    }
    return Math.min(backoff, maxBackoffMs);
  }
  /**
   * Remove timestamps older than 1 minute
   */
  cleanOldTimestamps() {
    const cutoff = Date.now() - 6e4;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
  }
  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
  }
};

// src/ai/checkpoint-manager.ts
init_esm_shims();
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
var CHECKPOINT_FILENAME = ".fds-checkpoint.json";
var ENRICHMENT_LOG_FILENAME = "enrichment.log";
var CHECKPOINT_VERSION = "1.0.0";
var DEFAULT_CHECKPOINT_CONFIG = {
  enabled: true,
  saveInterval: 10
};
var CheckpointManager = class {
  config;
  checkpointPath;
  logFilePath;
  data = null;
  updatesSinceLastSave = 0;
  constructor(outputDirectory, config = {}) {
    this.config = { ...DEFAULT_CHECKPOINT_CONFIG, ...config };
    this.checkpointPath = join(outputDirectory, CHECKPOINT_FILENAME);
    this.logFilePath = join(outputDirectory, ENRICHMENT_LOG_FILENAME);
  }
  /**
   * Check if a checkpoint file exists
   */
  exists() {
    return existsSync(this.checkpointPath);
  }
  /**
   * Load existing checkpoint from file
   * @returns Checkpoint data if found and valid, null otherwise
   */
  load() {
    if (!this.exists()) {
      return null;
    }
    try {
      const content = readFileSync(this.checkpointPath, "utf-8");
      const data = JSON.parse(content);
      if (!data.version || !data.configHash || !data.completedIds) {
        return null;
      }
      this.data = data;
      return data;
    } catch {
      return null;
    }
  }
  /**
   * Initialize a new checkpoint
   * @param options - Initialization options
   * @returns The new checkpoint data
   */
  initialize(options) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const configHash = this.hashConfig(options.config);
    this.data = {
      version: CHECKPOINT_VERSION,
      configHash,
      startedAt: now,
      lastUpdatedAt: now,
      inputFile: options.inputFile,
      totalExercises: options.totalExercises,
      completedExercises: 0,
      completedIds: [],
      failedIds: [],
      currentTier: "simple",
      results: {}
    };
    this.ensureDirectory();
    this.forceSave();
    return this.data;
  }
  /**
   * Validate checkpoint against current config
   * @param currentConfig - Current configuration to compare hash
   * @returns Validation result
   */
  validate(currentConfig) {
    if (!this.data) {
      return { valid: false, reason: "No checkpoint loaded" };
    }
    if (this.data.version !== CHECKPOINT_VERSION) {
      return {
        valid: false,
        reason: `Checkpoint version mismatch: expected ${CHECKPOINT_VERSION}, got ${this.data.version}`
      };
    }
    const currentHash = this.hashConfig(currentConfig);
    const configMatches = this.data.configHash === currentHash;
    if (!configMatches) {
      return {
        valid: false,
        reason: "Configuration has changed since checkpoint was created",
        configMatches: false,
        expectedHash: currentHash,
        actualHash: this.data.configHash
      };
    }
    return { valid: true, configMatches: true };
  }
  /**
   * Update checkpoint with exercise completion
   * @param options - Update options
   */
  update(options) {
    if (!this.data) {
      throw new Error("Checkpoint not initialized. Call initialize() or load() first.");
    }
    const { exerciseId, success, currentTier, results } = options;
    this.data.currentTier = currentTier;
    this.data.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (success) {
      if (!this.data.completedIds.includes(exerciseId)) {
        this.data.completedIds.push(exerciseId);
        this.data.completedExercises = this.data.completedIds.length;
      }
      const failedIndex = this.data.failedIds.indexOf(exerciseId);
      if (failedIndex > -1) {
        this.data.failedIds.splice(failedIndex, 1);
      }
    } else {
      if (!this.data.failedIds.includes(exerciseId)) {
        this.data.failedIds.push(exerciseId);
      }
    }
    if (results) {
      if (!this.data.results[exerciseId]) {
        this.data.results[exerciseId] = {};
      }
      for (const [tier, fields] of Object.entries(results)) {
        if (!this.data.results[exerciseId][tier]) {
          this.data.results[exerciseId][tier] = {};
        }
        Object.assign(this.data.results[exerciseId][tier], fields);
      }
    }
    this.updatesSinceLastSave++;
    if (this.updatesSinceLastSave >= this.config.saveInterval) {
      this.save();
    }
  }
  /**
   * Save checkpoint to file
   * Only saves if there are pending updates
   * @returns Whether a save was performed
   */
  save() {
    if (!this.data || this.updatesSinceLastSave === 0) {
      return false;
    }
    this.forceSave();
    return true;
  }
  /**
   * Force save checkpoint to file regardless of pending updates
   */
  forceSave() {
    if (!this.data) {
      return;
    }
    this.ensureDirectory();
    this.data.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const content = JSON.stringify(this.data, null, 2);
    const tempPath = `${this.checkpointPath}.tmp.${process.pid}.${Date.now()}`;
    writeFileSync(tempPath, content, "utf-8");
    renameSync(tempPath, this.checkpointPath);
    this.updatesSinceLastSave = 0;
  }
  /**
   * Clear checkpoint file (call on successful completion)
   */
  clear() {
    if (existsSync(this.checkpointPath)) {
      unlinkSync(this.checkpointPath);
    }
    this.data = null;
    this.updatesSinceLastSave = 0;
  }
  /**
   * Get list of completed exercise IDs (for skipping on resume)
   */
  getCompletedIds() {
    return this.data?.completedIds ?? [];
  }
  /**
   * Get list of failed exercise IDs
   */
  getFailedIds() {
    return this.data?.failedIds ?? [];
  }
  /**
   * Get partial results for an exercise
   */
  getResults(exerciseId) {
    return this.data?.results[exerciseId];
  }
  /**
   * Get all partial results
   */
  getAllResults() {
    return this.data?.results ?? {};
  }
  /**
   * Get path for enrichment log file
   */
  getLogFilePath() {
    return this.logFilePath;
  }
  /**
   * Get path to checkpoint file
   */
  getCheckpointPath() {
    return this.checkpointPath;
  }
  /**
   * Get current checkpoint data (readonly copy)
   */
  getData() {
    if (!this.data) {
      return null;
    }
    return { ...this.data };
  }
  /**
   * Get current tier being processed
   */
  getCurrentTier() {
    return this.data?.currentTier ?? null;
  }
  /**
   * Get progress percentage
   */
  getProgress() {
    if (!this.data || this.data.totalExercises === 0) {
      return 0;
    }
    return this.data.completedExercises / this.data.totalExercises * 100;
  }
  /**
   * Check if checkpointing is enabled
   */
  isEnabled() {
    return this.config.enabled;
  }
  /**
   * Get save interval
   */
  getSaveInterval() {
    return this.config.saveInterval;
  }
  /**
   * Hash configuration for change detection
   */
  hashConfig(config) {
    const json = this.stableStringify(config);
    return createHash("sha256").update(json).digest("hex").substring(0, 16);
  }
  stableStringify(value) {
    const seen = /* @__PURE__ */ new WeakSet();
    const stringify = (input) => {
      if (input === null) {
        return "null";
      }
      const inputType = typeof input;
      if (inputType === "number") {
        return Number.isFinite(input) ? String(input) : "null";
      }
      if (inputType === "string") {
        return JSON.stringify(input);
      }
      if (inputType === "boolean") {
        return input ? "true" : "false";
      }
      if (inputType === "bigint") {
        return JSON.stringify(String(input));
      }
      if (inputType === "undefined" || inputType === "function" || inputType === "symbol") {
        return void 0;
      }
      if (inputType !== "object") {
        return JSON.stringify(input);
      }
      const objectValue = input;
      if (typeof objectValue.toJSON === "function") {
        return stringify(objectValue.toJSON());
      }
      if (Array.isArray(objectValue)) {
        const items = objectValue.map((item) => stringify(item) ?? "null");
        return `[${items.join(",")} ]`.replace(", ]", "]");
      }
      if (seen.has(objectValue)) {
        throw new TypeError("Cannot stringify circular structure");
      }
      seen.add(objectValue);
      const keys = Object.keys(objectValue).sort();
      const entries = [];
      for (const key of keys) {
        const valueString = stringify(objectValue[key]);
        if (valueString !== void 0) {
          entries.push(`${JSON.stringify(key)}:${valueString}`);
        }
      }
      seen.delete(objectValue);
      return `{${entries.join(",")}}`;
    };
    return stringify(value) ?? "null";
  }
  /**
   * Ensure output directory exists
   */
  ensureDirectory() {
    const dir = dirname(this.checkpointPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
};

// src/ai/prompts/exercise-prompts.ts
init_esm_shims();
var EXERCISE_SYSTEM_PROMPT = `You are an expert exercise physiologist and certified strength and conditioning specialist (CSCS) with deep knowledge of biomechanics, anatomy, and exercise programming.

Your responses must be:
1. Technically accurate based on exercise science
2. Practical and applicable for fitness professionals
3. Formatted as valid JSON only - no markdown, no explanations

Use proper anatomical terminology and exercise science concepts.`;
function getExerciseEnrichmentPrompt(context) {
  return `Analyze this exercise and provide comprehensive enrichment data:

Exercise: ${context.name}
${context.target ? `Primary Target: ${context.target}` : ""}
${context.equipment ? `Equipment: ${context.equipment}` : ""}
${context.bodyPart ? `Body Part: ${context.bodyPart}` : ""}

Provide a JSON object with ALL of the following fields:

{
  "description": "A detailed 1-2 sentence description of the exercise emphasizing the movement pattern and primary benefits",
  "aliases": ["3-5 common alternative names for this exercise"],
  "localized": [
    {
      "lang": "sr",
      "name": "Serbian name",
      "description": "Serbian description",
      "aliases": ["Serbian aliases"]
    },
    {
      "lang": "es", 
      "name": "Spanish name",
      "description": "Spanish description",
      "aliases": ["Spanish aliases"]
    }
  ],
  "classification": {
    "exerciseType": "strength|cardio|flexibility|balance|plyometric",
    "movement": "squat|hinge|push|pull|lunge|carry|rotation|core-anti-extension|core-anti-rotation|other",
    "mechanics": "compound|isolation",
    "force": "push|pull|static|dynamic",
    "level": "beginner|intermediate|advanced",
    "unilateral": false,
    "kineticChain": "open|closed",
    "tags": ["relevant tags like bilateral, freeWeight, barbell, kneeDominant, upperBody, etc."]
  },
  "targets": {
    "secondary": [
      {"id": "mus.muscleName", "name": "Muscle Name", "categoryId": "cat.category"}
    ]
  },
  "equipment": {
    "optional": [
      {"id": "eq.equipmentName", "name": "Equipment Name"}
    ]
  },
  "constraints": {
    "contraindications": ["3-4 specific medical/injury conditions that would make this exercise inadvisable"],
    "prerequisites": ["3-4 movement competencies or abilities required before attempting this exercise"],
    "progressions": ["4-5 harder variations or next-level exercises"],
    "recessions": ["4-5 easier variations or regression exercises"]
  },
  "relations": [
    {"type": "alternate", "targetId": "urn:slug:exercise-slug"},
    {"type": "regression", "targetId": "urn:slug:exercise-slug"},
    {"type": "progression", "targetId": "urn:slug:exercise-slug"},
    {"type": "equipmentVariant", "targetId": "urn:slug:exercise-slug"},
    {"type": "accessory", "targetId": "urn:slug:exercise-slug"},
    {"type": "mobilityPrep", "targetId": "urn:slug:exercise-slug"},
    {"type": "similarPattern", "targetId": "urn:slug:exercise-slug"}
  ],
  "metrics": {
    "primary": {"type": "reps|duration|distance", "unit": "count|s|m"},
    "secondary": [
      {"type": "weight|tempo|rpe|rest|speed", "unit": "kg|count|s|km/h"}
    ]
  }
}

IMPORTANT:
- Use realistic exercise slugs for relations (e.g., "goblet-squat", "front-squat")
- Use standard muscle IDs: mus.quadriceps, mus.glutes, mus.hamstrings, mus.lats, mus.pectorals, mus.deltoids, mus.triceps, mus.biceps, mus.abs, mus.obliques, mus.erectorSpinae, etc.
- Use standard category IDs: cat.legs, cat.back, cat.chest, cat.shoulders, cat.arms, cat.core
- Use standard equipment IDs: eq.barbell, eq.dumbbell, eq.cable, eq.machine, eq.bench, eq.rack, eq.mat, eq.band, eq.kettlebell
- Provide 8-12 relations covering different relationship types
- Be specific and technically accurate`;
}
var FIELD_PROMPTS = {
  "exercise-description": (ctx) => `
Generate a professional exercise description for: ${ctx.name}
Context: ${ctx.target ? `targets ${ctx.target}` : ""} ${ctx.equipment ? `using ${ctx.equipment}` : ""}

Return JSON: {"description": "1-2 sentence description emphasizing movement pattern and primary benefits"}`,
  "exercise-aliases": (ctx) => `
List common alternative names for: ${ctx.name}

Return JSON: {"aliases": ["3-5 alternative names commonly used by trainers and athletes"]}`,
  "exercise-classification": (ctx) => `
Classify this exercise: ${ctx.name}
${ctx.target ? `Target: ${ctx.target}` : ""}
${ctx.equipment ? `Equipment: ${ctx.equipment}` : ""}

Return JSON with classification data:
{
  "exerciseType": "strength|cardio|flexibility|balance|plyometric",
  "movement": "squat|hinge|push|pull|lunge|carry|rotation|core-anti-extension|other",
  "mechanics": "compound|isolation",
  "force": "push|pull|static|dynamic",
  "level": "beginner|intermediate|advanced",
  "unilateral": true|false,
  "kineticChain": "open|closed"
}`,
  "exercise-tags": (ctx) => `
Generate relevant tags for: ${ctx.name}
${ctx.equipment ? `Equipment: ${ctx.equipment}` : ""}
${ctx.bodyPart ? `Body part: ${ctx.bodyPart}` : ""}

Return JSON: {"tags": ["6-10 relevant tags like bilateral, freeWeight, barbell, kneeDominant, upperBody, compound, etc."]}`,
  "exercise-muscles": (ctx) => `
Identify secondary muscles for: ${ctx.name}
${ctx.target ? `Primary target: ${ctx.target}` : ""}

Return JSON with secondary muscles activated:
{
  "secondary": [
    {"id": "mus.muscleName", "name": "Muscle Name", "categoryId": "cat.category"}
  ]
}

Use standard IDs: mus.quadriceps, mus.glutes, mus.hamstrings, mus.lats, mus.pectorals, mus.deltoids, mus.triceps, mus.biceps, mus.abs, mus.obliques, mus.erectorSpinae, mus.adductors, mus.calves, mus.forearms, mus.traps, mus.rhomboids, mus.serratus
Categories: cat.legs, cat.back, cat.chest, cat.shoulders, cat.arms, cat.core`,
  "exercise-constraints": (ctx) => `
Identify constraints for: ${ctx.name}

Return JSON:
{
  "contraindications": ["3-4 specific medical/injury conditions making this exercise inadvisable"],
  "prerequisites": ["3-4 movement competencies required before attempting"],
  "progressions": ["4-5 harder variations"],
  "recessions": ["4-5 easier variations"]
}`,
  "exercise-relations": (ctx) => `
Identify related exercises for: ${ctx.name}

Return JSON with 8-12 relations:
{
  "relations": [
    {"type": "alternate", "targetId": "urn:slug:exercise-slug"},
    {"type": "regression", "targetId": "urn:slug:exercise-slug"},
    {"type": "progression", "targetId": "urn:slug:exercise-slug"},
    {"type": "equipmentVariant", "targetId": "urn:slug:exercise-slug"},
    {"type": "accessory", "targetId": "urn:slug:exercise-slug"},
    {"type": "mobilityPrep", "targetId": "urn:slug:exercise-slug"},
    {"type": "similarPattern", "targetId": "urn:slug:exercise-slug"}
  ]
}

Use realistic slugs like: goblet-squat, front-squat, leg-press, romanian-deadlift, etc.`,
  "exercise-metrics": (ctx) => `
Determine appropriate metrics for: ${ctx.name}

Return JSON:
{
  "primary": {"type": "reps|duration|distance", "unit": "count|s|m"},
  "secondary": [
    {"type": "weight|tempo|rpe|rest|speed|incline", "unit": "kg|count|s|km/h|%"}
  ]
}`,
  "exercise-localization": (ctx) => `
Translate exercise data for: ${ctx.name}

Return JSON with Serbian (sr) and Spanish (es) translations:
{
  "localized": [
    {
      "lang": "sr",
      "name": "Serbian name using Cyrillic script",
      "description": "Serbian description",
      "aliases": ["2-3 Serbian alternative names"]
    },
    {
      "lang": "es",
      "name": "Spanish name",
      "description": "Spanish description", 
      "aliases": ["2-3 Spanish alternative names"]
    }
  ]
}`
};

// src/ai/prompts/tier-prompts.ts
init_esm_shims();
var SCHEMA_ENUMS = {
  exerciseType: ["strength", "cardio", "flexibility", "balance", "plyometric"],
  level: ["beginner", "intermediate", "advanced"],
  movement: [
    "squat",
    "hinge",
    "lunge",
    "push-horizontal",
    "push-vertical",
    "pull-horizontal",
    "pull-vertical",
    "carry",
    "core-anti-extension",
    "core-anti-rotation",
    "rotation",
    "locomotion",
    "isolation",
    "other"
  ],
  mechanics: ["compound", "isolation"],
  force: ["push", "pull", "static", "mixed"],
  kineticChain: ["open", "closed", "mixed"],
  relationType: [
    "alternate",
    "variation",
    "substitute",
    "progression",
    "regression",
    "equipmentVariant",
    "accessory",
    "mobilityPrep",
    "similarPattern",
    "unilateralPair",
    "contralateralPair"
  ],
  metricType: [
    "reps",
    "weight",
    "duration",
    "distance",
    "speed",
    "pace",
    "power",
    "heartRate",
    "steps",
    "calories",
    "height",
    "tempo",
    "rpe"
  ],
  metricUnit: [
    "count",
    "kg",
    "lb",
    "s",
    "min",
    "m",
    "km",
    "mi",
    "m_s",
    "km_h",
    "min_per_km",
    "min_per_mi",
    "W",
    "bpm",
    "kcal",
    "cm",
    "in"
  ]
};
var SYSTEM_PROMPTS = {
  simple: `You are a fitness data specialist helping to enrich exercise metadata for a fitness application database.

Your role is to provide accurate, concise information for basic exercise fields. Focus on:
- Clear, actionable descriptions
- Common alternative names (aliases)
- Appropriate difficulty levels
- Standard exercise classifications
- Relevant metrics for tracking

Always respond with valid JSON matching the requested schema. Be consistent and precise.`,
  medium: `You are an exercise science specialist with expertise in movement assessment and programming.

Your role is to analyze exercise requirements and relationships. Focus on:
- Safety considerations and contraindications
- Movement prerequisites and competency requirements
- Logical progressions and regressions
- Exercise relationships and substitutes

Consider the full context of each exercise including equipment, primary muscles, and movement patterns.
Always respond with valid JSON matching the requested schema. Prioritize safety and evidence-based recommendations.`,
  complex: `You are a biomechanics expert with deep knowledge of human movement, kinesiology, and exercise physiology.

Your role is to provide precise biomechanical classifications and muscle targeting analysis. Focus on:
- Accurate movement pattern classification based on joint actions
- Force vector and kinetic chain analysis
- Primary and secondary muscle recruitment patterns
- Compound vs isolation mechanics

Use your expertise to make nuanced distinctions. Consider muscle activation patterns, joint involvement, and force directions.
Always respond with valid JSON matching the requested schema. Accuracy is paramount - when uncertain, choose the most defensible classification.`
};
var SIMPLE_TIER_PROMPTS = {
  description: {
    id: "description",
    fields: ["canonical.description"],
    template: `Generate a clear, professional description for each exercise.

The description should:
- Be 1-3 sentences
- Explain what the exercise is and its primary benefit
- Use active voice
- Be suitable for a fitness app

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { "slug": "exercise-slug", "description": "..." },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "description": string }] }'
  },
  aliases: {
    id: "aliases",
    fields: ["canonical.aliases"],
    template: `Generate common alternative names (aliases) for each exercise.

Include:
- Gym slang and informal names
- Regional variations
- Equipment-specific names if applicable
- Maximum 5 aliases per exercise

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { "slug": "exercise-slug", "aliases": ["alias1", "alias2", ...] },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "aliases": string[] }] }'
  },
  "classification-simple": {
    id: "classification-simple",
    fields: ["classification.exerciseType", "classification.level", "classification.unilateral"],
    template: `Classify each exercise with basic attributes.

For exerciseType, choose from: ${SCHEMA_ENUMS.exerciseType.join(", ")}
For level, choose from: ${SCHEMA_ENUMS.level.join(", ")}
For unilateral, determine if the exercise works one side at a time (true/false)

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "exerciseType": "strength|cardio|flexibility|balance|plyometric",
      "level": "beginner|intermediate|advanced",
      "unilateral": true|false
    },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "exerciseType": string, "level": string, "unilateral": boolean }] }'
  },
  metrics: {
    id: "metrics",
    fields: ["metrics.primary", "metrics.secondary"],
    template: `Determine the appropriate tracking metrics for each exercise.

For metric types, choose from: ${SCHEMA_ENUMS.metricType.join(", ")}
For metric units, choose appropriate unit for the type.

Primary metric: The main way to track this exercise
Secondary metrics: Additional useful metrics (0-3)

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "primary": { "type": "reps|weight|duration|...", "unit": "count|kg|s|..." },
      "secondary": [
        { "type": "...", "unit": "..." }
      ]
    },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "primary": { "type": string, "unit": string }, "secondary": [{ "type": string, "unit": string }] }] }'
  },
  equipment: {
    id: "equipment",
    fields: ["equipment.optional"],
    template: `Identify optional equipment that can enhance each exercise.

Consider equipment that:
- Can add resistance or difficulty
- Provides support or stability
- Enables variations of the exercise

Exercises (with their required equipment noted):
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "optional": [
        { "id": "equipment-id", "name": "Equipment Name" }
      ]
    },
    ...
  ]
}

Use standardized equipment names like: dumbbell, barbell, kettlebell, resistance-band, cable-machine, bench, stability-ball, foam-roller, etc.`,
    outputSchema: '{ "results": [{ "slug": string, "optional": [{ "id": string, "name": string }] }] }'
  }
};
var MEDIUM_TIER_PROMPTS = {
  constraints: {
    id: "constraints",
    fields: [
      "constraints.contraindications",
      "constraints.prerequisites",
      "constraints.progressions",
      "constraints.regressions"
    ],
    template: `Analyze each exercise and determine its constraints.

Contraindications: Medical conditions or situations where this exercise should be avoided
Prerequisites: Exercises or abilities needed before attempting this exercise
Progressions: More challenging variations to progress to
Regressions: Easier variations for those not ready for this exercise

Be specific and evidence-based. Use exercise slugs for progressions/regressions when referencing other exercises.

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "contraindications": ["condition1", "condition2"],
      "prerequisites": ["prerequisite-exercise-slug", "ability or skill"],
      "progressions": ["harder-exercise-slug", "harder-variation"],
      "regressions": ["easier-exercise-slug", "easier-variation"]
    },
    ...
  ]
}`,
    outputSchema: '{ "results": [{ "slug": string, "contraindications": string[], "prerequisites": string[], "progressions": string[], "regressions": string[] }] }'
  },
  relations: {
    id: "relations",
    fields: ["relations"],
    template: `Identify relationships between each exercise and other exercises.

Relation types: ${SCHEMA_ENUMS.relationType.join(", ")}

- alternate: Can be used interchangeably
- variation: A variant of the same base movement
- substitute: Can replace when equipment unavailable
- progression: A harder version
- regression: An easier version
- equipmentVariant: Same movement, different equipment
- accessory: Supports or complements this exercise
- mobilityPrep: Mobility work that prepares for this exercise
- similarPattern: Uses similar movement pattern
- unilateralPair: Single-limb version
- contralateralPair: Opposite-side movement

Exercises:
{{exercises}}

Respond with JSON:
{
  "results": [
    { 
      "slug": "exercise-slug",
      "relations": [
        { "type": "variation", "targetId": "related-exercise-slug", "confidence": 0.9, "notes": "optional note" }
      ]
    },
    ...
  ]
}

Confidence should be 0.0-1.0. Only include relations you're confident about (>0.7).`,
    outputSchema: '{ "results": [{ "slug": string, "relations": [{ "type": string, "targetId": string, "confidence": number, "notes"?: string }] }] }'
  }
};
var COMPLEX_TIER_PROMPTS = {
  biomechanics: {
    id: "biomechanics",
    fields: [
      "classification.movement",
      "classification.mechanics",
      "classification.force",
      "classification.kineticChain",
      "classification.tags",
      "targets.secondary"
    ],
    template: `Perform a detailed biomechanical analysis of this exercise.

Movement patterns: ${SCHEMA_ENUMS.movement.join(", ")}
Mechanics: ${SCHEMA_ENUMS.mechanics.join(", ")}
Force: ${SCHEMA_ENUMS.force.join(", ")}
Kinetic chain: ${SCHEMA_ENUMS.kineticChain.join(", ")}

Movement classification guidance:
- squat: Knee-dominant bilateral lowering (squats, leg press)
- hinge: Hip-dominant posterior chain (deadlifts, good mornings)
- lunge: Single-leg knee-dominant (lunges, step-ups, split squats)
- push-horizontal: Pushing away from body horizontally (bench press, push-ups)
- push-vertical: Pushing overhead (shoulder press, pike push-ups)
- pull-horizontal: Pulling toward body horizontally (rows)
- pull-vertical: Pulling from overhead (pull-ups, lat pulldown)
- carry: Loaded locomotion (farmer's walk, suitcase carry)
- core-anti-extension: Resisting spinal extension (planks, rollouts)
- core-anti-rotation: Resisting rotation (Pallof press, bird dogs)
- rotation: Active rotation (Russian twists, woodchops)
- locomotion: Cyclical movement patterns (running, cycling)
- isolation: Single-joint movements (curls, extensions, raises)
- other: Doesn't fit above patterns

Mechanics guidance:
- compound: Multiple joints involved
- isolation: Single joint involved

Force guidance:
- push: Force directed away from body
- pull: Force directed toward body
- static: Isometric, no movement
- mixed: Combination of force vectors

Kinetic chain guidance:
- closed: Distal segment (hand/foot) fixed (push-ups, squats)
- open: Distal segment free (leg curls, chest fly)
- mixed: Elements of both

Exercise:
{{exercise}}

Primary targets: {{primaryTargets}}
Required equipment: {{equipment}}

Respond with JSON:
{
  "movement": "squat|hinge|lunge|push-horizontal|...",
  "mechanics": "compound|isolation",
  "force": "push|pull|static|mixed",
  "kineticChain": "open|closed|mixed",
  "tags": ["tag1", "tag2"],
  "secondary": [
    { "id": "muscle-id", "name": "Muscle Name" }
  ]
}

For tags, include relevant descriptors like: "upper-body", "lower-body", "core", "stability", "power", "strength", "endurance", "mobility", etc.
For secondary targets, list muscles that assist but are not the primary focus. Use anatomical muscle names.`,
    outputSchema: '{ "movement": string, "mechanics": string, "force": string, "kineticChain": string, "tags": string[], "secondary": [{ "id": string, "name": string }] }'
  }
};
function formatExercisesForPrompt(exercises) {
  return exercises.map((ex, index) => {
    const parts = [`${index + 1}. ${ex.name} (slug: ${ex.slug})`];
    if (ex.description) {
      parts.push(`   Description: ${ex.description}`);
    }
    if (ex.primaryTargets && ex.primaryTargets.length > 0) {
      parts.push(`   Primary targets: ${ex.primaryTargets.map((t) => t.name).join(", ")}`);
    }
    if (ex.requiredEquipment && ex.requiredEquipment.length > 0) {
      parts.push(`   Equipment: ${ex.requiredEquipment.map((e) => e.name).join(", ")}`);
    }
    if (ex.exerciseType) {
      parts.push(`   Type: ${ex.exerciseType}`);
    }
    return parts.join("\n");
  }).join("\n\n");
}
function formatSingleExercise(exercise) {
  const parts = [`Name: ${exercise.name}`, `Slug: ${exercise.slug}`];
  if (exercise.description) {
    parts.push(`Description: ${exercise.description}`);
  }
  if (exercise.aliases && exercise.aliases.length > 0) {
    parts.push(`Aliases: ${exercise.aliases.join(", ")}`);
  }
  if (exercise.exerciseType) {
    parts.push(`Exercise type: ${exercise.exerciseType}`);
  }
  return parts.join("\n");
}
function getPromptTemplate(tier, promptId) {
  switch (tier) {
    case "simple":
      return SIMPLE_TIER_PROMPTS[promptId];
    case "medium":
      return MEDIUM_TIER_PROMPTS[promptId];
    case "complex":
      return COMPLEX_TIER_PROMPTS[promptId];
    default:
      return void 0;
  }
}
function buildTierPrompt(tier, promptId, exercises) {
  const template2 = getPromptTemplate(tier, promptId);
  if (!template2) {
    return void 0;
  }
  const system = SYSTEM_PROMPTS[tier];
  let user = template2.template;
  if (tier === "complex") {
    const exercise = exercises[0];
    if (!exercise) {
      return void 0;
    }
    user = user.replace("{{exercise}}", formatSingleExercise(exercise));
    if (exercise.primaryTargets && exercise.primaryTargets.length > 0) {
      user = user.replace(
        "{{primaryTargets}}",
        exercise.primaryTargets.map((t) => t.name).join(", ")
      );
    } else {
      user = user.replace("{{primaryTargets}}", "Not specified");
    }
    if (exercise.requiredEquipment && exercise.requiredEquipment.length > 0) {
      user = user.replace(
        "{{equipment}}",
        exercise.requiredEquipment.map((e) => e.name).join(", ")
      );
    } else {
      user = user.replace("{{equipment}}", "Bodyweight / None");
    }
  } else {
    user = user.replace("{{exercises}}", formatExercisesForPrompt(exercises));
  }
  return {
    system,
    user,
    fields: template2.fields,
    tier
  };
}

// src/ai/enrichment-engine.ts
var DEFAULT_TIER_CONFIGS = {
  simple: {
    model: "anthropic/claude-haiku-4.5",
    temperature: 0.1,
    maxTokens: 800,
    batchSize: 10,
    priority: "speed"
  },
  medium: {
    model: "anthropic/claude-sonnet-4.5",
    temperature: 0.1,
    maxTokens: 1500,
    batchSize: 3,
    priority: "balanced"
  },
  complex: {
    model: "anthropic/claude-opus-4.5",
    temperature: 0.1,
    maxTokens: 2e3,
    batchSize: 1,
    priority: "accuracy"
  }
};
var DEFAULT_FALLBACK_CONFIG = {
  retries: 1,
  degradeModel: true,
  useDefaults: true,
  degradeChain: {
    complex: "medium",
    medium: "simple",
    simple: null
  }
};
var TOKEN_ESTIMATES = {
  simple: { inputPerExercise: 80, outputPerExercise: 40 },
  medium: { inputPerExercise: 333, outputPerExercise: 267 },
  complex: { inputPerExercise: 600, outputPerExercise: 400 }
};
var MODEL_PRICING = {
  "anthropic/claude-haiku-4.5": { input: 0.25, output: 1.25 },
  "anthropic/claude-sonnet-4.5": { input: 3, output: 15 },
  "anthropic/claude-opus-4.5": { input: 15, output: 75 },
  // Fallback for unknown models
  default: { input: 3, output: 15 }
};
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  const minutes = Math.floor(ms / 6e4);
  const seconds = Math.floor(ms % 6e4 / 1e3);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
var EnrichmentEngine = class {
  provider = null;
  config;
  rateLimiter = null;
  constructor(config = {}) {
    this.config = {
      enabled: true,
      provider: "openrouter",
      model: "anthropic/claude-3.5-sonnet",
      ...config
    };
    if (this.config.enabled) {
      this.initializeProvider();
    }
  }
  /**
   * Initialize the AI provider
   */
  initializeProvider() {
    const apiKey = this.config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("No API key provided for AI enrichment. Enrichment will be skipped.");
      return;
    }
    if (this.config.tiers || this.config.rateLimit) {
      const rateLimitConfig = this.config.rateLimit || DEFAULT_RATE_LIMIT_CONFIG;
      this.rateLimiter = new RateLimiter(rateLimitConfig);
    }
    switch (this.config.provider) {
      case "openrouter":
        this.provider = new OpenRouterProvider({
          apiKey,
          model: this.config.model,
          baseUrl: this.config.baseUrl,
          rateLimiter: this.rateLimiter ?? void 0,
          ...this.config.options
        });
        break;
      default:
        console.warn(`Unknown AI provider: ${this.config.provider}`);
    }
  }
  // ==========================================================================
  // Tiered Batch Enrichment (New Primary API)
  // ==========================================================================
  /**
   * Enrich multiple exercises using tiered processing
   *
   * This is the main entry point for batch enrichment. It:
   * 1. Groups fields by tier based on configuration
   * 2. Processes each tier in order (simple -> medium -> complex)
   * 3. Batches exercises per tier's batchSize
   * 4. Handles errors with fallback chain
   * 5. Saves progress to checkpoint for resumability
   *
   * @param exercises - Array of exercises to enrich
   * @param options - Enrichment options
   * @returns Batch enrichment result
   */
  async enrichBatch(exercises, options = {}) {
    const startTime = Date.now();
    const results = /* @__PURE__ */ new Map();
    const failedIds = [];
    const errors = [];
    let apiCalls = 0;
    let tokensUsed = 0;
    const debug = process.env.DEBUG_ENRICHMENT === "true";
    if (debug) {
      console.log(`[DEBUG enrichBatch] config.enabled: ${this.config.enabled}, provider: ${!!this.provider}`);
      console.log(`[DEBUG enrichBatch] exercises count: ${exercises.length}`);
    }
    if (!this.config.enabled || !this.provider) {
      if (debug) {
        console.log(`[DEBUG enrichBatch] EARLY RETURN - enrichment disabled or no provider`);
      }
      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors
      };
    }
    if (debug) {
      console.log(`[DEBUG enrichBatch] config.tiers: ${!!this.config.tiers}, config.fields: ${!!this.config.fields}`);
    }
    if (!this.config.tiers || !this.config.fields) {
      for (const exercise of exercises) {
        try {
          const result = await this.enrichComprehensive({
            source: exercise,
            target: {},
            field: "",
            registries: { muscles: [], equipment: [], muscleCategories: [] },
            config: {}
          });
          if (result.success && result.data) {
            results.set(exercise.id, result.data);
          } else {
            failedIds.push(exercise.id);
            errors.push({ exerciseId: exercise.id, error: result.error || "Unknown error" });
          }
        } catch (error) {
          failedIds.push(exercise.id);
          errors.push({
            exerciseId: exercise.id,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors
      };
    }
    let checkpointManager = null;
    const checkpointConfig = this.config.checkpoint;
    const outputDir = options.outputDirectory || process.cwd();
    if (checkpointConfig?.enabled) {
      checkpointManager = new CheckpointManager(outputDir, checkpointConfig);
      if (options.resume && checkpointManager.exists()) {
        const existingData = checkpointManager.load();
        if (existingData) {
          const validation = checkpointManager.validate(this.config);
          if (validation.valid) {
            const checkpointResults = checkpointManager.getAllResults();
            for (const [exerciseId, tierResults] of Object.entries(checkpointResults)) {
              const merged = {};
              for (const fields of Object.values(tierResults)) {
                Object.assign(merged, fields);
              }
              results.set(exerciseId, merged);
            }
          } else {
            console.warn(`Checkpoint invalid: ${validation.reason}. Starting fresh.`);
            checkpointManager.clear();
          }
        }
      }
      if (!checkpointManager.getData()) {
        checkpointManager.initialize({
          inputFile: "batch-enrichment",
          totalExercises: exercises.length,
          config: this.config
        });
      }
    }
    const completedIds = new Set(checkpointManager?.getCompletedIds() ?? []);
    const exercisesToProcess = exercises.filter((e) => !completedIds.has(e.id));
    if (exercisesToProcess.length === 0) {
      return {
        results,
        failedIds,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime,
        errors
      };
    }
    const fieldsByTier = this.groupFieldsByTier();
    const tiersToProcess = options.tierFilter ? [options.tierFilter] : ["simple", "medium", "complex"];
    if (debug) {
      console.log(`[DEBUG enrichBatch] tiersToProcess: ${tiersToProcess.join(", ")}`);
      console.log(`[DEBUG enrichBatch] fieldsByTier keys: ${[...fieldsByTier.keys()].join(", ")}`);
    }
    for (const tier of tiersToProcess) {
      const tierFields = fieldsByTier.get(tier);
      if (debug) {
        console.log(`[DEBUG enrichBatch] tier: ${tier}, fields: ${tierFields ? [...tierFields.keys()].join(", ") : "none"}`);
      }
      if (!tierFields || tierFields.size === 0) {
        if (debug) {
          console.log(`[DEBUG enrichBatch] SKIPPING tier ${tier} - no fields`);
        }
        continue;
      }
      const tierConfig = this.getTierConfig(tier);
      const batches = this.createBatches(exercisesToProcess, tierConfig.batchSize);
      if (checkpointManager) {
        const data = checkpointManager.getData();
        if (data) {
          data.currentTier = tier;
        }
      }
      for (const batch of batches) {
        try {
          const batchResult = await this.processTierBatch(
            tier,
            tierConfig,
            batch,
            tierFields,
            options.onProgress,
            checkpointManager
          );
          if (debug) {
            console.log(`[DEBUG enrichBatch] batchResult.results.size: ${batchResult.results.size}, apiCalls: ${batchResult.apiCalls}`);
          }
          for (const [exerciseId, fields] of batchResult.results) {
            const existing = results.get(exerciseId) || {};
            results.set(exerciseId, { ...existing, ...fields });
            if (debug) {
              console.log(`[DEBUG enrichBatch] Merged result for ${exerciseId}`);
            }
            if (checkpointManager) {
              checkpointManager.update({
                exerciseId,
                success: true,
                currentTier: tier,
                results: { [tier]: fields }
              });
            }
          }
          for (const id of batchResult.failedIds) {
            if (!failedIds.includes(id)) {
              failedIds.push(id);
            }
          }
          apiCalls += batchResult.apiCalls;
          tokensUsed += batchResult.tokensUsed;
          errors.push(...batchResult.errors);
          if (debug) {
            console.log(`[DEBUG enrichBatch] Updated totals - apiCalls: ${apiCalls}, tokensUsed: ${tokensUsed}`);
          }
        } catch (error) {
          for (const exercise of batch.exercises) {
            if (!failedIds.includes(exercise.id)) {
              failedIds.push(exercise.id);
              errors.push({
                exerciseId: exercise.id,
                error: error instanceof Error ? error.message : "Unknown error",
                tier
              });
            }
          }
        }
      }
    }
    if (checkpointManager && failedIds.length === 0) {
      checkpointManager.clear();
    } else if (checkpointManager) {
      checkpointManager.forceSave();
    }
    return {
      results,
      failedIds,
      apiCalls,
      tokensUsed,
      durationMs: Date.now() - startTime,
      errors
    };
  }
  /**
   * Estimate cost for batch enrichment
   */
  estimateCost(exerciseCount) {
    const tiers = this.config.tiers || DEFAULT_TIER_CONFIGS;
    const fields = this.config.fields || {};
    const fieldCounts = { simple: 0, medium: 0, complex: 0 };
    for (const fieldConfig of Object.values(fields)) {
      fieldCounts[fieldConfig.tier]++;
    }
    const tierEstimates = {};
    let totalApiCalls = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    for (const tierName of ["simple", "medium", "complex"]) {
      const tierConfig = tiers[tierName] || DEFAULT_TIER_CONFIGS[tierName];
      const tokenEstimate = TOKEN_ESTIMATES[tierName];
      const pricing = MODEL_PRICING[tierConfig.model] || MODEL_PRICING["default"];
      const apiCalls = Math.ceil(exerciseCount / tierConfig.batchSize);
      const inputTokens = exerciseCount * tokenEstimate.inputPerExercise;
      const outputTokens = exerciseCount * tokenEstimate.outputPerExercise;
      const cost = inputTokens / 1e6 * pricing.input + outputTokens / 1e6 * pricing.output;
      tierEstimates[tierName] = {
        tier: tierName,
        model: tierConfig.model,
        batchSize: tierConfig.batchSize,
        apiCalls,
        inputTokens,
        outputTokens,
        cost: Math.round(cost * 100) / 100
      };
      totalApiCalls += apiCalls;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCost += cost;
    }
    const requestsPerMinute = this.config.rateLimit?.requestsPerMinute || 50;
    const estimatedMinutes = totalApiCalls / requestsPerMinute;
    return {
      tiers: tierEstimates,
      total: {
        apiCalls: totalApiCalls,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: Math.round(totalCost * 100) / 100
      },
      estimatedTime: {
        minutes: Math.round(estimatedMinutes),
        formatted: formatDuration(estimatedMinutes * 6e4)
      },
      disclaimer: "Costs are estimates based on average token usage. Actual costs may vary by \xB120%."
    };
  }
  /**
   * Group configured fields by their tier
   */
  groupFieldsByTier() {
    const result = /* @__PURE__ */ new Map();
    result.set("simple", /* @__PURE__ */ new Map());
    result.set("medium", /* @__PURE__ */ new Map());
    result.set("complex", /* @__PURE__ */ new Map());
    if (!this.config.fields) {
      return result;
    }
    for (const [fieldPath, fieldConfig] of Object.entries(this.config.fields)) {
      const tierMap = result.get(fieldConfig.tier);
      if (tierMap) {
        tierMap.set(fieldPath, fieldConfig);
      }
    }
    return result;
  }
  /**
   * Get tier configuration, merging with defaults
   */
  getTierConfig(tier) {
    const defaultConfig = DEFAULT_TIER_CONFIGS[tier];
    const customConfig = this.config.tiers?.[tier];
    if (!customConfig) {
      return defaultConfig;
    }
    return { ...defaultConfig, ...customConfig };
  }
  /**
   * Get fallback configuration
   */
  getFallbackConfig() {
    return this.config.fallback || DEFAULT_FALLBACK_CONFIG;
  }
  /**
   * Create batches of exercises for processing
   */
  createBatches(exercises, batchSize) {
    const batches = [];
    const totalBatches = Math.ceil(exercises.length / batchSize);
    for (let i = 0; i < exercises.length; i += batchSize) {
      batches.push({
        exercises: exercises.slice(i, i + batchSize),
        batchNumber: batches.length + 1,
        totalBatches
      });
    }
    return batches;
  }
  /**
   * Process a batch of exercises for a specific tier
   */
  async processTierBatch(tier, tierConfig, batch, fields, onProgress, _checkpointManager) {
    const startTime = Date.now();
    const results = /* @__PURE__ */ new Map();
    const failedIds = [];
    const errors = [];
    let apiCalls = 0;
    let tokensUsed = 0;
    if (!this.provider) {
      return {
        results,
        failedIds: batch.exercises.map((e) => e.id),
        apiCalls: 0,
        tokensUsed: 0,
        durationMs: 0,
        errors: [{ exerciseId: "batch", error: "No AI provider available", tier }]
      };
    }
    const promptIds = /* @__PURE__ */ new Set();
    for (const fieldConfig of fields.values()) {
      promptIds.add(fieldConfig.prompt);
    }
    const exerciseContexts = batch.exercises.map((e) => ({
      name: e.name,
      slug: e.slug,
      description: e.description,
      primaryTargets: e.primaryTargets,
      requiredEquipment: e.requiredEquipment,
      exerciseType: e.exerciseType
    }));
    const debug = process.env.DEBUG_ENRICHMENT === "true";
    if (debug) {
      console.log(`[DEBUG processTierBatch] tier: ${tier}, promptIds: ${[...promptIds].join(", ")}`);
    }
    for (const promptId of promptIds) {
      const builtPrompt = buildTierPrompt(tier, promptId, exerciseContexts);
      if (!builtPrompt) {
        if (debug) {
          console.log(`[DEBUG processTierBatch] NO PROMPT BUILT for promptId: ${promptId}`);
        }
        continue;
      }
      if (debug) {
        console.log(`[DEBUG processTierBatch] Built prompt for promptId: ${promptId}`);
      }
      if (onProgress) {
        const exercise = batch.exercises[0];
        onProgress({
          exercise: {
            current: batch.batchNumber,
            total: batch.totalBatches,
            name: exercise.name,
            slug: exercise.slug
          },
          tier: {
            name: tier,
            status: "processing",
            batchNumber: batch.batchNumber,
            totalBatches: batch.totalBatches
          },
          overall: {
            percentage: batch.batchNumber / batch.totalBatches * 100,
            elapsedMs: Date.now() - startTime,
            elapsedFormatted: formatDuration(Date.now() - startTime),
            remainingMs: 0,
            remainingFormatted: "calculating...",
            apiCalls,
            errors: errors.length
          }
        });
      }
      try {
        if (this.provider instanceof OpenRouterProvider) {
          this.provider.setModel(tierConfig.model);
        }
        if (debug) {
          console.log(`[DEBUG processTierBatch] Calling API for promptId: ${promptId}, model: ${tierConfig.model}`);
        }
        const response = await this.callWithFallback(tier, builtPrompt, tierConfig);
        apiCalls++;
        tokensUsed += response.tokensUsed || 0;
        if (debug) {
          console.log(`[DEBUG processTierBatch] API response received, tokens: ${response.tokensUsed}`);
          console.log(`[DEBUG processTierBatch] Response content (first 300 chars): ${response.content.slice(0, 300)}`);
        }
        const parsedResults = this.parseResponse(response.content, batch.exercises, promptId);
        if (debug) {
          console.log(`[DEBUG processTierBatch] Parsed results count: ${parsedResults.size}`);
        }
        for (const [exerciseId, fieldValues] of parsedResults) {
          const existing = results.get(exerciseId) || {};
          results.set(exerciseId, { ...existing, ...fieldValues });
          if (debug) {
            console.log(`[DEBUG processTierBatch] Set result for ${exerciseId}: ${JSON.stringify(fieldValues).slice(0, 200)}`);
          }
        }
      } catch (error) {
        if (debug) {
          console.error(`[DEBUG processTierBatch] ERROR for promptId ${promptId}:`, error);
        }
        for (const exercise of batch.exercises) {
          if (!failedIds.includes(exercise.id)) {
            failedIds.push(exercise.id);
          }
          errors.push({
            exerciseId: exercise.id,
            error: error instanceof Error ? error.message : "Unknown error",
            tier
          });
        }
      }
    }
    return {
      results,
      failedIds,
      apiCalls,
      tokensUsed,
      durationMs: Date.now() - startTime,
      errors
    };
  }
  /**
   * Call API with fallback on errors
   */
  async callWithFallback(tier, prompt, tierConfig, attemptNumber = 0) {
    const fallbackConfig = this.getFallbackConfig();
    if (!this.provider) {
      throw new Error("No AI provider available");
    }
    try {
      const response = await this.provider.complete(prompt.user, {
        systemPrompt: prompt.system,
        temperature: tierConfig.temperature,
        maxTokens: tierConfig.maxTokens
      });
      return { content: response.content, tokensUsed: response.tokensUsed };
    } catch (error) {
      if (attemptNumber < fallbackConfig.retries) {
        return this.callWithFallback(tier, prompt, tierConfig, attemptNumber + 1);
      }
      if (fallbackConfig.degradeModel) {
        const degradeTier = fallbackConfig.degradeChain[tier];
        if (degradeTier) {
          const degradeConfig = this.getTierConfig(degradeTier);
          if (this.provider instanceof OpenRouterProvider) {
            this.provider.setModel(degradeConfig.model);
          }
          const degradedPrompt = {
            system: SYSTEM_PROMPTS[degradeTier],
            user: prompt.user
          };
          return this.callWithFallback(degradeTier, degradedPrompt, degradeConfig, 0);
        }
      }
      throw error;
    }
  }
  /**
   * Parse API response and map to exercises
   */
  parseResponse(content, exercises, promptId) {
    const results = /* @__PURE__ */ new Map();
    const debug = process.env.DEBUG_ENRICHMENT === "true";
    if (debug) {
      console.log(`
[DEBUG parseResponse] promptId: ${promptId}`);
      console.log(`[DEBUG parseResponse] exercises: ${exercises.map((e) => e.slug).join(", ")}`);
      console.log(`[DEBUG parseResponse] raw content (first 500 chars):
${content.slice(0, 500)}`);
    }
    try {
      let jsonStr = content.trim();
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
        if (debug) {
          console.log(`[DEBUG parseResponse] extracted from code block`);
        }
      }
      if (debug) {
        console.log(`[DEBUG parseResponse] jsonStr to parse (first 500 chars):
${jsonStr.slice(0, 500)}`);
      }
      const parsed = JSON.parse(jsonStr);
      if (debug) {
        console.log(`[DEBUG parseResponse] parsed successfully, keys: ${Object.keys(parsed).join(", ")}`);
        if (parsed.results) {
          console.log(`[DEBUG parseResponse] results array length: ${parsed.results.length}`);
          console.log(`[DEBUG parseResponse] results slugs: ${parsed.results.map((r) => r.slug).join(", ")}`);
        }
      }
      if (parsed.results && Array.isArray(parsed.results)) {
        for (const result of parsed.results) {
          const slug = result.slug;
          const exercise = exercises.find((e) => e.slug === slug);
          if (debug) {
            console.log(`[DEBUG parseResponse] looking for slug "${slug}" -> found: ${!!exercise}`);
          }
          if (exercise) {
            const { slug: _slug, ...fields } = result;
            const mapped = this.mapFieldsFromPrompt(promptId, fields);
            if (debug) {
              console.log(`[DEBUG parseResponse] mapped fields for ${exercise.id}:`, JSON.stringify(mapped, null, 2));
            }
            results.set(exercise.id, mapped);
          }
        }
      } else {
        const exercise = exercises[0];
        if (exercise) {
          const mapped = this.mapFieldsFromPrompt(promptId, parsed);
          if (debug) {
            console.log(`[DEBUG parseResponse] single exercise mapped:`, JSON.stringify(mapped, null, 2));
          }
          results.set(exercise.id, mapped);
        }
      }
    } catch (err) {
      console.warn("Failed to parse API response:", content.slice(0, 200));
      if (debug) {
        console.error(`[DEBUG parseResponse] parse error:`, err);
      }
    }
    if (debug) {
      console.log(`[DEBUG parseResponse] final results count: ${results.size}`);
    }
    return results;
  }
  /**
   * Map parsed fields to proper FDS paths based on prompt type
   */
  mapFieldsFromPrompt(promptId, fields) {
    const mapped = {};
    switch (promptId) {
      case "description":
        if (fields.description) {
          this.setNestedValue(mapped, "canonical.description", fields.description);
        }
        break;
      case "aliases":
        if (fields.aliases) {
          this.setNestedValue(mapped, "canonical.aliases", fields.aliases);
        }
        break;
      case "classification-simple":
        if (fields.exerciseType) {
          this.setNestedValue(mapped, "classification.exerciseType", fields.exerciseType);
        }
        if (fields.level) {
          this.setNestedValue(mapped, "classification.level", fields.level);
        }
        if (fields.unilateral !== void 0) {
          this.setNestedValue(mapped, "classification.unilateral", fields.unilateral);
        }
        break;
      case "metrics":
        if (fields.primary) {
          this.setNestedValue(mapped, "metrics.primary", fields.primary);
        }
        if (fields.secondary) {
          this.setNestedValue(mapped, "metrics.secondary", fields.secondary);
        }
        break;
      case "equipment":
        if (fields.optional) {
          this.setNestedValue(mapped, "equipment.optional", fields.optional);
        }
        break;
      case "constraints":
        if (fields.contraindications) {
          this.setNestedValue(mapped, "constraints.contraindications", fields.contraindications);
        }
        if (fields.prerequisites) {
          this.setNestedValue(mapped, "constraints.prerequisites", fields.prerequisites);
        }
        if (fields.progressions) {
          this.setNestedValue(mapped, "constraints.progressions", fields.progressions);
        }
        if (fields.regressions) {
          this.setNestedValue(mapped, "constraints.regressions", fields.regressions);
        }
        break;
      case "relations":
        if (fields.relations) {
          this.setNestedValue(mapped, "relations", fields.relations);
        }
        break;
      case "biomechanics":
        if (fields.movement) {
          this.setNestedValue(mapped, "classification.movement", fields.movement);
        }
        if (fields.mechanics) {
          this.setNestedValue(mapped, "classification.mechanics", fields.mechanics);
        }
        if (fields.force) {
          this.setNestedValue(mapped, "classification.force", fields.force);
        }
        if (fields.kineticChain) {
          this.setNestedValue(mapped, "classification.kineticChain", fields.kineticChain);
        }
        if (fields.tags) {
          this.setNestedValue(mapped, "classification.tags", fields.tags);
        }
        if (fields.secondary) {
          this.setNestedValue(mapped, "targets.secondary", fields.secondary);
        }
        break;
      default:
        Object.assign(mapped, fields);
    }
    return mapped;
  }
  // ==========================================================================
  // Legacy API (Backwards Compatible)
  // ==========================================================================
  /**
   * Enrich mapped data with AI-generated content
   * Uses comprehensive single-call enrichment for efficiency
   * @deprecated Use enrichBatch for new code
   */
  async enrich(mapped, mappings, context) {
    if (!this.provider || !this.config.enabled) {
      return { success: true, data: {} };
    }
    const fieldsNeedingEnrichment = [];
    for (const [field, mapping] of Object.entries(mappings)) {
      const mappingObj = this.normalizeMapping(mapping);
      if (mappingObj.enrichment?.enabled) {
        const shouldEnrich = this.shouldEnrich(mapped, field, mappingObj.enrichment);
        if (shouldEnrich && !this.config.skipFields?.includes(field)) {
          fieldsNeedingEnrichment.push(field);
        }
      }
    }
    if (fieldsNeedingEnrichment.length === 0) {
      return { success: true, data: {} };
    }
    try {
      const result = await this.enrichComprehensive(context);
      if (result.success && result.data) {
        return result;
      }
    } catch (error) {
      console.warn("Comprehensive enrichment failed, falling back to per-field:", error);
    }
    return this.enrichPerField(mapped, mappings, context);
  }
  /**
   * Comprehensive enrichment - single API call for all fields
   */
  async enrichComprehensive(context) {
    if (!this.provider) {
      return { success: false, error: "No AI provider available" };
    }
    const exerciseContext = {
      name: String(context.source.name || "Unknown Exercise"),
      target: context.source.target,
      equipment: context.source.equipment,
      bodyPart: context.source.bodyPart
    };
    const prompt = getExerciseEnrichmentPrompt(exerciseContext);
    try {
      const result = await this.provider.completeJSON(prompt, void 0, {
        systemPrompt: EXERCISE_SYSTEM_PROMPT,
        temperature: this.config.options?.temperature ?? 0.3,
        maxTokens: this.config.options?.maxTokens ?? 4e3
      });
      const enrichedData = {};
      if (result.description) {
        this.setNestedValue(enrichedData, "canonical.description", result.description);
      }
      if (result.aliases) {
        this.setNestedValue(enrichedData, "canonical.aliases", result.aliases);
      }
      if (result.localized) {
        this.setNestedValue(enrichedData, "canonical.localized", result.localized);
      }
      if (result.classification) {
        const classification = result.classification;
        for (const [key, value] of Object.entries(classification)) {
          this.setNestedValue(enrichedData, `classification.${key}`, value);
        }
      }
      if (result.targets) {
        const targets = result.targets;
        if (targets.secondary) {
          this.setNestedValue(enrichedData, "targets.secondary", targets.secondary);
        }
      }
      if (result.equipment) {
        const equipment = result.equipment;
        if (equipment.optional) {
          this.setNestedValue(enrichedData, "equipment.optional", equipment.optional);
        }
      }
      if (result.constraints) {
        const constraints = result.constraints;
        for (const [key, value] of Object.entries(constraints)) {
          this.setNestedValue(enrichedData, `constraints.${key}`, value);
        }
      }
      if (result.relations) {
        this.setNestedValue(enrichedData, "relations", result.relations);
      }
      if (result.metrics) {
        const metrics = result.metrics;
        if (metrics.primary) {
          this.setNestedValue(enrichedData, "metrics.primary", metrics.primary);
        }
        if (metrics.secondary) {
          this.setNestedValue(enrichedData, "metrics.secondary", metrics.secondary);
        }
      }
      return {
        success: true,
        data: enrichedData,
        tokensUsed: 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Per-field enrichment fallback
   */
  async enrichPerField(mapped, mappings, context) {
    const enrichedData = {};
    let totalTokens = 0;
    for (const [field, mapping] of Object.entries(mappings)) {
      const mappingObj = this.normalizeMapping(mapping);
      if (!mappingObj.enrichment?.enabled) {
        continue;
      }
      const shouldEnrich = this.shouldEnrich(mapped, field, mappingObj.enrichment);
      if (!shouldEnrich || this.config.skipFields?.includes(field)) {
        continue;
      }
      try {
        const result = await this.enrichField(field, mappingObj, context);
        if (result.success && result.data) {
          if (mappingObj.enrichment.fields) {
            for (const subField of mappingObj.enrichment.fields) {
              const fullPath = field.includes(".") ? field : `${field}.${subField}`;
              if (result.data[subField] !== void 0) {
                this.setNestedValue(enrichedData, fullPath, result.data[subField]);
              }
            }
          } else {
            this.setNestedValue(enrichedData, field, result.data);
          }
          totalTokens += result.tokensUsed || 0;
        }
      } catch (error) {
        console.warn(`Failed to enrich field ${field}:`, error);
        if (mappingObj.enrichment.fallback !== void 0) {
          this.setNestedValue(enrichedData, field, mappingObj.enrichment.fallback);
        }
      }
    }
    return {
      success: true,
      data: enrichedData,
      tokensUsed: totalTokens
    };
  }
  /**
   * Check if a field should be enriched
   */
  shouldEnrich(mapped, field, config) {
    const when = config.when || "missing";
    const currentValue = this.getNestedValue(mapped, field);
    switch (when) {
      case "always":
        return true;
      case "missing":
        return currentValue === void 0;
      case "empty":
        return currentValue === void 0 || currentValue === null || currentValue === "";
      case "notFound":
        return currentValue === void 0 || currentValue === null;
      default:
        return false;
    }
  }
  /**
   * Enrich a single field
   */
  async enrichField(field, mapping, context) {
    if (!this.provider) {
      return { success: false, error: "No AI provider available" };
    }
    const enrichmentConfig = mapping.enrichment;
    const promptContext = {};
    if (enrichmentConfig.context) {
      for (const contextField of enrichmentConfig.context) {
        promptContext[contextField] = this.getNestedValue(context.source, contextField) ?? this.getNestedValue(context.target, contextField);
      }
    }
    const prompt = this.buildPrompt(field, enrichmentConfig.prompt, promptContext);
    try {
      const result = await this.provider.completeJSON(prompt, void 0, {
        systemPrompt: this.getSystemPrompt(),
        temperature: this.config.options?.temperature ?? 0.3,
        maxTokens: this.config.options?.maxTokens ?? 2e3
      });
      return {
        success: true,
        data: result,
        tokensUsed: 0
        // Would be set by provider
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Build the prompt for AI enrichment
   */
  buildPrompt(_field, promptName, context) {
    const exerciseContext = {
      name: String(context.name || context["canonical.name"] || "Unknown Exercise"),
      target: context.target,
      equipment: context.equipment,
      bodyPart: context.bodyPart
    };
    if (promptName && FIELD_PROMPTS[promptName]) {
      return FIELD_PROMPTS[promptName](exerciseContext);
    }
    return getExerciseEnrichmentPrompt(exerciseContext);
  }
  /**
   * Get the system prompt for enrichment
   */
  getSystemPrompt() {
    return EXERCISE_SYSTEM_PROMPT;
  }
  /**
   * Check if engine is enabled
   */
  isEnabled() {
    return this.config.enabled === true && this.provider !== null;
  }
  /**
   * Check if tiered enrichment is configured
   */
  isTieredEnabled() {
    return !!(this.config.tiers && this.config.fields);
  }
  /**
   * Get the provider (for testing)
   */
  getProvider() {
    return this.provider;
  }
  /**
   * Get the rate limiter (for testing)
   */
  getRateLimiter() {
    return this.rateLimiter;
  }
  // ==========================================================================
  // Utility Methods
  // ==========================================================================
  /**
   * Normalize mapping to object form
   */
  normalizeMapping(mapping) {
    if (typeof mapping === "string") {
      return { from: mapping };
    }
    return mapping;
  }
  /**
   * Get nested value from object
   */
  getNestedValue(obj, path2) {
    const parts = path2.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === void 0) {
        return void 0;
      }
      current = current[part];
    }
    return current;
  }
  /**
   * Set nested value in object
   */
  setNestedValue(obj, path2, value) {
    const parts = path2.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
};

// src/config/config-loader.ts
init_esm_shims();
import { dirname as dirname2, resolve, isAbsolute } from "path";
var ConfigLoader = class {
  /**
   * Load a mapping configuration from file
   */
  static async load(configPath) {
    const fs = await import("fs/promises");
    const content = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(content);
    if (config.registries) {
      const configDir = dirname2(configPath);
      config.registries = this.resolveRegistryPaths(config.registries, configDir);
    }
    if (config.output?.directory && !isAbsolute(config.output.directory)) {
      const configDir = dirname2(configPath);
      config.output.directory = resolve(configDir, config.output.directory);
    }
    return config;
  }
  /**
   * Resolve relative paths in registry config
   */
  static resolveRegistryPaths(registries, basePath) {
    const resolved = {};
    if (registries.muscles?.local) {
      resolved.muscles = {
        ...registries.muscles,
        local: isAbsolute(registries.muscles.local) ? registries.muscles.local : resolve(basePath, registries.muscles.local)
      };
    } else if (registries.muscles) {
      resolved.muscles = registries.muscles;
    }
    if (registries.equipment?.local) {
      resolved.equipment = {
        ...registries.equipment,
        local: isAbsolute(registries.equipment.local) ? registries.equipment.local : resolve(basePath, registries.equipment.local)
      };
    } else if (registries.equipment) {
      resolved.equipment = registries.equipment;
    }
    if (registries.muscleCategories?.local) {
      resolved.muscleCategories = {
        ...registries.muscleCategories,
        local: isAbsolute(registries.muscleCategories.local) ? registries.muscleCategories.local : resolve(basePath, registries.muscleCategories.local)
      };
    } else if (registries.muscleCategories) {
      resolved.muscleCategories = registries.muscleCategories;
    }
    return resolved;
  }
  /**
   * Load a mapping configuration from a URL
   */
  static async loadFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${url}: ${response.statusText}`);
    }
    return response.json();
  }
  /**
   * Merge multiple configurations
   */
  static merge(...configs) {
    const merged = {
      version: "1.0.0",
      targetSchema: { version: "1.0.0" },
      mappings: {}
    };
    for (const config of configs) {
      if (config.version) merged.version = config.version;
      if (config.targetSchema) {
        merged.targetSchema = { ...merged.targetSchema, ...config.targetSchema };
      }
      if (config.registries) {
        merged.registries = { ...merged.registries, ...config.registries };
      }
      if (config.mappings) {
        merged.mappings = { ...merged.mappings, ...config.mappings };
      }
      if (config.allowUnsafeEval !== void 0) {
        merged.allowUnsafeEval = config.allowUnsafeEval;
      }
      if (config.enrichment) {
        merged.enrichment = { ...merged.enrichment, ...config.enrichment };
      }
      if (config.validation) {
        merged.validation = { ...merged.validation, ...config.validation };
      }
      if (config.output) {
        merged.output = { ...merged.output, ...config.output };
      }
      if (config.plugins) {
        merged.plugins = [...merged.plugins || [], ...config.plugins];
      }
    }
    return merged;
  }
  /**
   * Apply environment variable overrides
   */
  static applyEnvOverrides(config) {
    const result = { ...config };
    if (!result.enrichment?.apiKey && process.env.OPENROUTER_API_KEY) {
      result.enrichment = {
        ...result.enrichment,
        apiKey: process.env.OPENROUTER_API_KEY
      };
    }
    if (process.env.FDS_TRANSFORMER_MODEL) {
      result.enrichment = {
        ...result.enrichment,
        model: process.env.FDS_TRANSFORMER_MODEL
      };
    }
    return result;
  }
  /**
   * Validate a configuration
   */
  static validate(config) {
    const errors = [];
    if (!config.version) {
      errors.push("Missing required field: version");
    }
    if (!config.targetSchema?.version) {
      errors.push("Missing required field: targetSchema.version");
    }
    if (!config.mappings || Object.keys(config.mappings).length === 0) {
      errors.push("Missing required field: mappings (must have at least one mapping)");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// src/core/transformer.ts
var Transformer = class {
  config;
  mappingEngine;
  registryManager;
  schemaManager;
  enrichmentEngine = null;
  initialized = false;
  constructor(options = {}) {
    this.config = options.config || {};
    this.mappingEngine = new MappingEngine();
    this.registryManager = new RegistryManager();
    this.schemaManager = new SchemaManager();
  }
  /**
   * Get the enrichment engine (for testing or direct access)
   */
  getEnrichmentEngine() {
    return this.enrichmentEngine;
  }
  /**
   * Get the schema manager (for accessing schema $defs)
   */
  getSchemaManager() {
    return this.schemaManager;
  }
  /**
   * Check if tiered enrichment is available
   */
  isTieredEnrichmentEnabled() {
    return this.enrichmentEngine?.isTieredEnabled() ?? false;
  }
  /**
   * Get cost estimate for batch enrichment
   */
  estimateCost(exerciseCount) {
    if (!this.enrichmentEngine) {
      return null;
    }
    return this.enrichmentEngine.estimateCost(exerciseCount);
  }
  /**
   * Initialize the transformer (load config, registries, schemas)
   */
  async init() {
    if (this.initialized) return;
    if (typeof this.config === "string") {
      this.config = await ConfigLoader.load(this.config);
    }
    if (this.config.enrichment?.enabled !== false) {
      this.enrichmentEngine = new EnrichmentEngine(this.config.enrichment);
    }
    if (this.config.registries) {
      await this.registryManager.load(this.config.registries);
    }
    if (this.config.targetSchema) {
      await this.schemaManager.loadVersion(this.config.targetSchema.version);
    }
    this.initialized = true;
  }
  /**
   * Transform a single source item to FDS format
   */
  async transform(source) {
    await this.init();
    const context = {
      source,
      target: {},
      field: "",
      registries: {
        muscles: this.registryManager.getMuscles(),
        equipment: this.registryManager.getEquipment(),
        muscleCategories: this.registryManager.getMuscleCategories()
      },
      config: this.config
    };
    try {
      const mapped = await this.mappingEngine.apply(
        source,
        this.config.mappings,
        context
      );
      let enriched = [];
      if (this.enrichmentEngine && this.config.enrichment?.enabled !== false) {
        const enrichmentResult = await this.enrichmentEngine.enrich(
          mapped,
          this.config.mappings,
          context
        );
        this.deepMerge(mapped, enrichmentResult.data || {});
        enriched = Object.keys(enrichmentResult.data || {});
      }
      let validation = { valid: true, errors: [] };
      if (this.config.validation?.enabled !== false) {
        validation = await this.schemaManager.validate(
          mapped,
          this.config.targetSchema?.entity || "exercise"
        );
      }
      return {
        success: validation.valid || !this.config.validation?.strict,
        data: mapped,
        errors: validation.errors,
        enriched,
        __validation: validation
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: "_transform",
            message: error instanceof Error ? error.message : "Unknown error"
          }
        ]
      };
    }
  }
  /**
   * Transform multiple items with streaming support
   */
  async *transformStream(source) {
    await this.init();
    for await (const item of source) {
      yield await this.transform(item);
    }
  }
  /**
   * Transform all items from an array
   */
  async transformAll(sources) {
    const results = [];
    for await (const result of this.transformStream(sources)) {
      results.push(result);
    }
    return results;
  }
  /**
   * Transform all items using batch enrichment with tiered processing
   *
   * This method is more efficient than transformAll() for large datasets as it:
   * 1. Maps all exercises first (without enrichment)
   * 2. Batches exercises by tier for enrichment (using appropriate models)
   * 3. Supports checkpoint/resume for long-running operations
   * 4. Reports progress via callback
   *
   * @param sources - Array of source items to transform
   * @param options - Batch transformation options
   * @returns Batch transformation result with stats
   */
  async transformAllBatch(sources, options = {}) {
    const startTime = Date.now();
    await this.init();
    const results = [];
    const errors = [];
    let enrichedCount = 0;
    let apiCalls = 0;
    let tokensUsed = 0;
    const mappedExercises = [];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const context = {
        source,
        target: {},
        field: "",
        registries: {
          muscles: this.registryManager.getMuscles(),
          equipment: this.registryManager.getEquipment(),
          muscleCategories: this.registryManager.getMuscleCategories()
        },
        config: this.config
      };
      try {
        const mapped = await this.mappingEngine.apply(
          source,
          this.config.mappings,
          context
        );
        mappedExercises.push({ index: i, source, mapped, context });
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Mapping failed"
        });
        results[i] = {
          success: false,
          errors: [
            {
              field: "_mapping",
              message: error instanceof Error ? error.message : "Mapping failed"
            }
          ]
        };
      }
    }
    let enrichmentResults = null;
    if (!options.skipEnrichment && this.enrichmentEngine && this.config.enrichment?.enabled !== false && this.enrichmentEngine.isTieredEnabled()) {
      const exerciseInputs = mappedExercises.map(({ mapped, index }) => {
        const canonical = mapped.canonical;
        const targets = mapped.targets;
        const equipment = mapped.equipment;
        return {
          id: mapped.exerciseId || `exercise-${index}`,
          slug: canonical?.slug || `exercise-${index}`,
          name: canonical?.name || `Exercise ${index}`,
          description: canonical?.description,
          primaryTargets: targets?.primary || void 0,
          requiredEquipment: equipment?.required || void 0
        };
      });
      const schema = this.schemaManager.getSchema(
        this.config.targetSchema?.entity || "exercise",
        this.config.targetSchema?.version || "1.0.0"
      );
      const schemaDefs = schema?.$defs;
      const enrichmentOptions = {
        resume: options.resume,
        tierFilter: options.tierFilter,
        onProgress: options.onProgress,
        outputDirectory: options.outputDirectory,
        schemaDefs
      };
      enrichmentResults = await this.enrichmentEngine.enrichBatch(
        exerciseInputs,
        enrichmentOptions
      );
      apiCalls = enrichmentResults.apiCalls;
      tokensUsed = enrichmentResults.tokensUsed;
    }
    for (const { index, mapped, source } of mappedExercises) {
      if (results[index]) {
        continue;
      }
      let enriched = [];
      if (enrichmentResults) {
        const exerciseId = mapped.exerciseId || mapped.canonical?.slug || `exercise-${index}`;
        const enrichmentData = enrichmentResults.results.get(exerciseId);
        if (enrichmentData) {
          this.deepMerge(mapped, enrichmentData);
          enriched = Object.keys(enrichmentData);
          enrichedCount++;
        }
        if (enrichmentResults.failedIds.includes(exerciseId)) {
          const error = enrichmentResults.errors.find((e) => e.exerciseId === exerciseId);
          errors.push({
            index,
            exerciseId,
            error: error?.error || "Enrichment failed"
          });
        }
      }
      if (!options.skipEnrichment && this.enrichmentEngine && this.config.enrichment?.enabled !== false && !this.enrichmentEngine.isTieredEnabled()) {
        try {
          const context = {
            source,
            target: mapped,
            field: "",
            registries: {
              muscles: this.registryManager.getMuscles(),
              equipment: this.registryManager.getEquipment(),
              muscleCategories: this.registryManager.getMuscleCategories()
            },
            config: this.config
          };
          const enrichmentResult = await this.enrichmentEngine.enrich(
            mapped,
            this.config.mappings,
            context
          );
          if (enrichmentResult.data) {
            this.deepMerge(mapped, enrichmentResult.data);
            enriched = Object.keys(enrichmentResult.data);
            enrichedCount++;
          }
        } catch (error) {
          errors.push({
            index,
            error: error instanceof Error ? error.message : "Enrichment failed"
          });
        }
      }
      let validation = { valid: true, errors: [] };
      if (this.config.validation?.enabled !== false) {
        validation = await this.schemaManager.validate(
          mapped,
          this.config.targetSchema?.entity || "exercise"
        );
      }
      results[index] = {
        success: validation.valid || !this.config.validation?.strict,
        data: mapped,
        errors: validation.errors,
        enriched,
        __validation: validation
      };
    }
    const successCount = results.filter((r) => r?.success).length;
    const failedCount = sources.length - successCount;
    return {
      results,
      stats: {
        total: sources.length,
        success: successCount,
        failed: failedCount,
        enriched: enrichedCount,
        apiCalls,
        tokensUsed,
        durationMs: Date.now() - startTime
      },
      errors
    };
  }
  /**
   * Deep merge source object into target
   */
  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (sourceValue !== null && typeof sourceValue === "object" && !Array.isArray(sourceValue) && targetValue !== null && typeof targetValue === "object" && !Array.isArray(targetValue)) {
        this.deepMerge(
          targetValue,
          sourceValue
        );
      } else if (sourceValue !== void 0) {
        target[key] = sourceValue;
      }
    }
  }
};

// src/core/batch-processor.ts
init_esm_shims();
var BatchProcessor = class {
  transformer;
  options;
  constructor(transformer, options = {}) {
    this.transformer = transformer;
    this.options = {
      concurrency: options.concurrency ?? 5,
      chunkSize: options.chunkSize ?? 10,
      onProgress: options.onProgress ?? (() => {
      }),
      onError: options.onError ?? (() => {
      })
    };
  }
  /**
   * Process items in parallel batches
   */
  async process(items) {
    const startTime = Date.now();
    const results = [];
    let successful = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i += this.options.chunkSize) {
      const chunk = items.slice(i, i + this.options.chunkSize);
      const chunkResults = await this.processChunk(chunk, i);
      for (const result of chunkResults) {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }
      this.options.onProgress({
        processed: Math.min(i + this.options.chunkSize, items.length),
        total: items.length,
        successful,
        failed,
        percentage: Math.round(
          Math.min(i + this.options.chunkSize, items.length) / items.length * 100
        )
      });
    }
    return {
      results,
      summary: {
        total: items.length,
        successful,
        failed,
        duration: Date.now() - startTime
      }
    };
  }
  /**
   * Process a chunk of items with concurrency control
   */
  async processChunk(chunk, startIndex) {
    const results = new Array(chunk.length);
    const executing = /* @__PURE__ */ new Set();
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      const globalIndex = startIndex + i;
      const task = (async () => {
        try {
          const result = await this.transformer.transform(item);
          results[i] = result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.options.onError(err, item, globalIndex);
          results[i] = {
            success: false,
            errors: [{ field: "_batch", message: err.message }]
          };
        }
      })();
      const wrappedTask = task.finally(() => {
        executing.delete(wrappedTask);
      });
      executing.add(wrappedTask);
      if (executing.size >= this.options.concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return results;
  }
  /**
   * Process items as an async stream
   */
  async *processStream(items) {
    let index = 0;
    for await (const item of items) {
      try {
        const result = await this.transformer.transform(item);
        yield result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.options.onError(err, item, index);
        yield {
          success: false,
          errors: [{ field: "_batch", message: err.message }]
        };
      }
      index++;
    }
  }
};

// src/bin/fds-transformer.ts
var program = new Command();
var LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};
var currentLogLevel = "info";
function log2(level, message) {
  if (LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel]) {
    switch (level) {
      case "error":
        p.log.error(message);
        break;
      case "warn":
        p.log.warn(message);
        break;
      case "info":
        p.log.info(message);
        break;
      case "debug":
        p.log.message(pc.dim(`[debug] ${message}`));
        break;
    }
  }
}
function formatNumber(n) {
  return n.toLocaleString("en-US");
}
function formatCost(cost) {
  return `$${cost.toFixed(2)}`;
}
function displayCostEstimate(estimate, exerciseCount) {
  const { tiers, total, estimatedTime, disclaimer } = estimate;
  const simpleFields = 6;
  const mediumFields = 5;
  const complexFields = 7;
  console.log("");
  console.log(
    pc.cyan(
      "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"
    )
  );
  console.log(
    pc.cyan(
      "\u2502                         Cost Estimation                               \u2502"
    )
  );
  console.log(
    pc.cyan(
      "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524"
    )
  );
  console.log(
    pc.cyan("\u2502") + ` Input: ${formatNumber(exerciseCount)} exercises`.padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + ` Enrichment fields: 18 (${simpleFields} simple, ${mediumFields} medium, ${complexFields} complex)`.padEnd(
      71
    ) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + "".padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + " Tier       \u2502 Model              \u2502 Batch \u2502 Calls  \u2502 Tokens   \u2502 Cost   " + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + " \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" + pc.cyan("\u2502")
  );
  for (const tierName of ["simple", "medium", "complex"]) {
    const tier = tiers[tierName];
    const modelShort = tier.model.replace("anthropic/", "");
    const tokens = `~${(tier.inputTokens / 1e3).toFixed(0)}K`;
    const row = ` ${tierName.charAt(0).toUpperCase() + tierName.slice(1).padEnd(9)} \u2502 ${modelShort.padEnd(18)} \u2502 ${String(tier.batchSize).padStart(5)} \u2502 ${formatNumber(tier.apiCalls).padStart(6)} \u2502 ${tokens.padStart(8)} \u2502 ${formatCost(tier.cost).padStart(6)} `;
    console.log(pc.cyan("\u2502") + row + pc.cyan("\u2502"));
  }
  console.log(
    pc.cyan("\u2502") + " \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" + pc.cyan("\u2502")
  );
  const totalTokens = `~${((total.inputTokens + total.outputTokens) / 1e6).toFixed(2)}M`;
  const totalRow = ` TOTAL                                   \u2502 ${formatNumber(total.apiCalls).padStart(6)} \u2502 ${totalTokens.padStart(8)} \u2502 ${formatCost(total.cost).padStart(6)} `;
  console.log(pc.cyan("\u2502") + pc.bold(totalRow) + pc.cyan("\u2502"));
  console.log(
    pc.cyan("\u2502") + "".padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + ` Estimated time: ${estimatedTime.formatted} (at 50 requests/min)`.padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + "".padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan("\u2502") + pc.dim(` * ${disclaimer}`).padEnd(71) + pc.cyan("\u2502")
  );
  console.log(
    pc.cyan(
      "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"
    )
  );
  console.log("");
}
function createProgressCallback() {
  let lastUpdate = 0;
  const updateInterval = 500;
  return (progress) => {
    const now = Date.now();
    if (now - lastUpdate < updateInterval) {
      return;
    }
    lastUpdate = now;
    const { exercise, tier, overall } = progress;
    process.stderr.write("\r\x1B[K");
    const tierStatus = getTierStatusDisplay(tier.status);
    const progressBar = createProgressBar(overall.percentage, 20);
    const line = `  ${pc.cyan("\u25CF")} Processing ${exercise.current}/${exercise.total}: ${pc.bold(exercise.name)} ${tierStatus} ${progressBar} ${overall.percentage.toFixed(1)}%`;
    process.stderr.write(line);
  };
}
function getTierStatusDisplay(status) {
  switch (status) {
    case "processing":
      return pc.yellow("\u25CF");
    case "complete":
      return pc.green("\u2713");
    case "failed":
      return pc.red("\u2717");
    case "skipped":
      return pc.dim("\u25CB");
    case "pending":
    default:
      return pc.dim("\u25CB");
  }
}
function createProgressBar(percentage, width) {
  const filled = Math.round(percentage / 100 * width);
  const empty = width - filled;
  return pc.cyan("\u2502") + pc.green("\u2588".repeat(filled)) + pc.dim("\u2591".repeat(empty)) + pc.cyan("\u2502");
}
program.name("fds-transformer").description("Transform source data to FDS (Fitness Data Standard) format").version("0.1.0");
program.command("transform").description("Transform source data to FDS format").option("-i, --input <path>", "Input file path (JSON)").option("-c, --config <path>", "Mapping configuration file").option("-o, --output <path>", "Output directory").option("--no-ai", "Disable AI enrichment (legacy)").option("--api-key <key>", "API key for enrichment provider").option("--model <model>", "AI model to use (legacy single-model mode)").option("--version <version>", "Target FDS schema version", "1.0.0").option("--dry-run", "Preview transformation without writing files").option("--estimate-cost", "Show cost estimate without running enrichment").option("--resume", "Resume from checkpoint").option("--tier <tier>", "Run only specific tier (simple|medium|complex)").option("--clear-checkpoint", "Clear existing checkpoint before running").option("--no-checkpoint", "Disable checkpoint saving").option("--no-enrichment", "Skip AI enrichment entirely").option(
  "--log-level <level>",
  "Log verbosity (error|warn|info|debug)",
  "info"
).action(async (options) => {
  if (options.logLevel && ["error", "warn", "info", "debug"].includes(options.logLevel)) {
    currentLogLevel = options.logLevel;
  }
  p.intro(pc.bgCyan(pc.black(" FDS Transformer ")));
  try {
    if (!options.input) {
      p.cancel("Input file is required. Use --input <path>");
      process.exit(1);
    }
    const fs = await import("fs/promises");
    const inputContent = await fs.readFile(options.input, "utf-8");
    const inputData = JSON.parse(inputContent);
    const items = Array.isArray(inputData) ? inputData : [inputData];
    log2("info", `Loaded ${formatNumber(items.length)} items from ${options.input}`);
    let config;
    if (options.config) {
      config = await ConfigLoader.load(options.config);
      log2("info", `Loaded config from ${options.config}`);
      if (config.enrichment?.tiers && config.enrichment?.fields) {
        log2("info", "Tiered enrichment configuration detected");
      }
    } else {
      log2("warn", "No config file specified. Using default mappings.");
      config = {
        version: "1.0.0",
        targetSchema: { version: options.version },
        mappings: {}
      };
    }
    if (options.apiKey) {
      config.enrichment = { ...config.enrichment, apiKey: options.apiKey };
    }
    if (options.model) {
      config.enrichment = { ...config.enrichment, model: options.model };
    }
    if (options.noAi || options.noEnrichment) {
      config.enrichment = { ...config.enrichment, enabled: false };
    }
    if (options.noCheckpoint && config.enrichment) {
      config.enrichment = {
        ...config.enrichment,
        checkpoint: { enabled: false, saveInterval: 0 }
      };
    }
    const transformer = new Transformer({ config });
    await transformer.init();
    const outputDir = options.output || config.output?.directory || process.cwd();
    if (options.clearCheckpoint) {
      const checkpointPath = `${outputDir}/${CHECKPOINT_FILENAME}`;
      try {
        await fs.unlink(checkpointPath);
        log2("info", "Cleared existing checkpoint");
      } catch {
        log2("debug", "No checkpoint file to clear");
      }
    }
    if (options.estimateCost) {
      const estimate = transformer.estimateCost(items.length);
      if (estimate) {
        displayCostEstimate(estimate, items.length);
        p.outro(pc.cyan("Cost estimation complete"));
      } else {
        p.log.warn(
          "Cost estimation requires tiered enrichment configuration in mapping config."
        );
        p.log.info(
          'Add "enrichment.tiers" and "enrichment.fields" to your config file.'
        );
      }
      return;
    }
    if (options.resume) {
      const checkpointManager = new CheckpointManager(outputDir);
      if (checkpointManager.exists()) {
        const checkpoint = checkpointManager.load();
        if (checkpoint) {
          log2(
            "info",
            `Found checkpoint: ${formatNumber(checkpoint.completedExercises)}/${formatNumber(checkpoint.totalExercises)} exercises completed`
          );
          log2("info", `Resuming from exercise ${checkpoint.completedExercises + 1}...`);
        }
      } else {
        log2("warn", "No checkpoint found. Starting fresh.");
      }
    }
    const validTiers = ["simple", "medium", "complex"];
    if (options.tier && !validTiers.includes(options.tier)) {
      p.cancel(
        `Invalid tier: ${options.tier}. Must be one of: ${validTiers.join(", ")}`
      );
      process.exit(1);
    }
    const useBatchMode = transformer.isTieredEnrichmentEnabled();
    if (useBatchMode) {
      log2("debug", "Using batch mode with tiered enrichment");
      const batchOptions = {
        resume: options.resume,
        tierFilter: options.tier,
        outputDirectory: outputDir,
        skipEnrichment: options.noEnrichment || options.noAi,
        onProgress: createProgressCallback()
      };
      const spinner2 = p.spinner();
      spinner2.start("Processing with tiered enrichment...");
      const result = await transformer.transformAllBatch(items, batchOptions);
      process.stderr.write("\r\x1B[K");
      spinner2.stop("Transformation complete");
      log2(
        "info",
        `Processed ${formatNumber(result.stats.total)} items in ${result.stats.durationMs}ms`
      );
      log2("info", `  Successful: ${formatNumber(result.stats.success)}`);
      log2("info", `  Enriched: ${formatNumber(result.stats.enriched)}`);
      log2("info", `  API Calls: ${formatNumber(result.stats.apiCalls)}`);
      if (result.stats.failed > 0) {
        log2("warn", `  Failed: ${formatNumber(result.stats.failed)}`);
      }
      if (!options.dryRun) {
        await writeOutput(fs, result.results, config, outputDir, options);
      }
    } else {
      log2("debug", "Using legacy single-item processing");
      const spinner2 = p.spinner();
      spinner2.start("Transforming data...");
      const batchProcessor = new BatchProcessor(transformer, {
        onProgress: (progress) => {
          spinner2.message(
            `Transforming... ${progress.processed}/${progress.total} (${progress.percentage}%)`
          );
        }
      });
      const result = await batchProcessor.process(items);
      spinner2.stop("Transformation complete");
      log2(
        "info",
        `Processed ${formatNumber(result.summary.total)} items in ${result.summary.duration}ms`
      );
      log2("info", `  Successful: ${formatNumber(result.summary.successful)}`);
      if (result.summary.failed > 0) {
        log2("warn", `  Failed: ${formatNumber(result.summary.failed)}`);
      }
      if (!options.dryRun) {
        await writeOutput(fs, result.results, config, outputDir, options);
      }
    }
    p.outro(pc.green("Done!"));
  } catch (error) {
    p.cancel(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
});
async function writeOutput(fs, results, config, outputDir, options) {
  const spinner2 = p.spinner();
  const dir = options.output || outputDir;
  if (dir) {
    spinner2.start("Writing output files...");
    await fs.mkdir(dir, { recursive: true });
    const singleFile = config.output?.singleFile;
    const singleFileName = config.output?.singleFileName || "output.json";
    const prettyPrint = config.output?.pretty !== false;
    const successfulResults = results.filter(
      (item) => item.success && item.data
    );
    if (singleFile) {
      const successfulData = successfulResults.map((item) => item.data);
      const outputPath = `${dir}/${singleFileName}`;
      const content = prettyPrint ? JSON.stringify(successfulData, null, 2) : JSON.stringify(successfulData);
      await fs.writeFile(outputPath, content);
      spinner2.stop(
        `Wrote ${formatNumber(successfulResults.length)} exercises to ${outputPath}`
      );
    } else {
      for (const item of successfulResults) {
        if (item.data) {
          const slug = item.data.canonical && item.data.canonical?.slug ? String(
            item.data.canonical.slug
          ) : "unknown";
          const outputPath = `${dir}/${slug}.json`;
          const content = prettyPrint ? JSON.stringify(item.data, null, 2) : JSON.stringify(item.data);
          await fs.writeFile(outputPath, content);
        }
      }
      spinner2.stop(`Wrote ${formatNumber(successfulResults.length)} files to ${dir}`);
    }
  } else {
    log2(
      "info",
      "No output directory specified. Use --output <path> or set output.directory in config."
    );
  }
}
program.command("validate").description("Validate FDS data against schema").option("-i, --input <path>", "Input file to validate").option(
  "-e, --entity <type>",
  "Entity type (exercise, equipment, muscle)",
  "exercise"
).option("--version <version>", "FDS schema version", "1.0.0").action(async (options) => {
  p.intro(pc.bgCyan(pc.black(" FDS Validator ")));
  try {
    if (!options.input) {
      p.cancel("Input file is required. Use --input <path>");
      process.exit(1);
    }
    const fs = await import("fs/promises");
    const content = await fs.readFile(options.input, "utf-8");
    const data = JSON.parse(content);
    const schemaManager = new SchemaManager();
    await schemaManager.loadVersion(options.version);
    const result = await schemaManager.validate(
      data,
      options.entity,
      options.version
    );
    if (result.valid) {
      p.log.success("Validation passed!");
    } else {
      p.log.error("Validation failed:");
      for (const error of result.errors) {
        p.log.warn(`  ${error.field}: ${error.message}`);
      }
    }
    p.outro(result.valid ? pc.green("Valid!") : pc.red("Invalid"));
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    p.cancel(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
});
program.command("init").description("Create a new mapping configuration interactively").option("-s, --sample <path>", "Sample source file to analyze").option("-o, --output <path>", "Output path for config", "./mapping.json").action(async (options) => {
  p.intro(pc.bgCyan(pc.black(" FDS Transformer Setup ")));
  p.log.info("Interactive setup wizard is under development.");
  if (options.sample) {
    p.log.info(`Sample file provided: ${options.sample}`);
    p.log.info("Future version will analyze this file to suggest mappings.");
  }
  p.log.info("");
  p.log.info("For now, create your mapping.json manually using these resources:");
  p.log.message("  - Documentation: https://spec.vitness.me/docs/tools/transformer/configuration");
  p.log.message(`  - Output location: ${options.output}`);
  p.outro("See documentation for manual configuration");
});
program.command("schemas").description("Manage FDS schemas").argument("<action>", "Action: list, update").action(async (action) => {
  p.intro(pc.bgCyan(pc.black(" FDS Schemas ")));
  const schemaManager = new SchemaManager();
  switch (action) {
    case "list":
      const versions = await schemaManager.listVersions();
      p.log.info("Available schema versions:");
      for (const v of versions) {
        p.log.message(`  ${v.version} ${v.bundled ? "(bundled)" : ""}`);
      }
      break;
    case "update":
      p.log.info("Updating schema cache...");
      await schemaManager.updateCache();
      p.log.success("Cache updated");
      break;
    default:
      p.log.error(`Unknown action: ${action}`);
  }
  p.outro("Done");
});
program.action(async () => {
  p.intro(pc.bgCyan(pc.black(" FDS Transformer ")));
  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "transform", label: "Transform data to FDS format" },
      { value: "validate", label: "Validate existing FDS data" },
      { value: "init", label: "Create new mapping configuration" },
      { value: "schemas", label: "Manage FDS schemas" }
    ]
  });
  if (p.isCancel(action)) {
    p.cancel("Cancelled");
    process.exit(0);
  }
  const args = [process.argv[0], process.argv[1], action];
  process.argv = args;
  await program.parseAsync(args);
});
program.parse();
//# sourceMappingURL=fds-transformer.js.map