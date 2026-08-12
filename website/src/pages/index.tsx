import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
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
import '../css/landing.css';

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>
            <span>{'//'}</span>{' '}
            <Translate id="landing.hero.eyebrow" description="Small label above the hero title">
              an open standard for fitness data
            </Translate>
          </p>
          <Heading as="h1" className={styles.heroTitle}>
            <Translate id="landing.hero.title">
              A back squat should mean the same thing everywhere.
            </Translate>
          </Heading>
          <p className={styles.heroSubtitle}>
            <Translate id="landing.hero.subtitle">
              Every fitness platform describes exercises, equipment and programming
              differently, so every integration is bespoke and every export a dead
              end. FDS is a vendor-neutral standard that gives the fitness domain one
              shared vocabulary — published as JSON Schemas at frozen URLs, with a
              CLI that maps your existing data into it.
            </Translate>
          </p>
          <p className={styles.heroAudience}>
            <Translate id="landing.hero.audience">
              For app developers, platforms, coaches and researchers who need
              training data to move between systems.
            </Translate>
          </p>
          <p className={styles.heroCoverage}>
            <Translate id="landing.hero.coverage.exercises">exercises</Translate>
            <span>·</span>
            <Translate id="landing.hero.coverage.equipment">equipment</Translate>
            <span>·</span>
            <Translate id="landing.hero.coverage.muscles">muscles</Translate>
            <span>·</span>
            <Translate id="landing.hero.coverage.bodyAtlas">body atlas</Translate>
            <span>·</span>
            <Translate id="landing.hero.coverage.workouts">workouts</Translate>
            <span>·</span>
            <Translate id="landing.hero.coverage.programs">programs</Translate>
          </p>
          <div className={styles.heroButtons}>
            <Link className="fdsButtonPrimary" to="/why-fds">
              <Translate id="landing.hero.whyFdsButton">Why FDS</Translate>
            </Link>
            <Link className="fdsButtonGhost" to="/docs/use-cases">
              <Translate id="landing.hero.useCasesButton">Use Cases</Translate>
            </Link>
            <Link className="fdsButtonGhost" to="/docs/getting-started/overview">
              <Translate id="landing.hero.readSpecButton">Read the spec</Translate>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function CTASection() {
  // Defined ahead of the roadmap paragraph so its <Translate> can sit on one
  // line with its message — the fds:count marker above that paragraph is
  // checked against the two lines that follow it, and the sentence carrying
  // "Eight" has to be one of them.
  const roadmapLink = (
    <Link to="/docs/governance/roadmap">
      <Translate id="landing.cta.roadmapLink">roadmap</Translate>
    </Link>
  );
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <Heading as="h2" className={styles.ctaTitle}>
          <Translate id="landing.cta.title">
            Help shape the first stable release
          </Translate>
        </Heading>
        <p className={styles.ctaDescription}>
          <Translate id="landing.cta.description">
            The schemas, the transformer and the AI knowledge pack are ready to
            build against today. What the first stable release locks in is still
            open.
          </Translate>
        </p>
        <div className={styles.ctaButtons}>
          <Link className="fdsButtonPrimary" to="/docs/getting-started/overview">
            <Translate id="landing.cta.docsButton">Read the Documentation</Translate>
          </Link>
          <Link className="fdsButtonGhost" to="https://github.com/vitness-me/fds-spec-website">
            <Translate id="landing.cta.githubButton">GitHub Repository</Translate>
          </Link>
        </div>
        {/* fds:count rfcs=8 */}
        <p className={styles.ctaRoadmap}>
          <Translate id="landing.cta.roadmap" values={{roadmapLink}}>{'Eight RFCs are published: the exercise catalog and its registries, prescription primitives, workouts and programs. What comes next — and what is deliberately left out — is on the {roadmapLink}.'}</Translate>
        </p>
        <div className={styles.earlyAdopters}>
          <p className={styles.earlyAdoptersText}>
            <Translate id="landing.cta.earlyAdoptersText">
              FDS is new. There are no third-party implementations to point to yet,
              and we won’t invent a logo wall to pretend otherwise — the reference
              library and the transformer are its first users. If you build on FDS,
              tell us: early adopters decide what the first stable release commits to.
            </Translate>
          </p>
          <Link className={styles.earlyAdoptersLink} to="/docs/governance/contributing">
            <Translate id="landing.cta.earlyAdoptersLink">
              Become an early adopter →
            </Translate>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({
        id: 'landing.meta.title',
        message: 'Fitness Data Standard',
        description: 'Browser tab title of the landing page',
      })}
      description={translate({
        id: 'landing.meta.description',
        message:
          'An open, vendor-neutral standard for fitness domain data — exercises, equipment, muscles, workouts and programs. One shared vocabulary, published as JSON Schemas at frozen URLs.',
        description: 'Meta description of the landing page',
      })}>
      <HomepageHeader />
      <main className="fdsPage">
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
