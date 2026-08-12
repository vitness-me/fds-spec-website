import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { Highlight, themes } from 'prism-react-renderer';
import styles from './styles.module.css';

// Every panel in this section is a file that ships in this repository, from
// the transformer's roundtrip fixture — the one `check:transform` runs
// through the built CLI on every pull request. The committed output is
// diffed against a fresh run by that same gate, so this section cannot
// render something the tool does not produce.
import source from '../../../../../packages/fds-transformer/fixtures/roundtrip/source.json';
import mappingConfig from '../../../../../packages/fds-transformer/fixtures/roundtrip/mapping.config.json';
import expected from '../../../../../packages/fds-transformer/fixtures/roundtrip/expected/exercises.json';

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

const command = `npx @vitness/fds-transformer transform \\
    -i source.json -c mapping.config.json -o out/`;

/** Detect dark mode without breaking SSR (mirrors the QuickStart hook). */
function useSafeColorMode(): 'light' | 'dark' {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const read = () =>
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setColorMode(read());
    const observer = new MutationObserver(() => setColorMode(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return colorMode;
}

function CodePanel({ code, theme }: { code: string; theme: typeof themes.vsDark }): JSX.Element {
  return (
    <Highlight theme={theme} code={code} language="json">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={className}
          style={{ ...style, background: 'transparent', backgroundColor: 'transparent', margin: 0 }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default function BeforeAfter(): JSX.Element {
  const colorMode = useSafeColorMode();
  const theme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;

  return (
    <section id="see-it-work" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> the transformer
          </p>
          <h2 className="fdsH2">See it work on a back squat</h2>
          <p className="fdsSub">
            A vendor's export, a mapping you write once, and the document the
            CLI produces — a back squat any FDS reader can validate. All three
            panels are files that ship in this repository, and CI runs this
            exact transform against the published schema on every change.
          </p>
        </div>

        <div className={`fdsTile ${styles.terminal}`}>
          <div className="fdsTileHead">
            <span className={styles.dots} aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className={styles.terminalTitle}>~/roundtrip</span>
          </div>
          <div className={styles.terminalBody}>
            <span className={styles.prompt}>$</span>{' '}
            <span className={styles.terminalCommand}>{command}</span>
            <span className={styles.caret} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.panels}>
          <div className={`fdsTile ${styles.panel}`}>
            <div className="fdsTileHead">
              <span className={styles.stepNo}>1</span>
              <span className={styles.fileName}>source.json</span>
              <span className="fdsPill">vendor export</span>
            </div>
            <div className={styles.codeBlock}>
              <CodePanel code={before} theme={theme} />
            </div>
          </div>

          <div className={`fdsTile ${styles.panel}`}>
            <div className="fdsTileHead">
              <span className={styles.stepNo}>2</span>
              <span className={styles.fileName}>mapping.config.json</span>
              <span className="fdsPill">written once</span>
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

          <div className={`fdsTile ${styles.panel}`}>
            <div className="fdsTileHead">
              <span className={styles.stepNo}>3</span>
              <span className={styles.fileName}>out/exercises.json</span>
              <span className="fdsPill fdsPillOk">valid fds</span>
            </div>
            <div className={`${styles.codeBlock} ${styles.codeBlockTall}`}>
              <CodePanel code={after} theme={theme} />
            </div>
          </div>
        </div>

        <p className={`fdsFootnote ${styles.outro}`}>
          The output panel shows the first of the three documents this fixture
          produces, verbatim from the committed file. Where source data has
          genuine gaps — a description, a classification — the CLI can fill
          them with optional AI enrichment.{' '}
          <Link to="/docs/tools/transformer">Read the transformer docs →</Link>
        </p>
      </div>
    </section>
  );
}
