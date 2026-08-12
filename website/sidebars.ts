import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * FDS Documentation Sidebar Configuration
 *
 * Organizes documentation into logical sections for easy navigation.
 */
const sidebars: SidebarsConfig = {
  // The capability layer — "what can you do with FDS?" — served under its own
  // navbar entry. Ordered foundational first, mirroring the FAMILIES registry in
  // docs/use-cases/_shared/registry.ts. Every page here is checked for a sidebar
  // entry by scripts/check-usecases.mjs: a page that builds but is unreachable is
  // the failure that let the landing page rot.
  useCasesSidebar: [
    'use-cases/index',
    {
      type: 'category',
      label: 'Foundations — the shared library',
      collapsed: false,
      items: [
        'use-cases/exercise-catalog',
        'use-cases/equipment',
        'use-cases/muscles-and-atlas',
      ],
    },
    {
      type: 'category',
      label: 'Prescription — the intent primitives',
      collapsed: false,
      items: ['use-cases/prescription'],
    },
    {
      type: 'category',
      label: 'Composition — sessions and plans',
      collapsed: false,
      items: [
        'use-cases/authoring-workouts',
        'use-cases/programming',
      ],
    },
  ],
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/overview',
        'getting-started/quick-validation',
        'getting-started/identifiers',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'core-concepts/internationalization',
        'core-concepts/metrics',
        'core-concepts/extensions',
        'core-concepts/discovery',
      ],
    },
    {
      type: 'category',
      label: 'Specifications (RFCs)',
      collapsed: false,
      // The category links to its index doc rather than listing it as a first
      // item: a listed index renders the breadcrumb twice ("Specifications
      // (RFCs) › Specifications (RFCs)") because the page's title equals the
      // category label it sits inside.
      link: {type: 'doc', id: 'specifications/index'},
      items: [
        'specifications/rfc-001-exercise-data-model',
        'specifications/rfc-002-equipment-data-model',
        'specifications/rfc-003-muscle-data-model',
        'specifications/rfc-004-muscle-category-data-model',
        'specifications/rfc-005-body-atlas-data-model',
        'specifications/rfc-006-prescription-primitives',
        'specifications/rfc-007-workout-data-model',
        'specifications/rfc-008-program-data-model',
      ],
    },
    {
      type: 'category',
      label: 'JSON Schemas',
      collapsed: false,
      // Linked for the same reason as Specifications (RFCs) above.
      link: {type: 'doc', id: 'schemas/index'},
      items: [
        'schemas/exercise',
        'schemas/equipment',
        'schemas/muscle',
        'schemas/muscle-category',
        'schemas/body-atlas',
        'schemas/workout',
        'schemas/program',
        'schemas/prescription',
      ],
    },
    {
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'FDS Transformer',
          collapsed: false,
          items: [
            'tools/transformer/index',
            'tools/transformer/installation',
            'tools/transformer/cli-reference',
            'tools/transformer/configuration',
            'tools/transformer/ai-enrichment',
            'tools/transformer/transforms',
            'tools/transformer/plugins',
            'tools/transformer/examples',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Governance',
      collapsed: false,
      items: [
        'governance/index',
        'governance/contributing',
        'governance/changelog',
        'governance/roadmap',
      ],
    },
    'license',
  ],
};

export default sidebars;
