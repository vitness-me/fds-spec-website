# Internationalization (i18n) and Slug Conventions

This guide specifies language and slug rules used across FDS entities (exercises, equipment, muscles, muscle categories).

## Language Tags
- Use BCP 47 language tags for `localized[*].lang` (e.g., `en`, `en-GB`, `sr`).
- Tags SHOULD be as specific as needed but no more (prefer `en` over `en-US` unless truly necessary).
- Producers SHOULD provide a default locale (typically English) within `canonical`.

## Localization Best Practices
- Provide complete translations for required `canonical` fields when adding a locale entry.
- Avoid partial translations that degrade user experience.
- Keep aliases language‑appropriate and avoid duplicating canonical names in the same language.

## Slug Rules
- Character set: lowercase ASCII `[a-z0-9-]` only.
- Length: at least 2 characters.
- No spaces, no leading/trailing hyphens, compress consecutive hyphens to one.
- Derivation: normalize to NFC, remove diacritics, lowercase, replace spaces/punctuation with hyphens, trim.

## Stability & Uniqueness
- Slugs SHOULD be stable once published to preserve references and bookmarks.
- Slugs MUST be unique within their entity type (e.g., equipment slugs unique among equipment).
- If a slug collision occurs, prefer a minimal disambiguator suffix (`-v2`, `-alt`, or domain‑specific tag like `-barbell`).

## Examples
| Name                      | Slug            |
|--------------------------|-----------------|
| "Back Squat"              | `back-squat`    |
| "Sentadilla trasera"      | `sentadilla-trasera` |
| "Čučanj sa šipkom"        | `cucanj-sa-sipkom` |

## Recommended Fallback
- Consumers SHOULD implement locale fallback: `lang-region` → `lang` → default.
- If no localized entry is available, fall back to canonical `name`.

