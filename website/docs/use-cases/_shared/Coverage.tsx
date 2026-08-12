import React from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useLocaleString} from './strings';
import styles from './styles.module.css';

/**
 * The scenario coverage matrix, rendered from the data the coverage-matrix
 * plugin (website/plugins/coverage-matrix.mjs) derives at build time.
 *
 * The plugin reads the same module the gates walk — check:scenarios proves
 * every row has a committed, validating example; check:versions derives
 * every "scenarios" count the documentation quotes from the same list — and
 * joins each row to the one-line description in the README shipped beside
 * its fixtures. A row the READMEs cannot describe fails the build, so
 * everything this component can possibly render is backed. Counts here are
 * computed from the rows, never typed, so the component carries no number a
 * gate has to police.
 */

type Row = {name: string; description: string};
type Section = {title: string; entity: string; rows: Row[]};
type CoverageData = {sections: Section[]; total: number};

/**
 * Where each entity's scenarios are put to work. The entity names come from
 * the matrix module the gates walk; this maps each one to the use-case page
 * that demonstrates its structures. The mapping is editorial — which page
 * best serves a reader — so it lives here rather than being derived. An
 * entity with no page listed renders no link, never a guessed one.
 */
const USE_CASE_PAGES: Record<string, {to: string; labelKey: string}> = {
  workout: {to: '/docs/use-cases/authoring-workouts', labelKey: 'usecase.page.workout'},
  prescription: {to: '/docs/use-cases/prescription', labelKey: 'usecase.page.prescription'},
  program: {to: '/docs/use-cases/programming', labelKey: 'usecase.page.program'},
};

/** Minimal inline markdown: `code`, **strong**, *em*. Everything else literal. */
function Inline({text}: {text: string}): React.ReactElement {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
        if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
}

export function CoverageMatrix(): React.ReactElement {
  const {sections, total} = usePluginData('coverage-matrix') as CoverageData;
  const str = useLocaleString();

  return (
    <section>
      <p>{str('coverage.intro').replace('{total}', String(total))}</p>
      {sections.map((section, index) => (
        // The first section ships open: the matrix is the site's strongest
        // evidence, and fully collapsed it reads as a list of doors instead.
        <details key={section.title} className={styles.coverageSection} open={index === 0}>
          <summary className={styles.coverageSummary}>
            <span className={styles.coverageTitle}>{section.title}</span>
            <span className={styles.coverageChip}>{section.entity}</span>
            <span className={styles.coverageCount}>{section.rows.length}</span>
          </summary>
          <ul className={styles.coverageList}>
            {section.rows.map((row) => (
              <li key={row.name} className={styles.coverageRow}>
                <code className={styles.coverageName}>{row.name}</code>
                <span className={styles.coverageDesc}>
                  <Inline text={row.description} />
                </span>
              </li>
            ))}
          </ul>
          {USE_CASE_PAGES[section.entity] ? (
            <p className={styles.coverageUseCase}>
              <a href={USE_CASE_PAGES[section.entity].to}>
                {str('coverage.seeInUse').replace('{label}', str(USE_CASE_PAGES[section.entity].labelKey))}
              </a>
            </p>
          ) : null}
        </details>
      ))}
      <p className={styles.coverageFootnote}>
        {str('coverage.footnoteBefore')}{' '}
        <a href="/docs/governance/roadmap">{str('coverage.footnoteLink')}</a>{' '}
        {str('coverage.footnoteAfter')}
      </p>
    </section>
  );
}
