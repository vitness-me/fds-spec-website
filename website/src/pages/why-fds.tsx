import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
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
 *
 * Each chapter carries an evidence aside in the right column: the claim is
 * prose, but somewhere on this site there is an artifact that backs it, and
 * the aside points there. The rail is why the page is two columns — a
 * numbered brief with its margin notes, not prose floating in half a page.
 *
 * Every user-facing string is wrapped for translation. The IDs are stable
 * keys (`whyFds.*`); the English text beside each one is the source of
 * truth, and scripts/check-translations.mjs is what keeps the locales from
 * quietly drifting behind it.
 */
export default function WhyFds(): ReactNode {
  return (
    <Layout
      title={translate({
        id: 'whyFds.meta.title',
        message: 'Why adopt FDS',
        description: 'Browser tab title of the /why-fds page',
      })}
      description={translate({
        id: 'whyFds.meta.description',
        message:
          'The business case for the Fitness Data Standard: training content that outlives the app that made it, integrations built once, and a format no vendor can move under you.',
        description: 'Meta description of the /why-fds page',
      })}>
      <main className="fdsPage">
        <header className={styles.header}>
          <div className="fdsContainer">
            <div className={styles.headerInner}>
              <p className="fdsEyebrow">
                <span>{'//'}</span>{' '}
                <Translate id="whyFds.eyebrow" description="Small label above the /why-fds page title">
                  why FDS
                </Translate>
              </p>
              <Heading as="h1" className={styles.title}>
                <Translate id="whyFds.title">
                  Training content should outlive the software that made it.
                </Translate>
              </Heading>
              <p className={styles.lede}>
                <Translate id="whyFds.lede">
                  Exercise libraries, equipment catalogs and training programs are
                  assets. Today they are stored in whatever private shape each
                  platform invented, which quietly turns them into liabilities:
                  hard to move, expensive to connect, gone when a vendor is. FDS
                  is an open, vendor-neutral format that makes them documents —
                  portable, connectable and readable on their own.
                </Translate>
              </p>
              <p className={styles.audience}>
                <Translate
                  id="whyFds.audience"
                  values={{
                    useCasesLink: (
                      <Link to="/docs/use-cases/">
                        <Translate id="whyFds.audience.useCasesLink">use cases</Translate>
                      </Link>
                    ),
                  }}>
                  {'For platform owners, product leads and coaches deciding what format their training content lives in. No schemas on this page — the {useCasesLink} show the same argument with the actual files.'}
                </Translate>
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
                  <Translate id="whyFds.portability.title">
                    Portability: an export that means something
                  </Translate>
                </Heading>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.portability.body1">
                    Most fitness platforms will give you your data on the way
                    out. What they give you is a file only they understand —
                    every exercise name, muscle list and set structure encoded in
                    their private vocabulary. In practice, migrating means
                    rebuilding your content by hand on the other side.
                  </Translate>
                </p>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.portability.body2">
                    In FDS, a catalog or a program is a document in a published
                    format. Any system that reads the standard reads it, with
                    the meaning intact — a back squat arrives as a back squat,
                    with the muscles it targets and the way it is measured.
                    Moving platforms becomes moving files.
                  </Translate>
                </p>
              </div>
              <aside className={styles.chapterAside}>
                <p className={styles.asideLead}>
                  <Translate id="whyFds.aside.lead" description="Small label above each evidence link in the right rail">
                    the evidence
                  </Translate>
                </p>
                <Link className={styles.asideLink} to="/docs/use-cases/exercise-catalog">
                  <Translate id="whyFds.portability.asideLink">
                    Exercise catalog use case →
                  </Translate>
                </Link>
                <p className={styles.asideNote}>
                  <Translate id="whyFds.portability.asideNote">
                    A complete exercise from a published file — the document that moves.
                  </Translate>
                </p>
              </aside>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">02</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  <Translate id="whyFds.interoperability.title">
                    Interoperability: integrate once, not once per partner
                  </Translate>
                </Heading>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.interoperability.body1">
                    Every integration between two fitness systems today starts
                    with the same meeting: what counts as an exercise, whose
                    muscle taxonomy wins, how a superset is written down. The
                    result is a bespoke mapping that breaks whenever either side
                    changes — multiplied by every partner you add.
                  </Translate>
                </p>
                <p className={styles.chapterBody}>
                  <Translate
                    id="whyFds.interoperability.body2"
                    values={{
                      transformerLink: (
                        <Link to="/#see-it-work">
                          <Translate id="whyFds.interoperability.transformerLink">
                            transformer CLI
                          </Translate>
                        </Link>
                      ),
                    }}>
                    {'A shared vocabulary collapses that to one mapping: yours, into the standard, written once. Two systems that both speak FDS line up without ever having met. The {transformerLink} does the mapping for data you already have — the landing page shows it running on a real vendor export.'}
                  </Translate>
                </p>
              </div>
              <aside className={styles.chapterAside}>
                <p className={styles.asideLead}>
                  <Translate id="whyFds.aside.lead">the evidence</Translate>
                </p>
                <Link className={styles.asideLink} to="/#see-it-work">
                  <Translate id="whyFds.interoperability.asideLink">
                    See it work on a back squat →
                  </Translate>
                </Link>
                <p className={styles.asideNote}>
                  <Translate id="whyFds.interoperability.asideNote">
                    A real vendor export, one mapping, and the validating output — all three are files in the repository.
                  </Translate>
                </p>
              </aside>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">03</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  <Translate id="whyFds.independence.title">
                    Independence: a format no vendor can move under you
                  </Translate>
                </Heading>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.independence.body1">
                    A private format changes when its owner needs it to. FDS is
                    built so that cannot happen to you: every published schema
                    is frozen at a permanent public URL and never edited in
                    place. New versions are additive and ship beside the old
                    ones, which stay served — so a system built against the
                    standard keeps working, on the schedule you choose.
                  </Translate>
                </p>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.independence.body2">
                    The standard itself is developed in the open, through public
                    RFCs — no single company can quietly redefine what your
                    documents mean. And adopting it requires no SDK and no
                    proprietary tooling: it is plain JSON with published
                    schemas, validated by tools your team already uses.
                  </Translate>
                </p>
              </div>
              <aside className={styles.chapterAside}>
                <p className={styles.asideLead}>
                  <Translate id="whyFds.aside.lead">the evidence</Translate>
                </p>
                <Link className={styles.asideLink} to="/docs/schemas/">
                  <Translate id="whyFds.independence.asideLink">
                    Every published schema →
                  </Translate>
                </Link>
                <p className={styles.asideNote}>
                  <Translate id="whyFds.independence.asideNote">
                    Each entity at its own version, every URL frozen. Superseded versions stay served.
                  </Translate>
                </p>
              </aside>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">04</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  <Translate id="whyFds.noPeople.title">
                    Nothing about people, on purpose
                  </Translate>
                </Heading>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.noPeople.body1">
                    FDS describes training content, not the people doing the
                    training. There is no athlete identity, no bodyweight, no
                    logged result anywhere in the standard. A catalog or program
                    in FDS is a document about nobody — it can be published,
                    shared with partners, cached and mirrored without carrying
                    personal-data obligations along with it.
                  </Translate>
                </p>
                <p className={styles.chapterBody}>
                  <Translate
                    id="whyFds.noPeople.body2"
                    values={{
                      roadmapLink: (
                        <Link to="/docs/governance/roadmap">
                          <Translate id="whyFds.noPeople.roadmapLink">roadmap</Translate>
                        </Link>
                      ),
                    }}>
                    {"Where a program needs a personal number — a percentage of someone's max, say — it references it rather than carrying it. Performed results are deliberately out of scope until there is a consent and privacy model worthy of them; the {roadmapLink} is explicit about that line."}
                  </Translate>
                </p>
              </div>
              <aside className={styles.chapterAside}>
                <p className={styles.asideLead}>
                  <Translate id="whyFds.aside.lead">the evidence</Translate>
                </p>
                <Link className={styles.asideLink} to="/docs/use-cases/prescription">
                  <Translate id="whyFds.noPeople.asideLink">
                    Prescription primitives →
                  </Translate>
                </Link>
                <p className={styles.asideNote}>
                  <Translate id="whyFds.noPeople.asideNote">
                    How a program references a person's numbers without ever carrying them.
                  </Translate>
                </p>
              </aside>
            </article>

            <article className={styles.chapter}>
              <span className={styles.chapterNo} aria-hidden="true">05</span>
              <div>
                <Heading as="h2" className={styles.chapterTitle}>
                  <Translate id="whyFds.today.title">
                    Where it stands today
                  </Translate>
                </Heading>
                <p className={styles.chapterBody}>
                  <Translate id="whyFds.today.body1">
                    FDS is new. The schemas, the transformer and the AI knowledge
                    pack are published and ready to build against, and the
                    reference tooling in this repository is their first user.
                    There are no third-party adopters to point to yet, and this
                    site will not invent any — what you see claimed is what the
                    repository can prove.
                  </Translate>
                </p>
                <p className={styles.chapterBody}>
                  <Translate
                    id="whyFds.today.body2"
                    values={{
                      earlyAdoptersLink: (
                        <Link to="/docs/governance/contributing">
                          <Translate id="whyFds.today.earlyAdoptersLink">
                            early adopters
                          </Translate>
                        </Link>
                      ),
                    }}>
                    {'That timing is the opportunity in disguise: what the first stable release locks in is still open, and {earlyAdoptersLink} are the ones deciding it.'}
                  </Translate>
                </p>
              </div>
              <aside className={styles.chapterAside}>
                <p className={styles.asideLead}>
                  <Translate id="whyFds.aside.lead">the evidence</Translate>
                </p>
                <Link className={styles.asideLink} to="/docs/use-cases/">
                  <Translate id="whyFds.today.asideLink">
                    The scenario coverage matrix →
                  </Translate>
                </Link>
                <p className={styles.asideNote}>
                  <Translate id="whyFds.today.asideNote">
                    Every training structure the schemas express, each row backed by an example CI validates.
                  </Translate>
                </p>
              </aside>
            </article>

            <div className={styles.close}>
              <p className={styles.closeText}>
                <Translate id="whyFds.close.text">
                  The shortest path to a decision is watching it work: a real
                  vendor export, mapped once, becoming a document any FDS reader
                  validates.
                </Translate>
              </p>
              <div className="fdsButtonRow">
                <Link className="fdsButtonPrimary" to="/#see-it-work">
                  <Translate id="whyFds.close.primaryButton">
                    See it work on a back squat
                  </Translate>
                </Link>
                <Link className="fdsButtonGhost" to="/docs/use-cases/">
                  <Translate id="whyFds.close.ghostButton">
                    What you can do with it
                  </Translate>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
