import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ProblemSection from '@site/src/components/landing/ProblemSection';
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
            Exercises, the registries they reference, prescribed workouts and
            the programs that schedule them — one open, versioned format.
            Stop reverse-engineering every platform's data format.
          </p>
          <div className={styles.coverageBadges}>
            <span className={styles.coverageBadge}>Exercises</span>
            <span className={styles.coverageBadge}>Equipment, Muscles &amp; Body Atlas</span>
            <span className={styles.coverageBadge}>Workouts</span>
            <span className={styles.coverageBadge}>Programs</span>
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
          Eight RFCs are published: the exercise catalog and its registries, prescription
          primitives, workouts and programs. What comes next — and what is deliberately
          left out — is on the{' '}
          <Link to="/docs/governance/roadmap">roadmap</Link>.
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
        <UseCases />
        <SolutionSection />
        <QuickStart />
        <TrustSection />
        <CTASection />
      </main>
    </Layout>
  );
}
