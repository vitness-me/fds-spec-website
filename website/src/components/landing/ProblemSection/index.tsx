import React, { useState } from 'react';
import { Lock, Wrench, Puzzle, Smartphone, ChevronDown, ChevronUp, X } from 'lucide-react';
import styles from './styles.module.css';

interface PainPoint {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    icon: <Lock size={20} />,
    title: 'User Lock-in',
    description: 'Switch apps, lose everything. Years of PRs, workout history, and progress vanish. Data hostage in proprietary formats.',
  },
  {
    icon: <Wrench size={20} />,
    title: 'Developer Overhead',
    description: "Building from scratch or adding integrations? Either way, you're defining exercise models alone. No shared vocabulary to build on.",
  },
  {
    icon: <Puzzle size={20} />,
    title: 'Ecosystem Fragmentation',
    description: 'Apps cannot interoperate. The same exercise has different IDs, names, and structures everywhere.',
  },
];

export default function ProblemSection(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="problem" className={styles.problemSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>The Fragmentation Problem</h2>
        <p className={styles.sectionSubtitle}>
          Every fitness platform speaks a different language
        </p>

        {/* Desktop: Always show full fragmentation visual */}
        <div className={styles.fragmentationDesktop}>
          <div className={styles.appBox}>
            <span className={styles.appName}>App A</span>
            <span className={styles.appFormat}>exercise_id: "squat_01"</span>
          </div>
          <span className={styles.incompatible}><X size={16} /></span>
          <div className={styles.appBox}>
            <span className={styles.appName}>App B</span>
            <span className={styles.appFormat}>exerciseId: 42</span>
          </div>
          <span className={styles.incompatible}><X size={16} /></span>
          <div className={styles.appBox}>
            <span className={styles.appName}>App C</span>
            <span className={styles.appFormat}>eid: "BS"</span>
          </div>
          <span className={styles.incompatible}><X size={16} /></span>
          <div className={styles.appBox}>
            <span className={styles.appName}>App D</span>
            <span className={styles.appFormat}>Exercise_Ref: "001"</span>
          </div>
        </div>

        {/* Mobile: Collapsed summary with expand option */}
        <div className={styles.fragmentationMobile}>
          {!isExpanded ? (
            <button
              className={styles.collapsedSummary}
              onClick={() => setIsExpanded(true)}
            >
              <div className={styles.summaryContent}>
                <span className={styles.summaryIcon}><Smartphone size={18} /></span>
                <div className={styles.summaryText}>
                  <span className={styles.summaryTitle}>4 apps, 4 different formats</span>
                  <span className={styles.summarySubtitle}>Same exercise, incompatible data</span>
                </div>
              </div>
              <span className={styles.expandIcon}><ChevronDown size={18} /></span>
            </button>
          ) : (
            <div className={styles.expandedMobile}>
              <div className={styles.mobileAppGrid}>
                <div className={styles.appBox}>
                  <span className={styles.appName}>App A</span>
                  <span className={styles.appFormat}>exercise_id: "squat_01"</span>
                </div>
                <div className={styles.appBox}>
                  <span className={styles.appName}>App B</span>
                  <span className={styles.appFormat}>exerciseId: 42</span>
                </div>
                <div className={styles.appBox}>
                  <span className={styles.appName}>App C</span>
                  <span className={styles.appFormat}>eid: "BS"</span>
                </div>
                <div className={styles.appBox}>
                  <span className={styles.appName}>App D</span>
                  <span className={styles.appFormat}>Exercise_Ref: "001"</span>
                </div>
              </div>
              <div className={styles.incompatibleBanner}>
                <span className={styles.incompatible}><X size={16} /></span>
                <span>None of these formats are compatible</span>
              </div>
              <button
                className={styles.collapseButton}
                onClick={() => setIsExpanded(false)}
              >
                Collapse <ChevronUp size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: Grid layout for pain points */}
        <div className={styles.painPointsDesktop}>
          {painPoints.map((point, idx) => (
            <div key={idx} className={styles.painPoint}>
              <span className={styles.painIcon}>{point.icon}</span>
              <h3 className={styles.painTitle}>{point.title}</h3>
              <p className={styles.painDescription}>{point.description}</p>
            </div>
          ))}
        </div>

        {/* Mobile: Compact chips */}
        <div className={styles.painPointsMobile}>
          {painPoints.map((point, idx) => (
            <span key={idx} className={styles.chip}>
              <span className={styles.chipIcon}>{point.icon}</span>
              <span className={styles.chipTitle}>{point.title}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
