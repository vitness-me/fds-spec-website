import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Consequence {
  label: string;
  detail: string;
}

const consequences: Consequence[] = [
  { label: 'Shared', detail: 'No consent, DPA or privacy review gates an exchange.' },
  { label: 'Cached', detail: 'A library sits behind a CDN like any other static asset.' },
  { label: 'Mirrored', detail: 'Anyone can republish a catalog without inheriting an obligation.' },
  { label: 'Diffed', detail: 'Two versions compare cleanly, because nothing in them is a person.' },
];

export default function NoPersonalData(): JSX.Element {
  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> by design
          </p>
          <h2 className="fdsH2">FDS models no person</h2>
          <p className="fdsSub">
            No athlete identity, no bodyweight, no one-rep maxes, no performed or
            logged results — none of it is in the standard, and none of it ever
            will be. A prescription that would need a personal number references
            it instead of carrying it. That constraint is exactly why an FDS
            document can be:
          </p>
        </div>

        <div className={styles.grid}>
          {consequences.map((c) => (
            <div key={c.label} className={styles.item}>
              <h3 className={styles.itemLabel}>{c.label}</h3>
              <p className={styles.itemDetail}>{c.detail}</p>
            </div>
          ))}
        </div>

        <p className={`fdsFootnote ${styles.footnote}`}>
          A document that describes nobody is one you can publish freely. What
          this deliberately excludes, and why, is on the{' '}
          <Link to="/docs/governance/roadmap">roadmap</Link>.
        </p>
      </div>
    </section>
  );
}
