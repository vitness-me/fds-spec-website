import React from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

interface PainPoint {
  title: string;
  description: string;
}

// Four ways real platforms spell the same reference to the same movement.
// The spellings are code, not copy — they stay untranslated in every locale.
const apps = [
  { name: 'App A', format: 'exercise_id: "squat_01"' },
  { name: 'App B', format: 'exerciseId: 42' },
  { name: 'App C', format: 'eid: "BS"' },
  { name: 'App D', format: 'Exercise_Ref: "001"' },
];

export default function ProblemSection(): JSX.Element {
  const painPoints: PainPoint[] = [
    {
      title: translate({
        id: 'landing.problem.lockIn.title',
        message: 'Content lock-in',
      }),
      description: translate({
        id: 'landing.problem.lockIn.description',
        message:
          'Your exercise library, workouts and programs live in one app’s private format. Switch, and you re-enter them by hand or leave them behind.',
      }),
    },
    {
      title: translate({
        id: 'landing.problem.overhead.title',
        message: 'Developer overhead',
      }),
      description: translate({
        id: 'landing.problem.overhead.description',
        message:
          "Building from scratch or adding integrations? Either way, you're defining exercise models alone. No shared vocabulary to build on.",
      }),
    },
    {
      title: translate({
        id: 'landing.problem.fragmentation.title',
        message: 'Ecosystem fragmentation',
      }),
      description: translate({
        id: 'landing.problem.fragmentation.description',
        message:
          'Apps cannot interoperate. The same exercise has different IDs, names, and structures everywhere.',
      }),
    },
  ];

  return (
    <section id="problem" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.problem.eyebrow" description="Small label above the problem section title">
              the problem
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.problem.title">
              Every platform speaks a different language
            </Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.problem.subtitle">
              The same back squat, four private spellings. None of them can read
              the others, so every integration is built by hand and every export
              is a dead end.
            </Translate>
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
            <Translate id="landing.problem.outro">
              So what does FDS actually define? →
            </Translate>
          </a>
        </p>
      </div>
    </section>
  );
}
