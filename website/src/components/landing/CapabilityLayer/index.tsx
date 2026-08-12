import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

interface Entity {
  name: string;
  purpose: string;
  to: string;
}

interface Layer {
  tag: string;
  title: string;
  blurb: string;
  entities: Entity[];
}

export default function CapabilityLayer(): JSX.Element {
  const layers: Layer[] = [
    {
      tag: translate({id: 'landing.capabilities.layer1.tag', message: 'layer 1'}),
      title: translate({id: 'landing.capabilities.layer1.title', message: 'The shared library'}),
      blurb: translate({
        id: 'landing.capabilities.layer1.blurb',
        message:
          'A common vocabulary for the fitness domain. Static, cacheable, mirrorable, diffable. Adopt it alone if all you want is a canonical exercise list every system reads the same way.',
      }),
      entities: [
        {
          name: translate({id: 'landing.capabilities.exercises.name', message: 'Exercises'}),
          purpose: translate({
            id: 'landing.capabilities.exercises.purpose',
            message: 'A movement described once — classification, muscle targets, equipment, metrics.',
          }),
          to: '/docs/schemas/exercise',
        },
        {
          name: translate({id: 'landing.capabilities.equipment.name', message: 'Equipment'}),
          purpose: translate({
            id: 'landing.capabilities.equipment.purpose',
            message: 'What a movement needs, and how a machine loads — so a prescription stays reproducible.',
          }),
          to: '/docs/schemas/equipment',
        },
        {
          name: translate({id: 'landing.capabilities.muscles.name', message: 'Muscles'}),
          purpose: translate({
            id: 'landing.capabilities.muscles.purpose',
            message: 'Named anatomy that renderers and taxonomies can bind to without agreeing on artwork.',
          }),
          to: '/docs/schemas/muscle',
        },
        {
          name: translate({id: 'landing.capabilities.bodyAtlas.name', message: 'Body atlas'}),
          purpose: translate({
            id: 'landing.capabilities.bodyAtlas.purpose',
            message: 'Anatomical regions and the bindings that let any illustration draw them.',
          }),
          to: '/docs/schemas/body-atlas',
        },
      ],
    },
    {
      tag: translate({id: 'landing.capabilities.layer2.tag', message: 'layer 2'}),
      title: translate({id: 'landing.capabilities.layer2.title', message: 'The prescription layer'}),
      blurb: translate({
        id: 'landing.capabilities.layer2.blurb',
        message:
          'How to train, composed from the library. Sets, reps, tempo, load, rest and zones assemble into sessions, and sessions into multi-week plans — one schema each, however the training is structured.',
      }),
      entities: [
        {
          name: translate({id: 'landing.capabilities.prescription.name', message: 'Prescription primitives'}),
          purpose: translate({
            id: 'landing.capabilities.prescription.purpose',
            message: 'Load, reps, tempo, rest, RPE/RIR and set schemes — the vocabulary of intensity.',
          }),
          to: '/docs/schemas/prescription',
        },
        {
          name: translate({id: 'landing.capabilities.workouts.name', message: 'Workouts'}),
          purpose: translate({
            id: 'landing.capabilities.workouts.purpose',
            message: 'One session. Straight sets, supersets, circuits, EMOM, AMRAP and intervals share a single schema.',
          }),
          to: '/docs/schemas/workout',
        },
        {
          name: translate({id: 'landing.capabilities.programs.name', message: 'Programs'}),
          purpose: translate({
            id: 'landing.capabilities.programs.purpose',
            message: 'A schedule of sessions over weeks — periodisation and progression, by reference not by copy.',
          }),
          to: '/docs/schemas/program',
        },
      ],
    },
  ];

  return (
    <section id="capabilities" className="fdsSection">
      <div className="fdsContainer">
        <div className="fdsSectionHead">
          <p className="fdsEyebrow">
            <span>{'//'}</span>{' '}
            <Translate id="landing.capabilities.eyebrow" description="Small label above the capabilities section title">
              what fds defines
            </Translate>
          </p>
          <h2 className="fdsH2">
            <Translate id="landing.capabilities.title">One standard, two layers</Translate>
          </h2>
          <p className="fdsSub">
            <Translate id="landing.capabilities.subtitle">
              FDS defines a shared vocabulary and, on top of it, how to prescribe
              training with that vocabulary. Either layer can be adopted on its
              own.
            </Translate>
          </p>
        </div>

        <div className={styles.layers}>
          {layers.map((layer) => (
            <div key={layer.tag} className={styles.layer}>
              <p className={styles.layerTag}>{layer.tag}</p>
              <h3 className={styles.layerTitle}>{layer.title}</h3>
              <p className={styles.layerBlurb}>{layer.blurb}</p>
              <ul className={styles.entityList}>
                {layer.entities.map((entity) => (
                  <li key={entity.name} className={styles.entity}>
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
