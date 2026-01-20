import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { useColorMode } from '@docusaurus/theme-common';
import { platformData, fdsFormat, fdsFullSchema } from './comparisonData';
import styles from './styles.module.css';

export default function ComparisonDemo(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const [showFullSchema, setShowFullSchema] = useState(false);
  const { colorMode } = useColorMode();

  const activePlatform = platformData[activeTab];
  const platformJson = showFullSchema && activePlatform.fullSchema
    ? activePlatform.fullSchema
    : activePlatform.format;
  const fdsJson = showFullSchema ? fdsFullSchema : fdsFormat;

  const theme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;

  return (
    <section className={styles.comparisonSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>See the Difference</h2>
        <p className={styles.sectionSubtitle}>
          The same exercise, "Back Squat", represented across different platforms
        </p>

        <div className={styles.tabs}>
          {platformData.map((platform, idx) => (
            <button
              key={platform.id}
              className={`${styles.tab} ${activeTab === idx ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              {platform.name}
            </button>
          ))}
        </div>

        <div className={styles.comparisonContainer}>
          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <span className={styles.panelTitle}>{activePlatform.name}</span>
              <span className={styles.panelSubtitle}>{activePlatform.description}</span>
            </div>
            <div className={styles.codeBlock}>
              <Highlight
                theme={theme}
                code={JSON.stringify(platformJson, null, 2)}
                language="json"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={{ ...style, background: 'transparent', margin: 0 }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          </div>

          <div className={styles.arrow}>
            <span className={styles.arrowIcon}>→</span>
            <span className={styles.arrowLabel}>FDS</span>
          </div>

          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <span className={styles.panelTitle}>FDS Format</span>
              <span className={styles.panelSubtitle}>Standardized structure</span>
            </div>
            <div className={styles.codeBlock}>
              <Highlight
                theme={theme}
                code={JSON.stringify(fdsJson, null, 2)}
                language="json"
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={{ ...style, background: 'transparent', margin: 0 }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          </div>
        </div>

        <div className={styles.toggleContainer}>
          <button
            className={styles.toggleButton}
            onClick={() => setShowFullSchema(!showFullSchema)}
          >
            {showFullSchema ? 'Show Simplified' : 'Show Full Schema'}
          </button>
        </div>
      </div>
    </section>
  );
}
