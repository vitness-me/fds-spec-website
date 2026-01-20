import React from 'react';
import styles from './styles.module.css';

const platforms = ['FitApp Pro', 'GymTracker', 'WorkoutDB', 'IronLog'];

export default function SolutionSection(): JSX.Element {
  return (
    <section className={styles.solutionSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>How FDS Works</h2>
        <p className={styles.sectionSubtitle}>
          One standard replaces countless point-to-point integrations
        </p>

        {/* Hub Diagram */}
        <div className={styles.hubSection}>
          <div className={styles.hubDiagram}>
            <div className={styles.platformsGrid}>
              {platforms.map((platform, idx) => (
                <div key={idx} className={styles.platformItem}>
                  <div className={styles.platformNode}>
                    <span className={styles.platformLabel}>{platform}</span>
                  </div>
                  <div className={styles.connectorLine} />
                </div>
              ))}
            </div>
            <div className={styles.hubCenter}>
              <span className={styles.hubLabel}>FDS</span>
              <span className={styles.hubSublabel}>Common Language</span>
            </div>
          </div>

          <div className={styles.hubExplanation}>
            <div className={styles.comparison}>
              <div className={styles.comparisonItem}>
                <span className={styles.comparisonBad}>Without FDS</span>
                <span className={styles.comparisonFormula}>N × (N-1) integrations</span>
                <span className={styles.comparisonExample}>4 apps = 12 integrations</span>
              </div>
              <div className={styles.comparisonDivider}>→</div>
              <div className={styles.comparisonItem}>
                <span className={styles.comparisonGood}>With FDS</span>
                <span className={styles.comparisonFormula}>N integrations</span>
                <span className={styles.comparisonExample}>4 apps = 4 integrations</span>
              </div>
            </div>
            <p className={styles.hubDescription}>
              Each platform writes one exporter and one importer.
              FDS handles the translation, so you integrate once and connect to everyone.
            </p>
          </div>
        </div>

        {/* Core Benefits */}
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
            <span className={styles.highlightText}>Works with any tech stack</span>
          </div>
        </div>

        {/* Tool Callout */}
        <div className={styles.toolCallout}>
          <div className={styles.toolBadge}>Coming Soon</div>
          <h3 className={styles.toolTitle}>Schema Transformer & Validation</h3>
          <p className={styles.toolDescription}>
            Automated mapping from your existing schema to FDS format.
            Optional AI assistance fills gaps when source data fields are missing.
          </p>
        </div>

        {/* Extensibility Section */}
        <div className={styles.extensibilitySection}>
          <h3 className={styles.extensibilityTitle}>Built-in Extensibility</h3>
          <p className={styles.extensibilitySubtitle}>
            Add custom fields without breaking compatibility
          </p>

          <div className={styles.extensibilityGrid}>
            <div className={styles.extensibilityCard}>
              <span className={styles.extensibilityIcon}>🏷️</span>
              <h4 className={styles.extensibilityCardTitle}>Vendor Namespaces</h4>
              <p className={styles.extensibilityCardText}>
                Prefix custom fields with <code>x:yourapp.</code> to add platform-specific data that travels with the standard.
              </p>
            </div>
            <div className={styles.extensibilityCard}>
              <span className={styles.extensibilityIcon}>🔒</span>
              <h4 className={styles.extensibilityCardTitle}>Safe Extensions</h4>
              <p className={styles.extensibilityCardText}>
                Other platforms ignore unknown namespaces. Your custom data never breaks their imports.
              </p>
            </div>
            <div className={styles.extensibilityCard}>
              <span className={styles.extensibilityIcon}>🔄</span>
              <h4 className={styles.extensibilityCardTitle}>Round-trip Preservation</h4>
              <p className={styles.extensibilityCardText}>
                Extensions survive export → import cycles. Data you add comes back intact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
