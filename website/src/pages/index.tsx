import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ProblemSection from '@site/src/components/landing/ProblemSection';
import ComparisonDemo from '@site/src/components/landing/ComparisonDemo';
import SolutionSection from '@site/src/components/landing/SolutionSection';
import TrustSection from '@site/src/components/landing/TrustSection';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Open Standard</span>
          <Heading as="h1" className={styles.heroTitle}>
            One Standard for Fitness Data
          </Heading>
          <p className={styles.heroSubtitle}>
            Enable seamless data portability across fitness applications.
            Stop rebuilding integrations. Start speaking the same language.
          </p>
          <div className={styles.heroButtons}>
            <Link
              className={styles.primaryButton}
              to="/docs/specifications/rfc-001-exercise-data-model">
              View Specification
            </Link>
            <Link
              className={styles.secondaryButton}
              to="#problem">
              See the Problem
            </Link>
          </div>
        </div>
      </div>
    </header>
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
          <Link className={styles.secondaryButton} to="https://github.com/anthropics/fds-spec-website">
            GitHub Repository
          </Link>
        </div>
        <p className={styles.ctaRoadmap}>
          Start with exercise data today. Workout templates, progress tracking, and more planned in{' '}
          <Link to="/docs/governance/roadmap">future RFCs</Link>.
        </p>
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
        <ProblemSection />
        <ComparisonDemo />
        <SolutionSection />
        <TrustSection />
        <CTASection />
      </main>
    </Layout>
  );
}
