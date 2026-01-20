import React from 'react';
import { RefreshCw, Zap, TrendingUp, Link2 } from 'lucide-react';
import styles from './styles.module.css';

interface UseCase {
  icon: React.ReactNode;
  title: string;
  scenario: string;
  without: string;
  withFds: string;
}

const useCases: UseCase[] = [
  {
    icon: <RefreshCw size={24} />,
    title: 'User Data Portability',
    scenario: 'User wants to switch fitness apps',
    without: 'Years of workout history lost. Manual re-entry or data trapped forever.',
    withFds: 'Export once, import anywhere. Complete history travels with the user.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Developer Efficiency',
    scenario: 'Building a new fitness app or adding integrations',
    without: 'Reverse-engineer each platform. Maintain N different parsers and mappers.',
    withFds: 'Build to one standard. Instant compatibility with all FDS-compliant platforms.',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Platform Growth',
    scenario: 'Acquiring users from competing platforms',
    without: 'High switching friction. Users reluctant to lose their data.',
    withFds: 'Seamless migration path. Lower barrier to user adoption.',
  },
  {
    icon: <Link2 size={24} />,
    title: 'Data Aggregation',
    scenario: 'Combining data from multiple fitness sources',
    without: 'Write N different parsers. Constant maintenance as formats change.',
    withFds: 'Single normalized format. Consistent data structure across all sources.',
  },
];

export default function UseCases(): JSX.Element {
  return (
    <section className={styles.useCasesSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Why FDS?</h2>
        <p className={styles.sectionSubtitle}>
          Real scenarios where a common standard makes the difference
        </p>

        <div className={styles.useCasesGrid}>
          {useCases.map((useCase, idx) => (
            <div key={idx} className={styles.useCaseCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{useCase.icon}</span>
                <h3 className={styles.cardTitle}>{useCase.title}</h3>
              </div>
              <p className={styles.scenario}>{useCase.scenario}</p>
              <div className={styles.comparison}>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonLabel}>Without FDS</span>
                  <p className={styles.comparisonText}>{useCase.without}</p>
                </div>
                <div className={styles.comparisonItem}>
                  <span className={styles.comparisonLabelGood}>With FDS</span>
                  <p className={styles.comparisonText}>{useCase.withFds}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
