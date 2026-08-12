import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

interface Consequence {
  label: string;
  detail: string;
}

export default function NoPersonalData(): JSX.Element {
  const consequences: Consequence[] = [
    {
      label: translate({id: 'landing.noPersonalData.shared.label', message: 'Shared'}),
      detail: translate({
        id: 'landing.noPersonalData.shared.detail',
        message: 'No consent, DPA or privacy review gates an exchange.',
      }),
    },
    {
      label: translate({id: 'landing.noPersonalData.cached.label', message: 'Cached'}),
      detail: translate({
        id: 'landing.noPersonalData.cached.detail',
        message: 'A library sits behind a CDN like any other static asset.',
      }),
    },
    {
      label: translate({id: 'landing.noPersonalData.mirrored.label', message: 'Mirrored'}),
      detail: translate({
        id: 'landing.noPersonalData.mirrored.detail',
        message: 'Anyone can republish a catalog without inheriting an obligation.',
      }),
    },
    {
      label: translate({id: 'landing.noPersonalData.diffed.label', message: 'Diffed'}),
      detail: translate({
        id: 'landing.noPersonalData.diffed.detail',
        message: 'Two versions compare cleanly, because nothing in them is a person.',
      }),
    },
  ];

  return (
    <section className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.noPersonalData.eyebrow" description="Small label above the no-personal-data section title">
              by design
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.noPersonalData.title">FDS models no person</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.noPersonalData.subtitle">
              No athlete identity, no bodyweight, no one-rep maxes, no performed or
              logged results — none of it is in the standard, and none of it ever
              will be. A prescription that would need a personal number references
              it instead of carrying it. That constraint is exactly why an FDS
              document can be:
            </Translate>
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
          <Translate
            id="landing.noPersonalData.footnote"
            values={{
              roadmapLink: (
                <Link to="/docs/governance/roadmap">
                  <Translate id="landing.noPersonalData.roadmapLink">roadmap</Translate>
                </Link>
              ),
            }}>
            {'A document that describes nobody is one you can publish freely. What this deliberately excludes, and why, is on the {roadmapLink}.'}
          </Translate>
        </p>
      </div>
    </section>
  );
}
