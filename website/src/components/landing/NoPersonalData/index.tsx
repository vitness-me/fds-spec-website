import React from 'react';
import Link from '@docusaurus/Link';
import { Share2, HardDriveDownload, Copy, GitCompare } from 'lucide-react';
import styles from './styles.module.css';

interface Consequence {
  icon: React.ReactNode;
  label: string;
  detail: string;
}

const consequences: Consequence[] = [
  { icon: <Share2 size={20} />, label: 'Shared', detail: 'No consent, DPA or privacy review gates an exchange.' },
  { icon: <HardDriveDownload size={20} />, label: 'Cached', detail: 'A library sits behind a CDN like any other static asset.' },
  { icon: <Copy size={20} />, label: 'Mirrored', detail: 'Anyone can republish a catalog without inheriting an obligation.' },
  { icon: <GitCompare size={20} />, label: 'Diffed', detail: 'Two versions compare cleanly, because nothing in them is a person.' },
];

export default function NoPersonalData(): JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>By design</span>
          <h2 className={styles.title}>FDS models no person</h2>
          <p className={styles.lead}>
            No athlete identity, no bodyweight, no one-rep maxes, no performed or
            logged results — none of it is in the standard, and none of it ever
            will be. A prescription that would need a personal number references
            it instead of carrying it. That constraint is exactly why an FDS
            document can be:
          </p>
        </div>

        <div className={styles.grid}>
          {consequences.map((c, idx) => (
            <div key={idx} className={styles.card}>
              <span className={styles.cardIcon}>{c.icon}</span>
              <h3 className={styles.cardLabel}>{c.label}</h3>
              <p className={styles.cardDetail}>{c.detail}</p>
            </div>
          ))}
        </div>

        <p className={styles.footnote}>
          A document that describes nobody is one you can publish freely. What
          this deliberately excludes, and why, is on the{' '}
          <Link to="/docs/governance/roadmap">roadmap</Link>.
        </p>
      </div>
    </section>
  );
}
