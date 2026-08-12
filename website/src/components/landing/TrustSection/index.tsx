import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface FeatureCard {
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

const featureCards: FeatureCard[] = [
  {
    title: 'Frozen at permanent URLs',
    description:
      'Every published schema is pinned by sha256 and never changes. A new version ships in a new directory beside the old one, which stays served — so a client pinned to an older release keeps resolving.',
    link: '/docs/core-concepts/discovery',
    linkLabel: 'How versioning works →',
  },
  {
    title: 'Versioned per entity',
    description:
      'A release names a set of entity versions, not one number they all share. Entities move independently, and the release manifest is generated from the published tree — so what the site says is published is what is published.',
    link: '/docs/getting-started/overview',
    linkLabel: 'Read the overview →',
  },
  {
    title: 'Open, additive governance',
    description:
      'Every entity arrived through a public RFC, and changes are additive by rule. The standard is developed in the open so no single vendor can quietly redefine the format under you.',
    link: '/docs/governance',
    linkLabel: 'See how it is governed →',
  },
];

export default function TrustSection(): JSX.Element {
  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> stability
          </p>
          <h2 className="fdsH2">Built to be depended on</h2>
          <p className="fdsSub">
            A format you integrate once should not move under you.
          </p>
        </div>

        <div className={styles.statStrip}>
          <div className={styles.stat}>
            {/* fds:count entities=7 */}
            <span className={styles.statNum}>7</span>
            <span className={styles.statLabel}>entity schemas, each frozen at a permanent URL</span>
          </div>
          <div className={styles.stat}>
            {/* fds:count scenarios=87 */}
            <span className={styles.statNum}>87</span>
            <span className={styles.statLabel}>training scenarios, every one with a worked example</span>
          </div>
          <div className={styles.stat}>
            {/* fds:count examples=136 */}
            <span className={styles.statNum}>136</span>
            <span className={styles.statLabel}>worked examples shipped beside the schemas</span>
          </div>
          <div className={styles.stat}>
            {/* fds:count rfcs=8 */}
            <span className={styles.statNum}>8</span>
            <span className={styles.statLabel}>public RFCs behind the design</span>
          </div>
        </div>

        <div className={styles.featureGrid}>
          {featureCards.map((card) => (
            <div key={card.title} className={styles.featureCard}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <Link to={card.link} className="fdsQuietLink">
                {card.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
