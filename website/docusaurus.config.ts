import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {PrismTheme} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * The current FDS release, read from the generated release manifest.
 *
 * Every page on this site carries this number, and it sat at 1.0.0 for three
 * releases because it was a string literal nobody had a reason to look at.
 * specification/releases.json is generated from one traversal of the published
 * schemas, so reading it here is the difference between the site reporting the
 * release and the site remembering it.
 *
 * Resolved against this file rather than the working directory: the config is
 * loaded with the site directory as cwd by `docusaurus build` and `start`, but
 * that is a property of how it happens to be invoked, not of where the manifest
 * is.
 */
const localeManifest = JSON.parse(
  readFileSync(path.join(__dirname, 'i18n', 'locales.json'), 'utf8'),
) as {
  defaultLocale: string;
  locales: string[];
  localeConfigs: Record<string, {label: string; htmlLang: string}>;
  strings: Record<string, Record<string, string>>;
};

/**
 * The locale this config is being evaluated for.
 *
 * Two navbar strings live in this file rather than in a component — the
 * release dropdown's heading (a `type: 'html'` item, which the string
 * extractor does not see) and the locale dropdown's "help translate" link —
 * and both shipped in English on every translated page until a language
 * review caught them. Docusaurus builds each locale in its own pass and
 * exposes the locale to the config through this env var (its documented
 * escape hatch, facebook/docusaurus#4542); `docusaurus start` sets it only
 * when `--locale` is passed, hence the default-locale fallback.
 *
 * The lookup throws on a missing entry instead of falling back to English:
 * a locale that goes live without these strings should fail its build, not
 * quietly regrow the defect this exists to fix.
 *
 * "No locale was specified" is a different condition from "a live locale is
 * missing its strings", and conflating them killed `docusaurus start`: the
 * dev server without --locale assigns an undefined CLI option into
 * process.env, which coerces to the literal string "undefined" — so a
 * `??` fallback never fires and the guard threw before the server could
 * boot, while every gated path stayed green because `docusaurus build`
 * sets the variable properly per locale. Unset, empty and "undefined" all
 * mean the default locale; check-translations.mjs runs the extraction
 * under the dev server's exact environment so a config that cannot boot
 * `docusaurus start` cannot pass CI either.
 */
const envLocale = process.env.DOCUSAURUS_CURRENT_LOCALE;
const currentBuildLocale =
  envLocale && envLocale !== 'undefined' ? envLocale : localeManifest.defaultLocale;
const localeString = (key: string): string => {
  const value = localeManifest.strings[currentBuildLocale]?.[key];
  if (value === undefined) {
    throw new Error(
      `i18n/locales.json: strings.${currentBuildLocale}.${key} is missing — ` +
        `every live locale needs the config-level navbar strings translated`,
    );
  }
  return value;
};

const {currentRelease, releases} = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'specification', 'releases.json'), 'utf8'),
) as {
  currentRelease: string;
  releases: Record<
    string,
    {entities: Record<string, string>; libraries?: Record<string, string>}
  >;
};

/**
 * What the current release names, as navbar dropdown items.
 *
 * A release is a set of entity versions, not a version every entity shares —
 * so a "version dropdown" that offers alternative site versions models the
 * wrong thing (there is one site, describing one current release). Instead
 * the dropdown answers the question its label raises: what does this release
 * actually publish? One item per entity and library, each at its own
 * version, each going to the schema page that carries its frozen URL and
 * status. Derived from the manifest at build time, so the menu cannot
 * advertise a set nobody published.
 */
const released = releases[currentRelease] ?? {entities: {}, libraries: {}};
const releaseDropdownItems = [
  ...Object.entries(released.entities),
  ...Object.entries(released.libraries ?? {}),
].map(([name, version]) => ({
  label: `${name} · v${version}`,
  to: `/docs/schemas/${name}`,
  className: 'fds-dropdown-entity',
}));

/**
 * The site's syntax palette — quiet on purpose.
 *
 * An IDE theme is tuned for scanning thousands of lines with nothing else on
 * screen; dropped into a page built on hairlines and four text tiers it is
 * the loudest element there. This palette makes two decisions instead of
 * many: keys carry the full-strength text tier (the vocabulary is the
 * standard's argument), values carry the site's one accent, and everything
 * structural drops to the dim tier.
 *
 * Every color is a CSS custom property (--fds-code-*, defined for both color
 * modes in src/css/custom.css), so this one object serves light and dark,
 * and a surface that genuinely needs a louder rendering can re-declare the
 * variables in its own scope instead of introducing a second theme.
 */
const fdsCodeTheme: PrismTheme = {
  plain: {color: 'var(--fds-code-fg)', backgroundColor: 'var(--fds-code-bg)'},
  styles: [
    {
      // The vocabulary: JSON keys, keywords, commands.
      types: ['property', 'attr-name', 'keyword', 'builtin', 'tag', 'selector', 'class-name', 'function'],
      style: {color: 'var(--fds-code-key)'},
    },
    {
      // The data: strings, numbers, booleans.
      types: ['string', 'char', 'attr-value', 'number', 'boolean', 'inserted', 'url', 'symbol', 'constant', 'regex'],
      style: {color: 'var(--fds-code-value)'},
    },
    {
      types: ['punctuation', 'operator'],
      style: {color: 'var(--fds-code-dim)'},
    },
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {color: 'var(--fds-code-dim)', fontStyle: 'italic'},
    },
  ],
};

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
  onBrokenAnchors: 'warn',
  
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // The locale set, read from i18n/locales.json rather than written here.
  //
  // Two things need the same answer to "which locales does this site serve":
  // this config, and scripts/check-translations.mjs, which walks the i18n
  // tree and compares every translation against its English source. Two
  // hand-kept copies of that list is the drift this repository keeps
  // finding, so there is one file and both read it. localeConfigs may
  // describe locales that are not live yet — a locale ships only when it is
  // added to `locales`, which is why the configs are filtered here.
  i18n: {
    defaultLocale: localeManifest.defaultLocale,
    locales: localeManifest.locales,
    localeConfigs: Object.fromEntries(
      Object.entries(localeManifest.localeConfigs).filter(([locale]) =>
        localeManifest.locales.includes(locale),
      ),
    ),
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

          // Versioning configuration.
          //
          // The label names the current FDS *release*, which is a set of entity
          // versions rather than a version every entity shares — release 1.4.0
          // serves exercise, equipment and workout at 1.1.0 and the rest at
          // 1.0.0. It comes from the release manifest, so it cannot disagree
          // with DEFAULT_SCHEMA_VERSION in the transformer, which is generated
          // from the same document.
          lastVersion: 'current',
          versions: {
            current: {
              label: currentRelease,
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

  plugins: [
    // The scenario coverage matrix, joined with the fixture READMEs and
    // served as global data for docs/use-cases/_shared/Coverage.tsx. See the
    // plugin's doc comment for why this reads from disk in Node rather than
    // importing through webpack, and for the drift rule: a matrix row the
    // READMEs cannot describe fails the build.
    './plugins/coverage-matrix.mjs',
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        // `hashed` is recommended for long-term caching
        hashed: true,
        // Tokenizers for the search index. English and Spanish have lunr
        // language support; Serbian does not exist in lunr-languages, so
        // sr-Latn pages are tokenized with the defaults — searchable, just
        // without stemming.
        language: ['en', 'es'],
        // Index blog posts (disabled since blog is disabled)
        indexBlog: false,
        // Index pages (landing page, etc.)
        indexPages: true,
        // Highlight search terms on target pages
        highlightSearchTermsOnTargetPage: true,
        // Search result limits
        searchResultLimits: 8,
        // Search result context max length
        searchResultContextMaxLength: 50,
        // Paths to exclude from indexing
        docsRouteBasePath: '/docs',
      },
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
          to: '/why-fds',
          position: 'left',
          label: 'Why FDS',
        },
        {
          type: 'docSidebar',
          sidebarId: 'useCasesSidebar',
          position: 'left',
          label: 'Use cases',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'doc',
          docId: 'specifications/index',
          label: 'Specifications',
          position: 'left',
        },
        {
          type: 'doc',
          docId: 'schemas/index',
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
          // Not a docs-version switcher: the docs are not versioned, and a
          // dropdown offering one version teaches nothing. This one opens
          // into the release's actual contents — see releaseDropdownItems.
          type: 'dropdown',
          label: currentRelease,
          position: 'left',
          items: [
            {
              type: 'html',
              value: `<span class="fds-dropdown-heading">${localeString(
                'releaseDropdownHeading',
              ).replace('{release}', currentRelease)}</span>`,
            },
            ...releaseDropdownItems,
            {type: 'html', value: '<hr class="dropdown-separator">'},
            {
              to: '/docs/core-concepts/discovery',
              label: 'How versioning works',
            },
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
              label: localeString('helpTranslateLabel'),
            },
          ],
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Use cases',
          items: [
            {
              label: 'What can you do with FDS?',
              to: 'docs/use-cases',
            },
            {
              label: 'Authoring workouts',
              to: 'docs/use-cases/authoring-workouts',
            },
            {
              label: 'Programming',
              to: 'docs/use-cases/programming',
            },
          ],
        },
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
      copyright: `Copyright © ${new Date().getFullYear()} Vitness. Licensed under the <a href="/docs/license">VITNESS Open Standards License Agreement</a>.`,
    },
    prism: {
      // One theme object for both color modes: every color is a CSS custom
      // property, defined for light and dark in src/css/custom.css, so the
      // palette lives with the rest of the site's tokens and a surface that
      // needs a different rendering can re-declare the variables in scope
      // rather than growing a second theme.
      theme: fdsCodeTheme,
      darkTheme: fdsCodeTheme,
      additionalLanguages: ['json', 'typescript', 'bash'],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {start: 'highlight-start', end: 'highlight-end'},
        },
        {
          className: 'code-block-error-line',
          line: 'error-line',
        },
        {
          className: 'code-block-success-line',
          line: 'success-line',
        },
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
