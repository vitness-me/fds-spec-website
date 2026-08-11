import React from 'react';
import Link from '@docusaurus/Link';
import { Library, ClipboardList } from 'lucide-react';
import styles from './styles.module.css';

interface Entity {
  name: string;
  purpose: string;
  to: string;
}

interface Layer {
  icon: React.ReactNode;
  tag: string;
  title: string;
  blurb: string;
  entities: Entity[];
}

const layers: Layer[] = [
  {
    icon: <Library size={22} />,
    tag: 'Layer one',
    title: 'The shared library',
    blurb:
      'A common vocabulary for the fitness domain. Static, cacheable, mirrorable, diffable. Adopt it alone if all you want is a canonical exercise list every system reads the same way.',
    entities: [
      { name: 'Exercises', purpose: 'A movement described once — classification, muscle targets, equipment, metrics.', to: '/docs/schemas/exercise' },
      { name: 'Equipment', purpose: 'What a movement needs, and how a machine loads — so a prescription stays reproducible.', to: '/docs/schemas/equipment' },
      { name: 'Muscles', purpose: 'Named anatomy that renderers and taxonomies can bind to without agreeing on artwork.', to: '/docs/schemas/muscle' },
      { name: 'Body atlas', purpose: 'Anatomical regions and the bindings that let any illustration draw them.', to: '/docs/schemas/body-atlas' },
    ],
  },
  {
    icon: <ClipboardList size={22} />,
    tag: 'Layer two',
    title: 'The prescription layer',
    blurb:
      'How to train, composed from the library. Sets, reps, tempo, load, rest and zones assemble into sessions, and sessions into multi-week plans — one schema each, however the training is structured.',
    entities: [
      { name: 'Prescription primitives', purpose: 'Load, reps, tempo, rest, RPE/RIR and set schemes — the vocabulary of intensity.', to: '/docs/schemas/prescription' },
      { name: 'Workouts', purpose: 'One session. Straight sets, supersets, circuits, EMOM, AMRAP and intervals share a single schema.', to: '/docs/schemas/workout' },
      { name: 'Programs', purpose: 'A schedule of sessions over weeks — periodisation and progression, by reference not by copy.', to: '/docs/schemas/program' },
    ],
  },
];

export default function CapabilityLayer(): JSX.Element {
  return (
    <section id="capabilities" className={styles.capabilitySection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>One standard, two layers</h2>
        <p className={styles.sectionSubtitle}>
          FDS defines a shared vocabulary and, on top of it, how to prescribe
          training with that vocabulary. Either layer can be adopted on its own.
        </p>

        <div className={styles.layers}>
          {layers.map((layer, idx) => (
            <div key={idx} className={styles.layerCard}>
              <div className={styles.layerHeader}>
                <span className={styles.layerIcon}>{layer.icon}</span>
                <div>
                  <span className={styles.layerTag}>{layer.tag}</span>
                  <h3 className={styles.layerTitle}>{layer.title}</h3>
                </div>
              </div>
              <p className={styles.layerBlurb}>{layer.blurb}</p>
              <ul className={styles.entityList}>
                {layer.entities.map((entity, i) => (
                  <li key={i} className={styles.entity}>
                    <Link to={entity.to} className={styles.entityName}>
                      {entity.name}
                    </Link>
                    <span className={styles.entityPurpose}>{entity.purpose}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
