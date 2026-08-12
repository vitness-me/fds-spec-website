import React from 'react';
import styles from './styles.module.css';

interface PainPoint {
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    title: 'Content lock-in',
    description:
      'Your exercise library, workouts and programs live in one app’s private format. Switch, and you re-enter them by hand or leave them behind.',
  },
  {
    title: 'Developer overhead',
    description:
      "Building from scratch or adding integrations? Either way, you're defining exercise models alone. No shared vocabulary to build on.",
  },
  {
    title: 'Ecosystem fragmentation',
    description:
      'Apps cannot interoperate. The same exercise has different IDs, names, and structures everywhere.',
  },
];

// Four ways real platforms spell the same reference to the same movement.
const apps = [
  { name: 'App A', format: 'exercise_id: "squat_01"' },
  { name: 'App B', format: 'exerciseId: 42' },
  { name: 'App C', format: 'eid: "BS"' },
  { name: 'App D', format: 'Exercise_Ref: "001"' },
];

export default function ProblemSection(): JSX.Element {
  return (
    <section id="problem" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span> the problem
          </p>
          <h2 className="fdsH2">Every platform speaks a different language</h2>
          <p className="fdsSub">
            The same back squat, four private spellings. None of them can read
            the others, so every integration is built by hand and every export
            is a dead end.
          </p>
        </div>

        <div className={`fdsTile ${styles.fragmentation}`} role="list">
          {apps.map((app) => (
            <div key={app.name} className={styles.appCell} role="listitem">
              <span className={styles.appName}>{app.name}</span>
              <code className={styles.appFormat}>{app.format}</code>
            </div>
          ))}
        </div>

        <div className={styles.painPoints}>
          {painPoints.map((point) => (
            <div key={point.title} className={styles.painPoint}>
              <h3 className={styles.painTitle}>{point.title}</h3>
              <p className={styles.painDescription}>{point.description}</p>
            </div>
          ))}
        </div>

        <p className={styles.outro}>
          <a className="fdsQuietLink" href="#capabilities">
            So what does FDS actually define? →
          </a>
        </p>
      </div>
    </section>
  );
}
