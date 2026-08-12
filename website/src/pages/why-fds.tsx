import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './why-fds.module.css';
import '../css/landing.css';

/**
 * The business entry path: the case for adopting FDS with no schema in
 * sight. Portability, interoperability and independence from any one vendor,
 * stated in terms a product owner acts on — and stated no more strongly than
 * the repository can back. The claims about freezing, additive versioning
 * and open governance are the same ones the landing's trust section makes,
 * which CI checks against the release manifest; this page cites no number at
 * all, so it has nothing to drift.
 */
export default function WhyFds(): ReactNode {
  return (
    <Layout
      title="Why adopt FDS"
      description="The business case for the Fitness Data Standard: training content that outlives the app that made it, integrations built once, and a format no vendor can move under you.">
      <main className="fdsPage">
        <header className={styles.header}>
          <div className="fdsContainer">
            <div className={styles.headerInner}>
              <p className="fdsEyebrow">
                <span>{'//'}</span> why FDS
              </p>
              <Heading as="h1" className={styles.title}>
                Training content should outlive the software that made it.
              </Heading>
              <p className={styles.lede}>
                Exercise libraries, equipment catalogs and training programs are
                assets. Today they are stored in whatever private shape each
                platform invented, which quietly turns them into liabilities:
                hard to move, expensive to connect, gone when a vendor is. FDS
                is an open, vendor-neutral format that makes them documents —
                portable, connectable and readable on their own.
              </p>
              <p className={styles.audience}>
                For platform owners, product leads and coaches deciding what
                format their training content lives in. No schemas on this
                page — the <Link to="/docs/use-cases/">use cases</Link> show
                the same argument with the actual files.
              </p>
            </div>
          </div>
        </header>

        <section className={styles.chapters}>
          <div className="fdsContainer">
            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">01</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  Portability: an export that means something
                </Heading>
                <p className={styles.chapterBody}>
                  Most fitness platforms will give you your data on the way
                  out. What they give you is a file only they understand —
                  every exercise name, muscle list and set structure encoded in
                  their private vocabulary. In practice, migrating means
                  rebuilding your content by hand on the other side.
                </p>
                <p className={styles.chapterBody}>
                  In FDS, a catalog or a program is a document in a published
                  format. Any system that reads the standard reads it, with
                  the meaning intact — a back squat arrives as a back squat,
                  with the muscles it targets and the way it is measured.
                  Moving platforms becomes moving files.
                </p>
              </div>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">02</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  Interoperability: integrate once, not once per partner
                </Heading>
                <p className={styles.chapterBody}>
                  Every integration between two fitness systems today starts
                  with the same meeting: what counts as an exercise, whose
                  muscle taxonomy wins, how a superset is written down. The
                  result is a bespoke mapping that breaks whenever either side
                  changes — multiplied by every partner you add.
                </p>
                <p className={styles.chapterBody}>
                  A shared vocabulary collapses that to one mapping: yours,
                  into the standard, written once. Two systems that both speak
                  FDS line up without ever having met. The{' '}
                  <Link to="/#see-it-work">transformer CLI</Link> does the
                  mapping for data you already have — the landing page shows
                  it running on a real vendor export.
                </p>
              </div>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">03</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  Independence: a format no vendor can move under you
                </Heading>
                <p className={styles.chapterBody}>
                  A private format changes when its owner needs it to. FDS is
                  built so that cannot happen to you: every published schema
                  is frozen at a permanent public URL and never edited in
                  place. New versions are additive and ship beside the old
                  ones, which stay served — so a system built against the
                  standard keeps working, on the schedule you choose.
                </p>
                <p className={styles.chapterBody}>
                  The standard itself is developed in the open, through public
                  RFCs — no single company can quietly redefine what your
                  documents mean. And adopting it requires no SDK and no
                  proprietary tooling: it is plain JSON with published
                  schemas, validated by tools your team already uses.
                </p>
              </div>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">04</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  Nothing about people, on purpose
                </Heading>
                <p className={styles.chapterBody}>
                  FDS describes training content, not the people doing the
                  training. There is no athlete identity, no bodyweight, no
                  logged result anywhere in the standard. A catalog or program
                  in FDS is a document about nobody — it can be published,
                  shared with partners, cached and mirrored without carrying
                  personal-data obligations along with it.
                </p>
                <p className={styles.chapterBody}>
                  Where a program needs a personal number — a percentage of
                  someone&apos;s max, say — it references it rather than
                  carrying it. Performed results are deliberately out of scope
                  until there is a consent and privacy model worthy of them;
                  the <Link to="/docs/governance/roadmap">roadmap</Link> is
                  explicit about that line.
                </p>
              </div>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">05</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  Where it stands today
                </Heading>
                <p className={styles.chapterBody}>
                  FDS is new. The schemas, the transformer and the AI knowledge
                  pack are published and ready to build against, and the
                  reference tooling in this repository is their first user.
                  There are no third-party adopters to point to yet, and this
                  site will not invent any — what you see claimed is what the
                  repository can prove.
                </p>
                <p className={styles.chapterBody}>
                  That timing is the opportunity in disguise: what the first
                  stable release locks in is still open, and{' '}
                  <Link to="/docs/governance/contributing">early adopters</Link>{' '}
                  are the ones deciding it.
                </p>
              </div>
            </article>

            <div className={styles.close}>
              <p className={styles.closeText}>
                The shortest path to a decision is watching it work: a real
                vendor export, mapped once, becoming a document any FDS reader
                validates.
              </p>
              <div className="fdsButtonRow">
                <Link className="fdsButtonPrimary" to="/#see-it-work">
                  See it work on a back squat
                </Link>
                <Link className="fdsButtonGhost" to="/docs/use-cases/">
                  What you can do with it
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
