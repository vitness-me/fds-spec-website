import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

/**
 * The one code panel every surface shares.
 *
 * A thin chrome — filename strip, optional badge, optional footer — around
 * Docusaurus's own `@theme/CodeBlock`, which is also what every ```fence in
 * the docs renders through. The syntax palette is the site's own (the
 * --fds-code-* variables in src/css/custom.css, consumed by the prism theme
 * in docusaurus.config.ts) and the panel chrome is styled once in the same
 * sheet, so the landing page, the use-case pages and the documentation
 * cannot drift into three code aesthetics. Chrome is for panels arguing
 * "this is a real file": callers that show one keep the filename strip, and
 * line numbers stay on only where they mean something.
 *
 * This component takes a `code` string and renders it; what that string is —
 * a published example, a fixture, a transform output — is the caller's claim
 * to get right, and the callers on this site import those strings from the
 * files the CI gates check.
 */
export default function EditorPanel({
  filename,
  badge,
  badgeTone = 'neutral',
  step,
  language = 'json',
  code,
  maxHeight,
  showLineNumbers = true,
  size = 'md',
  footer,
}: {
  /** Shown in the title strip, like an editor tab. */
  filename: string;
  /** Optional pill after the filename, e.g. "valid fds" or a version. */
  badge?: string;
  badgeTone?: 'neutral' | 'ok';
  /** Optional leading step number for sequenced panels. */
  step?: string;
  language?: string;
  code: string;
  /** Caps the panel; overflow scrolls and the cut edge fades. */
  maxHeight?: string;
  showLineNumbers?: boolean;
  /** `sm` tightens the type for multi-column layouts. */
  size?: 'sm' | 'md';
  /** Optional caption row under the code, inside the panel. */
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        {step ? <span className={styles.step}>{step}</span> : null}
        <span className={styles.filename}>{filename}</span>
        {badge ? (
          <span className={badgeTone === 'ok' ? styles.badgeOk : styles.badge}>{badge}</span>
        ) : null}
      </div>
      <div
        className={`${styles.scroller} ${size === 'sm' ? styles.sizeSm : ''} ${
          maxHeight ? styles.capped : ''
        }`}
        style={maxHeight ? {maxHeight} : undefined}>
        <CodeBlock language={language} showLineNumbers={showLineNumbers}>
          {code}
        </CodeBlock>
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
