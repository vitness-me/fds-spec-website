import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { Highlight, themes } from 'prism-react-renderer';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import styles from './styles.module.css';

// The published example for the exercise entity, verbatim — the same file
// served beside the schema. Importing it (rather than retyping a "minimal"
// document here) means this panel is validated by the same gates as the
// spec, and the version it names is the file's own, not this page's claim.
import exampleDocument from '../../../../../specification/schemas/exercises/v1.1.0/exercise.example.json';

const example = JSON.stringify(exampleDocument, null, 2);

// The version badge shows the imported document's own claim, read from the
// file rather than typed here.
// fds:ignore an accessor into the imported published example, not an embedded document; the file it reads is validated where it lives
const exampleVersion: string = (exampleDocument as Record<string, string>).schemaVersion;

/**
 * Custom hook to safely detect dark mode during SSR
 * Falls back to light mode during server-side rendering
 */
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

export default function QuickStart(): JSX.Element {
  const [copied, setCopied] = useState(false);
  const colorMode = useSafeColorMode();
  const theme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;

  const handleCopy = () => {
    navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="quick-start" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> quick start
          </p>
          <h2 className="fdsH2">No SDK required</h2>
          <p className="fdsSub">
            FDS is JSON Schema at stable URLs. If your stack can read JSON, it
            can implement the standard — start with the schema and any
            validator you already use.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Get the schema</h3>
                <p className={styles.stepDescription}>
                  Download the JSON Schema to validate your exercise data.
                </p>
                <Link className="fdsQuietLink" to="/docs/schemas/exercise">
                  View the exercise schema →
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Model your data</h3>
                <p className={styles.stepDescription}>
                  Structure your exercise data using the FDS format. Start
                  minimal, expand as needed.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Validate</h3>
                <p className={styles.stepDescription}>
                  Use any JSON Schema validator (ajv, jsonschema, etc.) to
                  ensure compliance.
                </p>
                <Link className="fdsQuietLink" to="/docs/getting-started/quick-validation">
                  Validation guide →
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Transform your data</h3>
                <p className={styles.stepDescription}>
                  Use the FDS Transformer CLI to convert your existing data to
                  FDS format with optional AI enrichment.
                </p>
                <div className={styles.installTabs}>
                  <Tabs groupId="package-manager" queryString>
                    <TabItem value="pnpm" label="pnpm" default>
                      <code className={styles.codeSnippet}>pnpm add -g @vitness/fds-transformer</code>
                    </TabItem>
                    <TabItem value="npm" label="npm">
                      <code className={styles.codeSnippet}>npm install -g @vitness/fds-transformer</code>
                    </TabItem>
                    <TabItem value="yarn" label="yarn">
                      <code className={styles.codeSnippet}>yarn global add @vitness/fds-transformer</code>
                    </TabItem>
                  </Tabs>
                </div>
                <Link className="fdsQuietLink" to="/docs/tools/transformer">
                  Transformer docs →
                </Link>
              </div>
            </div>
          </div>

          <div className={`fdsTile ${styles.examplePanel}`}>
            <div className="fdsTileHead">
              <span className={styles.fileName}>exercise.example.json</span>
              <span className="fdsPill">v{exampleVersion}</span>
              <button className={styles.copyButton} onClick={handleCopy} type="button">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className={styles.codeBlock}>
              <Highlight theme={theme} code={example} language="json">
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
            </div>
            <p className={styles.exampleCaption}>
              The published example for the exercise entity — a back squat,
              verbatim from the spec.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
