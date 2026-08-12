import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

interface FeatureCard {
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

export default function TrustSection(): JSX.Element {
  const featureCards: FeatureCard[] = [
    {
      title: translate({
        id: 'landing.trust.frozen.title',
        message: 'Frozen at permanent URLs',
      }),
      description: translate({
        id: 'landing.trust.frozen.description',
        message:
          'Every published schema is pinned by sha256 and never changes. A new version ships in a new directory beside the old one, which stays served — so a client pinned to an older release keeps resolving.',
      }),
      link: '/docs/core-concepts/discovery',
      linkLabel: translate({
        id: 'landing.trust.frozen.linkLabel',
        message: 'How versioning works →',
      }),
    },
    {
      title: translate({
        id: 'landing.trust.perEntity.title',
        message: 'Versioned per entity',
      }),
      description: translate({
        id: 'landing.trust.perEntity.description',
        message:
          'A release names a set of entity versions, not one number they all share. Entities move independently, and the release manifest is generated from the published tree — so what the site says is published is what is published.',
      }),
      link: '/docs/getting-started/overview',
      linkLabel: translate({
        id: 'landing.trust.perEntity.linkLabel',
        message: 'Read the overview →',
      }),
    },
    {
      title: translate({
        id: 'landing.trust.governance.title',
        message: 'Open, additive governance',
      }),
      description: translate({
        id: 'landing.trust.governance.description',
        message:
          'Every entity arrived through a public RFC, and changes are additive by rule. The standard is developed in the open so no single vendor can quietly redefine the format under you.',
      }),
      link: '/docs/governance',
      linkLabel: translate({
        id: 'landing.trust.governance.linkLabel',
        message: 'See how it is governed →',
      }),
    },
  ];

  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.trust.eyebrow" description="Small label above the stability section title">
              stability
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.trust.title">Built to be depended on</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.trust.subtitle">
              A format you integrate once should not move under you.
            </Translate>
          </p>
        </div>

        <div className={styles.statStrip}>
          <div className={styles.stat}>
            {/* fds:count entities=7 */}
            <span className={styles.statNum}>7</span>
            <span className={styles.statLabel}>
              <Translate id="landing.trust.stat.entities">
                entity schemas, each frozen at a permanent URL
              </Translate>
            </span>
          </div>
          <div className={styles.stat}>
            {/* fds:count scenarios=87 */}
            <span className={styles.statNum}>87</span>
            <span className={styles.statLabel}>
              <Translate id="landing.trust.stat.scenarios">
                training scenarios, every one with a worked example
              </Translate>
            </span>
          </div>
          <div className={styles.stat}>
            {/* fds:count examples=136 */}
            <span className={styles.statNum}>136</span>
            <span className={styles.statLabel}>
              <Translate id="landing.trust.stat.examples">
                worked examples shipped beside the schemas
              </Translate>
            </span>
          </div>
          <div className={styles.stat}>
            {/* fds:count rfcs=8 */}
            <span className={styles.statNum}>8</span>
            <span className={styles.statLabel}>
              <Translate id="landing.trust.stat.rfcs">
                public RFCs behind the design
              </Translate>
            </span>
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
