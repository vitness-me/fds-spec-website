import React from 'react';
import Link from '@docusaurus/Link';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EditorPanel from '@site/src/components/EditorPanel';
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
const exampleVersion: string = (exampleDocument as unknown as Record<string, string>).schemaVersion;

export default function QuickStart(): React.ReactElement {
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

          <div className={styles.examplePanel}>
            <EditorPanel
              filename="exercise.example.json"
              badge={`v${exampleVersion}`}
              code={example}
              maxHeight="34rem"
              size="sm"
              footer="The published example for the exercise entity — a back squat, verbatim from the spec."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
