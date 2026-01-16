import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Fitness Data Standard (FDS)',
  tagline: 'An open, interoperable standard for fitness data',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://spec.vitness.me',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For custom domain, use root
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'vitness-me', // Usually your GitHub org/user name.
  projectName: 'fds-spec-website', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Edit URL points to the website folder (Docusaurus appends the doc path automatically)
          editUrl:
            'https://github.com/vitness-me/fds-spec-website/tree/main/website/',

          // Versioning configuration
          lastVersion: 'current',
          versions: {
            current: {
              label: '1.0.0',
              badge: false,  // Don't show version badge on every page
            },
          },
        },
        blog: false, // Disable blog for MVP
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image',
        content: 'https://spec.vitness.me/img/logo.svg',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image:alt',
        content: 'Fitness Data Standard (FDS) - Open, interoperable standard for fitness data',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:image',
        content: 'https://spec.vitness.me/img/logo.svg',
      },
    },
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FDS',
      logo: {
        alt: 'Fitness Data Standard',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'doc',
          docId: 'specifications/rfc-001-exercise-data-model',
          label: 'Specifications',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'schemas/exercise',
          label: 'Schemas',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'governance/contributing',
          label: 'Contribute',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            {
              to: '/docs/governance/changelog',
              label: 'Changelog',
            },
          ],
        },
        {
          href: 'https://github.com/vitness-me/fds-spec-website',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          dropdownItemsAfter: [
            {
              href: 'https://github.com/vitness-me/fds-spec-website/issues/new?title=Translation%20help&labels=i18n',
              label: 'Help translate',
            },
          ],
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/getting-started/overview',
            },
            {
              label: 'Specifications',
              to: 'docs/specifications/rfc-001-exercise-data-model',
            },
            {
              label: 'Schemas',
              to: 'docs/schemas/exercise',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/vitness-me/fds-spec-website',
            },
            {
              label: 'Contributing',
              to: 'docs/governance/contributing',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'License',
              to: 'docs/license',
            },
            {
              label: 'Governance',
              to: 'docs/governance',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Vitness. Licensed under the VITNESS Open Standards License Agreement.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['json', 'typescript', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
