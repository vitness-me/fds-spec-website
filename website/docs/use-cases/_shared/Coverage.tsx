import React from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';
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

  return (
    <section>
      <p>
        The scenario coverage matrix behind that claim — {total} training
        structures, from straight sets to wave loading to a peaking program.
        Every row names a committed example file that validates against its
        published schema in CI, and each description below is read from the
        README that ships beside those fixtures. Nothing on this list is
        retyped for the website.
      </p>
      {sections.map((section) => (
        <details key={section.title} className={styles.coverageSection}>
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
        </details>
      ))}
      <p className={styles.coverageFootnote}>
        Two sections of the planning matrix are absent on purpose: performed
        results (logging) are deferred until a consent and privacy model
        exists, because FDS models no person; and the cross-cutting concerns
        are answered in the RFCs rather than by fixtures. The{' '}
        <a href="/docs/governance/roadmap">roadmap</a> says which is which.
      </p>
    </section>
  );
}
