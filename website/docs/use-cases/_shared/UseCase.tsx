import React from 'react';
import Link from '@docusaurus/Link';
import EditorPanel from '@site/src/components/EditorPanel';
import {PERSONAS} from './registry';
import styles from './styles.module.css';

/**
 * The components every use-case page is assembled from.
 *
 * The page pattern lives here, once, so eight pages cannot become eight
 * bespoke layouts. A page supplies content; these decide how it renders.
 *
 * The load-bearing one is <SpecExample>. It never receives JSON text — it
 * receives a value the page imported from a real file under
 * specification/schemas/ and re-serialises it. There is no prop through which a
 * fabricated example could be passed, and `scripts/check-usecases.mjs` refuses
 * any literal ```json fence on these pages, so the only way an example reaches a
 * reader is straight off disk.
 */

/**
 * A worked example, rendered from an imported file.
 *
 * `data` is the imported JSON value; `source` is that file's repo-relative path,
 * shown so the reader knows exactly which published file backs the claim. The
 * gate checks that `source` is also the path the page imported and declared, so
 * the caption cannot name one file while the block shows another.
 */
export function SpecExample({
  source,
  data,
  children,
}: {
  source: string;
  data: unknown;
  children?: React.ReactNode;
}): React.ReactElement {
  const filename = source.split('/').pop();
  return (
    <figure className={styles.example}>
      <EditorPanel
        filename={filename}
        language="json"
        code={JSON.stringify(data, null, 2)}
        maxHeight="34rem"
      />
      {children ? <figcaption className={styles.caption}>{children}</figcaption> : null}
      <p className={styles.source}>
        Backed by <code>{source}</code>
      </p>
    </figure>
  );
}

/** The two-panel before/after. Panels are plain language — no code either side. */
export function BeforeAfter({children}: {children: React.ReactNode}): React.ReactElement {
  return <div className={styles.beforeAfter}>{children}</div>;
}

export function Panel({
  kind,
  children,
}: {
  kind: 'before' | 'after';
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={kind === 'after' ? styles.panelAfter : styles.panelBefore}>
      <p className={styles.panelLabel}>{kind === 'after' ? 'With FDS' : 'Today'}</p>
      {children}
    </div>
  );
}

/** Persona chips. Each id is resolved to its label from the shared registry. */
export function Audience({ids}: {ids: string[]}): React.ReactElement {
  return (
    <p className={styles.audience}>
      <span className={styles.audienceLead}>Who this is for:</span>
      {ids.map((id) => (
        <span key={id} className={styles.chip}>
          {PERSONAS[id] ?? id}
        </span>
      ))}
    </p>
  );
}

/** The closing two links — one business-shaped, one technical-shaped. */
export function NextSteps({children}: {children: React.ReactNode}): React.ReactElement {
  return (
    <div className={styles.next}>
      <p className={styles.nextLead}>What next</p>
      <div className={styles.nextLinks}>{children}</div>
    </div>
  );
}

export function Next({to, children}: {to: string; children: React.ReactNode}): React.ReactElement {
  return (
    <Link className={styles.nextLink} to={to}>
      {children}
    </Link>
  );
}

/* ── Gallery (index page) ──────────────────────────────────────────────────
   The gallery is hand-arranged for reading order, but it cannot silently omit
   a page: `scripts/check-usecases.mjs` fails if any use-case page is missing a
   <Card> here. A page linked from a <Card> and reachable in the sidebar is the
   definition of "shipped visible". */

export function Gallery({children}: {children: React.ReactNode}): React.ReactElement {
  return <div className={styles.gallery}>{children}</div>;
}

export function Card({
  to,
  title,
  children,
}: {
  to: string;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link className={styles.card} to={to}>
      <p className={styles.cardTitle}>{title}</p>
      <p className={styles.cardPromise}>{children}</p>
    </Link>
  );
}
