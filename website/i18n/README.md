# Translations

The site is written in English, and English is normative: every translated
documentation page opens with a banner saying so, rendered by
`website/src/theme/DocItem/Content/index.tsx`. Translations are informative
copies — useful, welcome, and by nature the repository's oldest defect shape:
the same content asserted twice with nothing comparing the copies.
`scripts/check-translations.mjs` is the thing that compares. If you touch
anything in this tree, run it; CI runs it on every pull request.

## What lives where

| Path | What it is |
|---|---|
| `locales.json` | The one statement of which locales the site serves. `docusaurus.config.ts` reads it, and so does the gate. A locale ships when it enters `locales`; its label lives in `localeConfigs`. Its `strings` block carries the UI strings the extractor cannot see — components under `website/docs/` (the use-case chrome) and the navbar release dropdown — and the gate holds every locale to the default locale's key set, so a key added there cannot ship untranslated silently. |
| `en/**/*.json` | The committed extraction snapshot — every translatable string the source code, theme and plugin configuration currently contain, as `docusaurus write-translations` finds them. Generated, never edited by hand. |
| `<locale>/**/*.json` | That locale's translations of the snapshot, file-for-file and key-for-key. |
| `<locale>/docusaurus-plugin-content-docs/current/**` | Translated documentation pages, mirroring `website/docs/**` path-for-path. |
| `translation-sources.json` | For every translated file, the sha256 its English source had when the translation was last verified against it. Written by `--update`, never by hand. |

## The workflow

Adding or changing a source string (a `<Translate>` or `translate()` in a
component, a navbar label, a sidebar name):

1. `rm website/i18n/en/**/*.json` — the extractor merges and never prunes, so
   regenerate from nothing.
2. `npm --prefix website run write-translations -- --locale en`
3. `node scripts/check-translations.mjs --update` — canonicalizes key order
   (the extractor's is nondeterministic) and re-records source hashes.
4. Translate the new or changed strings in every locale's copy.

Editing an English documentation page: re-translate what changed in each
locale's copy of the page, then run `--update`. The gate fails every
translation of that page until you do — that is its whole purpose. Running
`--update` without actually reconciling the translation is the same lie as
blindly updating a test snapshot; the hash records that a human verified the
translation against *this* version of the English text.

Translating a documentation page for the first time: copy the English page to
the same path under `<locale>/docusaurus-plugin-content-docs/current/`,
translate the prose, and run `--update`.

## What is never translated

- **Fenced code blocks.** Examples, fixtures, recorded CLI output and schema
  JSON stay byte-identical to the English source — the gate enforces this.
  The standard's own internationalization lives *inside* the data (localized
  `name`/`description` entries in the published examples), not in the docs
  fences.
- **`fds:` markers**, in fences and in `<!-- fds:* -->` comments. Also
  enforced. A sentence a `fds:count` marker annotates states its number **as
  a digit** in a translation (`8 RFC publicados`), never spelled out:
  `check:versions` recognizes digits and English number words, digits are the
  one form every language shares, and a per-language word list in the checker
  would be a hand-kept list waiting to drift.
- Schema field names, entity names, code identifiers, URLs, file names, CLI
  commands, RFC numbers.

## Language policy

- **`es` — Spanish.** Neutral, international Spanish: Latin American lexical
  choices where peninsular and Latin American forms diverge (`ustedes`, never
  `vosotros`), impersonal register for instructions (infinitive or `se`
  constructions over `tú`/`usted`), and one term per domain concept
  throughout — the glossary next to this file is the vocabulary of record.
- **`sr-Latn` — Serbian, Latin script.** Never Cyrillic; the gate rejects any
  Cyrillic code point in an `sr-Latn` file. Full diacritics (č, ć, ž, š, đ —
  never `dj` for `đ`), ijekavian/ekavian: ekavian, and the same
  one-term-per-concept rule.

Domain terms (exercise, equipment, muscle, workout, program, set, rep, tempo,
rest, load, superset, circuit, …) get one translation each, recorded in the
per-locale glossary committed beside the translations, and used everywhere.
