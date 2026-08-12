import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function SolutionSection(): JSX.Element {
  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> the shape of the fix
          </p>
          <h2 className="fdsH2">How FDS works</h2>
          <p className="fdsSub">
            One standard replaces point-to-point integrations. Each platform
            writes one exporter and one importer against FDS, and connects to
            everyone who did the same.
          </p>
        </div>

        <div className={`fdsTile ${styles.comparison}`}>
          <div className={styles.comparisonSide}>
            <span className={styles.comparisonTag}>without a standard</span>
            <span className={styles.comparisonFormula}>N × (N−1)</span>
            <span className={styles.comparisonExample}>
              4 platforms, 12 bespoke integrations
            </span>
          </div>
          <div className={styles.comparisonSide}>
            <span className={styles.comparisonTag}>with fds</span>
            <span className={styles.comparisonFormula}>N</span>
            <span className={styles.comparisonExample}>
              4 platforms, 4 mappings to one format
            </span>
          </div>
        </div>

        <ul className={styles.highlights}>
          <li>No forced architecture changes — FDS is an exchange format, not your database schema.</li>
          <li>Every document validates against a published JSON Schema.</li>
          <li>Any stack that can read JSON can implement it.</li>
        </ul>

        <div className={styles.extensibility}>
          <div className={styles.extHead}>
            <h3 className={styles.extTitle}>Built-in extensibility</h3>
            <p className={styles.extSubtitle}>
              Add custom fields without breaking compatibility.
            </p>
          </div>

          <div className={styles.extGrid}>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>Vendor namespaces</h4>
              <p className={styles.extItemText}>
                Prefix custom fields with <code>x:yourapp.</code> to add
                platform-specific data that travels with the standard.
              </p>
            </div>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>Safe extensions</h4>
              <p className={styles.extItemText}>
                Other platforms ignore unknown namespaces. Your custom data
                never breaks their imports.
              </p>
            </div>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>Promotion path</h4>
              <p className={styles.extItemText}>
                An extension several implementers adopt can be proposed into
                the core schema through the RFC process.
              </p>
            </div>
          </div>

          <p className={styles.extOutro}>
            <Link to="/docs/core-concepts/extensions" className="fdsQuietLink">
              Read the extension policy →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
