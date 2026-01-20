import React from 'react';
import Link from '@docusaurus/Link';
import { Dumbbell, BarChart3, Plug, FileJson, Globe, Users } from 'lucide-react';
import styles from './styles.module.css';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const featureCards: FeatureCard[] = [
  {
    icon: <Dumbbell size={28} />,
    title: 'Exercise Data Model',
    description: 'Comprehensive exercise definitions with classification, muscle targets, equipment, and media assets. RFC-001 defines the core structure.',
    link: '/docs/specifications/rfc-001-exercise-data-model',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Registry Entities',
    description: 'Standardized equipment, muscle, and body atlas models. Shared taxonomies for consistent data exchange across platforms.',
    link: '/docs/schemas',
  },
  {
    icon: <Plug size={28} />,
    title: 'Extensibility',
    description: 'Platform-specific extensions without breaking compatibility. Vendor namespaces and attribute system for custom data.',
    link: '/docs/core-concepts/extensions',
  },
  {
    icon: <FileJson size={28} />,
    title: 'JSON Schema',
    description: 'Draft 2020-12 schemas with validation rules and examples. Programmatic validation for all entity types.',
    link: '/docs/schemas',
  },
  {
    icon: <Globe size={28} />,
    title: 'Internationalization',
    description: 'Multilingual support with BCP 47 language tags. Localized names, descriptions, and aliases for global accessibility.',
    link: '/docs/core-concepts/internationalization',
  },
  {
    icon: <Users size={28} />,
    title: 'Open Governance',
    description: 'Community-driven RFC process with transparent decision-making. Contribute improvements and propose new features.',
    link: '/docs/governance',
  },
];

export default function TrustSection(): JSX.Element {
  return (
    <section className={styles.trustSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>What's in the Standard</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to build interoperable fitness applications
        </p>
        <div className={styles.featureGrid}>
          {featureCards.map((card, idx) => (
            <div key={idx} className={styles.featureCard}>
              <span className={styles.cardIcon}>{card.icon}</span>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <Link to={card.link} className={styles.cardLink}>
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
