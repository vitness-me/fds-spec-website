import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Terminal from '@site/src/components/Terminal';
import EditorPanel from '@site/src/components/EditorPanel';
import styles from './styles.module.css';

// Every panel in this section is a file that ships in this repository, from
// the transformer's roundtrip fixture — the one `check:transform` runs
// through the built CLI on every pull request. The committed output is
// diffed against a fresh run by that same gate, so this section cannot
// render something the tool does not produce.
import source from '../../../../../packages/fds-transformer/fixtures/roundtrip/source.json';
import mappingConfig from '../../../../../packages/fds-transformer/fixtures/roundtrip/mapping.config.json';
import expected from '../../../../../packages/fds-transformer/fixtures/roundtrip/expected/exercises.json';

// The terminal session, recorded from the CLI itself: `check:transform`
// replays this file's command verbatim and diffs the CLI's merged output
// against these lines, so the transcript cannot say anything the tool
// does not print.
import transcript from '../../../../../packages/fds-transformer/fixtures/roundtrip/expected/transcript.json';

// The back squat the hero promises: first record of the fixture.
const before = JSON.stringify(source[0], null, 2);
const after = JSON.stringify(expected[0], null, 2);

// The mapping, read from the committed configuration rather than retyped:
// every rule that maps a source field to a target. Constants and generated
// fields (uuid, timestamps) are left out — they carry no source data.
const mappingRows = Object.entries(mappingConfig.mappings as Record<string, unknown>)
  .map(([target, rule]) => ({ target, rule: rule as { from?: string | null; transform?: string } }))
  .filter(({ rule }) => typeof rule?.from === 'string' && rule.from.length > 0)
  .map(({ target, rule }) => ({ from: rule.from as string, target, transform: rule.transform }));

// The command shown is the command the recording ran, from the same file.
const command = `npx @vitness/fds-transformer ${transcript.command.join(' ')}`;

export default function BeforeAfter(): React.ReactElement {
  return (
    <section id="see-it-work" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.beforeAfter.eyebrow" description="Small label above the transformer demo section title">
              the transformer
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.beforeAfter.title">See it work on a back squat</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.beforeAfter.subtitle">
              A vendor's export, a mapping you write once, and the document the
              CLI produces — a back squat any FDS reader can validate. All three
              panels are files that ship in this repository, and CI runs this
              exact transform against the published schema on every change.
            </Translate>
          </p>
        </div>

        <div className={styles.terminal}>
          <Terminal title="~/roundtrip" command={command} lines={transcript.lines} />
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <EditorPanel
              step="1"
              filename="source.json"
              badge={translate({
                id: 'landing.beforeAfter.badge.vendorExport',
                message: 'vendor export',
                description: 'Badge on the source panel of the transformer demo',
              })}
              code={before}
              size="sm"
            />
          </div>

          <div className={`fdsTile ${styles.panel}`}>
            <div className="fdsTileHead">
              <span className={styles.stepNo}>2</span>
              <span className={styles.fileName}>mapping.config.json</span>
              <span className="fdsPill">
                <Translate id="landing.beforeAfter.badge.writtenOnce" description="Badge on the mapping panel of the transformer demo">
                  written once
                </Translate>
              </span>
            </div>
            <ul className={styles.mappingList}>
              {mappingRows.map((row) => (
                <li key={row.target} className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>{row.from}</span>
                  <span className={styles.mappingArrow} aria-hidden="true">→</span>
                  <span className={styles.mappingTarget}>{row.target}</span>
                  {row.transform && (
                    <span className={styles.mappingTransform}>{row.transform}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <EditorPanel
              step="3"
              filename="out/exercises.json"
              badge={translate({
                id: 'landing.beforeAfter.badge.validFds',
                message: 'valid fds',
                description: 'Badge on the output panel of the transformer demo',
              })}
              badgeTone="ok"
              code={after}
              maxHeight="30rem"
              size="sm"
            />
          </div>
        </div>

        <p className={`fdsFootnote ${styles.outro}`}>
          <Translate
            id="landing.beforeAfter.outro"
            values={{
              docsLink: (
                <Link to="/docs/tools/transformer">
                  <Translate id="landing.beforeAfter.docsLink">
                    Read the transformer docs →
                  </Translate>
                </Link>
              ),
            }}>
            {'The output panel shows the first of the three documents this fixture produces, verbatim from the committed file. Where source data has genuine gaps — a description, a classification — the CLI can fill them with optional AI enrichment. {docsLink}'}
          </Translate>
        </p>
      </div>
    </section>
  );
}
