import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { Highlight, themes } from 'prism-react-renderer';
import { ArrowRight } from 'lucide-react';
import styles from './styles.module.css';

// The panels below are rendered from files that ship in the repository and are
// exercised by the transformer's own tests — never hand-authored here. The
// "before" is a real vendor-shaped export; the "after" is exactly what the
// transformer produces from it. Importing them means this section cannot drift
// from the tool it demonstrates.
import sourceDb from '../../../../../packages/fds-skill/examples/source-schemas/simple-exercise-db.json';
import transformed from '../../../../../packages/fds-skill/examples/expected-outputs/simple-exercise-transformed.json';

// Same exercise on both sides: barbell bench press (legacy id 0025).
const INDEX = 1;
const before = JSON.stringify(sourceDb.examples[INDEX], null, 2);
const after = JSON.stringify(transformed[INDEX], null, 2);

const command = `npx @vitness/fds-transformer transform \\
  --input exercises.json \\
  --config mapping.json`;

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
        <pre className={className} style={{ ...style, background: 'transparent', margin: 0 }}>
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
    <section id="see-it-work" className={styles.beforeAfterSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>See it work on real data</h2>
        <p className={styles.sectionSubtitle}>
          One exercise, from a raw platform export to a document any FDS reader
          can validate. Both panels are files that ship in the repository — not
          a mock-up.
        </p>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTag}>Before</span>
              <span className={styles.panelLabel}>a platform's own export</span>
            </div>
            <div className={styles.codeBlock}>
              <CodePanel code={before} theme={theme} />
            </div>
          </div>

          <div className={styles.arrow} aria-hidden="true">
            <ArrowRight size={22} />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTagGood}>After</span>
              <span className={styles.panelLabel}>valid FDS, ready to publish</span>
            </div>
            <div className={styles.codeBlock}>
              <CodePanel code={after} theme={theme} />
            </div>
          </div>
        </div>

        <div className={styles.commandRow}>
          <p className={styles.commandCaption}>
            You describe the mapping once; the transformer CLI does the rest, and
            fills genuine gaps — a description, a classification — with optional
            AI enrichment.
          </p>
          <div className={styles.commandBlock}>
            <CodePanel code={command} theme={theme} />
          </div>
        </div>

        <p className={styles.outro}>
          <Link to="/docs/tools/transformer">Read the transformer docs →</Link>
        </p>
      </div>
    </section>
  );
}
