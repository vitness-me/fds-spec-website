import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * FDS Documentation Sidebar Configuration
 *
 * Organizes documentation into logical sections for easy navigation.
 */
const sidebars: SidebarsConfig = {
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
      items: [
        'specifications/rfc-001-exercise-data-model',
        'specifications/rfc-002-equipment-data-model',
        'specifications/rfc-003-muscle-data-model',
        'specifications/rfc-004-muscle-category-data-model',
        'specifications/rfc-005-body-atlas-data-model',
      ],
    },
    {
      type: 'category',
      label: 'JSON Schemas',
      collapsed: false,
      items: [
        'schemas/index',
        'schemas/exercise',
        'schemas/equipment',
        'schemas/muscle',
        'schemas/muscle-category',
        'schemas/body-atlas',
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
      ],
    },
    'license',
  ],
};

export default sidebars;
