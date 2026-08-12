import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import manifest from '@site/i18n/locales.json';

/**
 * UI strings for the use-case components, resolved per locale from the
 * `strings` block of `website/i18n/locales.json`.
 *
 * These components live under `website/docs/`, which `docusaurus
 * write-translations` does not scan — so their strings cannot ride the
 * extraction snapshot the way `website/src/` strings do. The manifest's
 * `strings` block is the mechanism this site already uses for exactly that
 * situation (the navbar release-dropdown heading), and
 * `scripts/check-translations.mjs` enforces that every locale carries the
 * same key set, so a key added here cannot ship untranslated silently.
 *
 * An unknown key throws, at build time, on every page that renders it: a
 * typo fails the build instead of rendering an empty label.
 */
const STRINGS = manifest.strings as Record<string, Record<string, string>>;

export function useLocaleString(): (key: string) => string {
  const {
    i18n: {currentLocale, defaultLocale},
  } = useDocusaurusContext();
  return (key: string): string => {
    const value = STRINGS[currentLocale]?.[key] ?? STRINGS[defaultLocale]?.[key];
    if (value === undefined) {
      throw new Error(
        `locales.json strings has no "${key}" — add it for every locale in website/i18n/locales.json`,
      );
    }
    return value;
  };
}
