import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ProblemSection from '@site/src/components/landing/ProblemSection';
import CapabilityLayer from '@site/src/components/landing/CapabilityLayer';
import BeforeAfter from '@site/src/components/landing/BeforeAfter';
import SolutionSection from '@site/src/components/landing/SolutionSection';
import NoPersonalData from '@site/src/components/landing/NoPersonalData';
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
            A back squat should mean the same thing everywhere.
          </Heading>
          <p className={styles.heroSubtitle}>
            Every fitness platform describes exercises, equipment and programming
            differently, so every integration is bespoke and every export a dead
            end. FDS is a vendor-neutral standard that gives the fitness domain one
            shared vocabulary — published as JSON Schemas at frozen URLs, with a
            CLI that maps your existing data into it.
          </p>
          <p className={styles.heroAudience}>
            For app developers, platforms, coaches and researchers who need
            training data to move between systems.
          </p>
          <div className={styles.coverageBadges}>
            <span className={styles.coverageBadge}>Exercises</span>
            <span className={styles.coverageBadge}>Equipment, Muscles &amp; Body Atlas</span>
            <span className={styles.coverageBadge}>Workouts</span>
            <span className={styles.coverageBadge}>Programs</span>
          </div>
          <div className={styles.heroButtons}>
            <a className={styles.primaryButton} href="#see-it-work">
              See a real mapping
            </a>
            <Link
              className={styles.secondaryButton}
              to="/docs/getting-started/overview">
              Read the spec
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
          Help shape the first stable release
        </Heading>
        <p className={styles.ctaDescription}>
          The schemas, the transformer and the AI knowledge pack are ready to
          build against today. What the first stable release locks in is still
          open.
        </p>
        <div className={styles.ctaButtons}>
          <Link className={styles.primaryButton} to="/docs/getting-started/overview">
            Read the Documentation
          </Link>
          <Link className={styles.secondaryButton} to="https://github.com/vitness-me/fds-spec-website">
            GitHub Repository
          </Link>
        </div>
        {/* fds:count rfcs=8 */}
        <p className={styles.ctaRoadmap}>
          Eight RFCs are published: the exercise catalog and its registries, prescription
          primitives, workouts and programs. What comes next — and what is deliberately
          left out — is on the{' '}
          <Link to="/docs/governance/roadmap">roadmap</Link>.
        </p>
        <div className={styles.earlyAdopters}>
          <p className={styles.earlyAdoptersText}>
            FDS is new. There are no third-party implementations to point to yet,
            and we won’t invent a logo wall to pretend otherwise — the reference
            library and the transformer are its first users. If you build on FDS,
            tell us: early adopters decide what the first stable release commits to.
          </p>
          <Link className={styles.earlyAdoptersLink} to="/docs/governance/contributing">
            Become an early adopter →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Fitness Data Standard"
      description="An open, vendor-neutral standard for fitness domain data — exercises, equipment, muscles, workouts and programs. One shared vocabulary, published as JSON Schemas at frozen URLs.">
      <HomepageHeader />
      <main>
        <ProblemSection />
        <CapabilityLayer />
        <BeforeAfter />
        <SolutionSection />
        <NoPersonalData />
        <QuickStart />
        <TrustSection />
        <CTASection />
      </main>
    </Layout>
  );
}
