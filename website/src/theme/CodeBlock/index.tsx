import React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import type { Props } from '@theme/CodeBlock';

// Wrapper that enables line numbers by default for all code blocks
export default function CodeBlockWrapper(props: Props): React.ReactElement {
  return (
    <CodeBlock
      {...props}
      showLineNumbers={props.showLineNumbers ?? true}
    />
  );
}
