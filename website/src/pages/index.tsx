import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Open Standard</span>
          <Heading as="h1" className={styles.heroTitle}>
            Fitness Data Standard
          </Heading>
          <p className={styles.heroSubtitle}>
            An open, interoperable standard for fitness domain data. Enable seamless data portability and interoperability across fitness applications.
          </p>
          <div className={styles.heroButtons}>
            <Link
              className={styles.primaryButton}
              to="/docs/intro">
              Get Started
            </Link>
            <Link
              className={styles.secondaryButton}
              to="/docs/specifications/rfc-001-exercise-data-model">
              View Specifications
            </Link>
          </div>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}>
              <span className={styles.featureIcon}>✓</span>
              <span>JSON Schema Validation</span>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureIcon}>✓</span>
              <span>Semantic Versioning</span>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureIcon}>✓</span>
              <span>RFC Process</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

interface FeatureItem {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Exercise Data Model',
    description: 'Comprehensive exercise definitions with classification, muscle targets, equipment, and media assets. RFC-001 defines the core structure.',
    icon: '💪',
    link: '/docs/specifications/rfc-001-exercise-data-model',
  },
  {
    title: 'Registry Entities',
    description: 'Standardized equipment, muscle, and body atlas models. Shared taxonomies for consistent data exchange across platforms.',
    icon: '📊',
    link: '/docs/specifications/rfc-002-equipment-data-model',
  },
  {
    title: 'Extensibility',
    description: 'Platform-specific extensions without breaking compatibility. Vendor namespaces and attribute system for custom data.',
    icon: '🔌',
    link: '/docs/core-concepts/extensions',
  },
  {
    title: 'JSON Schema',
    description: 'Draft 2020-12 schemas with validation rules and examples. Programmatic validation for all entity types.',
    icon: '📝',
    link: '/docs/schemas',
  },
  {
    title: 'Internationalization',
    description: 'Multilingual support with BCP 47 language tags. Localized names, descriptions, and aliases for global accessibility.',
    icon: '🌍',
    link: '/docs/core-concepts/internationalization',
  },
  {
    title: 'Open Governance',
    description: 'Community-driven RFC process with transparent decision-making. Contribute improvements and propose new features.',
    icon: '🤝',
    link: '/docs/governance',
  },
];

function Feature({title, description, icon, link}: FeatureItem) {
  return (
    <Link to={link} className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
      <span className={styles.featureLink}>Learn more →</span>
    </Link>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className={styles.featuresContainer}>
        <div className={styles.featuresGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <Heading as="h2" className={styles.ctaTitle}>
          Ready to integrate FDS?
        </Heading>
        <p className={styles.ctaDescription}>
          Start building interoperable fitness applications with standardized data models.
        </p>
        <div className={styles.ctaButtons}>
          <Link className={styles.primaryButton} to="/docs/getting-started/overview">
            View Documentation
          </Link>
          <Link className={styles.secondaryButton} to="https://github.com/vitness-me/fds-spec-website">
            GitHub Repository
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Fitness Data Standard"
      description="An open, interoperable standard for fitness domain data. Enable seamless data portability across fitness applications.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CTASection />
      </main>
    </Layout>
  );
}
