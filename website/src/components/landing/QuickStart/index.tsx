import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
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
            <span>{'//'}</span>{' '}
            <Translate id="landing.quickStart.eyebrow" description="Small label above the quick start section title">
              quick start
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.quickStart.title">No SDK required</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.quickStart.subtitle">
              FDS is JSON Schema at stable URLs. If your stack can read JSON, it
              can implement the standard — start with the schema and any
              validator you already use.
            </Translate>
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>
                  <Translate id="landing.quickStart.step1.title">Get the schema</Translate>
                </h3>
                <p className={styles.stepDescription}>
                  <Translate id="landing.quickStart.step1.description">
                    Download the JSON Schema to validate your exercise data.
                  </Translate>
                </p>
                <Link className="fdsQuietLink" to="/docs/schemas/exercise">
                  <Translate id="landing.quickStart.step1.link">
                    View the exercise schema →
                  </Translate>
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>
                  <Translate id="landing.quickStart.step2.title">Model your data</Translate>
                </h3>
                <p className={styles.stepDescription}>
                  <Translate id="landing.quickStart.step2.description">
                    Structure your exercise data using the FDS format. Start
                    minimal, expand as needed.
                  </Translate>
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>
                  <Translate id="landing.quickStart.step3.title">Validate</Translate>
                </h3>
                <p className={styles.stepDescription}>
                  <Translate id="landing.quickStart.step3.description">
                    Use any JSON Schema validator (ajv, jsonschema, etc.) to
                    ensure compliance.
                  </Translate>
                </p>
                <Link className="fdsQuietLink" to="/docs/getting-started/quick-validation">
                  <Translate id="landing.quickStart.step3.link">
                    Validation guide →
                  </Translate>
                </Link>
              </div>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>
                  <Translate id="landing.quickStart.step4.title">Transform your data</Translate>
                </h3>
                <p className={styles.stepDescription}>
                  <Translate id="landing.quickStart.step4.description">
                    Use the FDS Transformer CLI to convert your existing data to
                    FDS format with optional AI enrichment.
                  </Translate>
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
                  <Translate id="landing.quickStart.step4.link">
                    Transformer docs →
                  </Translate>
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
              footer={translate({
                id: 'landing.quickStart.exampleFooter',
                message:
                  'The published example for the exercise entity — a back squat, verbatim from the spec.',
                description: 'Caption under the example document panel in the quick start section',
              })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
