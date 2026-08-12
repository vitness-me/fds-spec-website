import React from 'react';
import styles from './styles.module.css';

/**
 * A terminal window rendering a recorded transcript.
 *
 * The panel is dark in both site themes, because a terminal is a terminal.
 * This component never invents output: `lines` comes from a committed
 * recording of a real CLI run (`fixtures/roundtrip/expected/transcript.json`,
 * which `check:transform` replays and diffs on every change), and the
 * component only lays out what the tool printed. Colors are presentation —
 * the recorded text is rendered verbatim.
 */

/** Leading glyphs of the CLI's own output, each with its display class. */
const GLYPHS: Record<string, 'glyphOk' | 'glyphStep' | 'glyphFrame'> = {
  '◇': 'glyphOk',
  '●': 'glyphStep',
  '┌': 'glyphFrame',
  '│': 'glyphFrame',
  '└': 'glyphFrame',
};

function OutputLine({line}: {line: string}): React.ReactElement {
  const glyphClass = GLYPHS[line.charAt(0)];

  if (!glyphClass) {
    // A line the CLI printed without its framing glyphs — on this fixture,
    // the enrichment notice on stderr. Shown as a notice, verbatim.
    return (
      <div className={styles.line}>
        <span className={styles.notice}>{line}</span>
      </div>
    );
  }

  return (
    <div className={styles.line}>
      <span className={styles[glyphClass]}>{line.charAt(0)}</span>
      <span className={styles.output}>{line.slice(1)}</span>
    </div>
  );
}

export default function Terminal({
  title,
  command,
  lines,
}: {
  /** The path shown centered in the title bar, e.g. "~/roundtrip". */
  title: string;
  /** The command after the prompt, e.g. "npx @vitness/fds-transformer …". */
  command: string;
  /** The recorded output, one entry per line, rendered verbatim. */
  lines: readonly string[];
}): React.ReactElement {
  return (
    <figure className={styles.terminal}>
      <figcaption className={styles.titleBar}>
        <span className={styles.lights} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.title}>{title}</span>
      </figcaption>
      <div className={styles.body}>
        <div className={styles.line}>
          <span className={styles.prompt}>$</span>
          <span className={styles.command}> {command}</span>
        </div>
        {lines.map((line, index) => (
          <OutputLine key={index} line={line} />
        ))}
        <div className={styles.line}>
          <span className={styles.prompt}>$</span>
          <span className={styles.caret} aria-hidden="true" />
        </div>
      </div>
    </figure>
  );
}
