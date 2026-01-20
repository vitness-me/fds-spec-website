import React from 'react';
import styles from './styles.module.css';

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Export',
    description: 'Platform converts internal data to FDS format',
  },
  {
    number: '2',
    title: 'Validate',
    description: 'JSON Schema ensures data integrity',
  },
  {
    number: '3',
    title: 'Import',
    description: 'Receiving platform maps FDS to internal model',
  },
];

export default function SolutionSection(): JSX.Element {
  return (
    <section className={styles.solutionSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>How FDS Works</h2>
        <p className={styles.sectionSubtitle}>
          Platforms keep their internal models. FDS is the bridge.
        </p>

        <div className={styles.flowDiagram}>
          <div className={styles.flowBox}>
            <span className={styles.flowLabel}>Platform A</span>
            <span className={styles.flowSublabel}>Internal Model</span>
          </div>

          <div className={styles.flowSteps}>
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className={styles.flowArrow}>→</span>}
                <div className={styles.step}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepDescription}>{step.description}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className={styles.flowBox}>
            <span className={styles.flowLabel}>Platform B</span>
            <span className={styles.flowSublabel}>Internal Model</span>
          </div>
        </div>

        <div className={styles.highlights}>
          <div className={styles.highlight}>
            <span className={styles.highlightIcon}>✓</span>
            <span className={styles.highlightText}>No forced architecture changes</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightIcon}>✓</span>
            <span className={styles.highlightText}>Validated data exchange</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightIcon}>✓</span>
            <span className={styles.highlightText}>Extensible for custom needs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
