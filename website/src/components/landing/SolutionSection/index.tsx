import React from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

export default function SolutionSection(): JSX.Element {
  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.solution.eyebrow" description="Small label above the solution section title">
              the shape of the fix
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.solution.title">How FDS works</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.solution.subtitle">
              One standard replaces point-to-point integrations. Each platform
              writes one exporter and one importer against FDS, and connects to
              everyone who did the same.
            </Translate>
          </p>
        </div>

        <div className={`fdsTile ${styles.comparison}`}>
          <div className={styles.comparisonSide}>
            <span className={styles.comparisonTag}>
              <Translate id="landing.solution.without.tag">without a standard</Translate>
            </span>
            <span className={styles.comparisonFormula}>N × (N−1)</span>
            <span className={styles.comparisonExample}>
              <Translate id="landing.solution.without.example">
                4 platforms, 12 bespoke integrations
              </Translate>
            </span>
          </div>
          <div className={styles.comparisonSide}>
            <span className={styles.comparisonTag}>
              <Translate id="landing.solution.with.tag">with fds</Translate>
            </span>
            <span className={styles.comparisonFormula}>N</span>
            <span className={styles.comparisonExample}>
              <Translate id="landing.solution.with.example">
                4 platforms, 4 mappings to one format
              </Translate>
            </span>
          </div>
        </div>

        <ul className={styles.highlights}>
          <li>
            <Translate id="landing.solution.highlight.exchangeFormat">
              No forced architecture changes — FDS is an exchange format, not your database schema.
            </Translate>
          </li>
          <li>
            <Translate id="landing.solution.highlight.validates">
              Every document validates against a published JSON Schema.
            </Translate>
          </li>
          <li>
            <Translate id="landing.solution.highlight.anyStack">
              Any stack that can read JSON can implement it.
            </Translate>
          </li>
        </ul>

        <div className={styles.extensibility}>
          <div className={styles.extHead}>
            <h3 className={styles.extTitle}>
              <Translate id="landing.solution.ext.title">Built-in extensibility</Translate>
            </h3>
            <p className={styles.extSubtitle}>
              <Translate id="landing.solution.ext.subtitle">
                Add custom fields without breaking compatibility.
              </Translate>
            </p>
          </div>

          <div className={styles.extGrid}>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>
                <Translate id="landing.solution.ext.namespaces.title">Vendor namespaces</Translate>
              </h4>
              <p className={styles.extItemText}>
                <Translate
                  id="landing.solution.ext.namespaces.text"
                  values={{prefix: <code>x:yourapp.</code>}}>
                  {'Prefix custom fields with {prefix} to add platform-specific data that travels with the standard.'}
                </Translate>
              </p>
            </div>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>
                <Translate id="landing.solution.ext.safe.title">Safe extensions</Translate>
              </h4>
              <p className={styles.extItemText}>
                <Translate id="landing.solution.ext.safe.text">
                  Other platforms ignore unknown namespaces. Your custom data
                  never breaks their imports.
                </Translate>
              </p>
            </div>
            <div className={styles.extItem}>
              <h4 className={styles.extItemTitle}>
                <Translate id="landing.solution.ext.promotion.title">Promotion path</Translate>
              </h4>
              <p className={styles.extItemText}>
                <Translate id="landing.solution.ext.promotion.text">
                  An extension several implementers adopt can be proposed into
                  the core schema through the RFC process.
                </Translate>
              </p>
            </div>
          </div>

          <p className={styles.extOutro}>
            <Link to="/docs/core-concepts/extensions" className="fdsQuietLink">
              <Translate id="landing.solution.ext.outro">
                Read the extension policy →
              </Translate>
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
