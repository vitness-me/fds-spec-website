import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { Highlight, themes } from 'prism-react-renderer';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import styles from './styles.module.css';

/**
 * Custom hook to safely detect dark mode during SSR
 * Falls back to light mode during server-side rendering
 */
function useSafeColorMode(): 'light' | 'dark' {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initial detection
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setColorMode(isDark ? 'dark' : 'light');

    // Watch for changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          setColorMode(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return colorMode;
}

const minimalExample = `{
  "schemaVersion": "1.0.0",
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "canonical": {
    "name": "Back Squat",
    "slug": "back-squat"
  },
  "classification": {
    "exerciseType": "strength",
    "movement": "squat",
    "mechanics": "compound",
    "force": "push",
    "level": "intermediate"
  },
  "targets": {
    "primary": [
      { "id": "mus.quadriceps", "name": "Quadriceps", "categoryId": "cat.legs" }
    ]
  },
  "metrics": {
    "primary": { "type": "reps", "unit": "count" }
  },
  "metadata": {
    "createdAt": "2025-09-02T15:00:00Z",
    "updatedAt": "2025-09-02T15:00:00Z",
    "status": "active"
  }
}`;

export default function QuickStart(): JSX.Element {
  const [copied, setCopied] = useState(false);
  const colorMode = useSafeColorMode();
  const theme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;

  const handleCopy = () => {
    navigator.clipboard.writeText(minimalExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="quick-start" className={styles.quickStartSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Quick Start</h2>
        <p className={styles.sectionSubtitle}>
          No SDK required. Start with the JSON Schema.
        </p>

        <div className={styles.content}>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Get the Schema</h3>
                <p className={styles.stepDescription}>
                  Download the JSON Schema to validate your exercise data.
                </p>
                <Link
                  className={styles.stepLink}
                  to="/docs/schemas/exercise"
                >
                  View Exercise Schema →
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Model Your Data</h3>
                <p className={styles.stepDescription}>
                  Structure your exercise data using the FDS format. Start minimal, expand as needed.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Validate</h3>
                <p className={styles.stepDescription}>
                  Use any JSON Schema validator (ajv, jsonschema, etc.) to ensure compliance.
                </p>
                <Link
                  className={styles.stepLink}
                  to="/docs/getting-started/quick-validation"
                >
                  Validation Guide →
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Transform Your Data</h3>
                <p className={styles.stepDescription}>
                  Use the FDS Transformer CLI to convert your existing data to FDS format with optional AI enrichment.
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
                <Link
                  className={styles.stepLink}
                  to="/docs/tools/transformer"
                >
                  Transformer Docs →
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.examplePanel}>
            <div className={styles.exampleHeader}>
              <span className={styles.exampleTitle}>Minimal Valid Exercise</span>
              <button
                className={styles.copyButton}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className={styles.codeBlock}>
              <Highlight
                theme={theme}
                code={minimalExample}
                language="json"
              >
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
