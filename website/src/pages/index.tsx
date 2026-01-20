import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ProblemSection from '@site/src/components/landing/ProblemSection';
import ComparisonDemo from '@site/src/components/landing/ComparisonDemo';
import UseCases from '@site/src/components/landing/UseCases';
import SolutionSection from '@site/src/components/landing/SolutionSection';
import QuickStart from '@site/src/components/landing/QuickStart';
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
            Stop reverse-engineering every platform's data format.
          </p>
          <div className={styles.audienceBadges}>
            <span className={styles.audienceBadge}>For App Developers</span>
            <span className={styles.audienceBadge}>Platform Builders</span>
            <span className={styles.audienceBadge}>Data Engineers</span>
          </div>
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
          <Link className={styles.secondaryButton} to="https://github.com/vitness-me/fds-spec-website">
            GitHub Repository
          </Link>
        </div>
        <p className={styles.ctaRoadmap}>
          Start with exercise data today. Workout templates, progress tracking, and more planned in{' '}
          <Link to="/docs/governance/roadmap">future RFCs</Link>.
        </p>
        <div className={styles.earlyAdopters}>
          <p className={styles.earlyAdoptersText}>
            We're seeking early adopters to shape the standard. Implement FDS, share feedback, and help build the foundation for fitness data interoperability.
          </p>
          <Link className={styles.earlyAdoptersLink} to="/docs/governance/contributing">
            Become an Early Adopter →
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
        <ProblemSection />
        <ComparisonDemo />
        <UseCases />
        <SolutionSection />
        <QuickStart />
        <TrustSection />
        <CTASection />
      </main>
    </Layout>
  );
}
