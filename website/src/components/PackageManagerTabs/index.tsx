import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

interface PackageManagerCommand {
  npm: string;
  pnpm: string;
  yarn: string;
}

interface PackageManagerTabsProps {
  command: PackageManagerCommand | string;
  /** Package name(s) - will auto-generate install commands if provided */
  packages?: string;
  /** Whether to use global install (adds -g, add -g, global add) */
  global?: boolean;
  /** Whether this is a dev dependency */
  dev?: boolean;
}

/**
 * Generates package manager commands from a package name
 */
function generateCommands(
  packages: string,
  global: boolean,
  dev: boolean
): PackageManagerCommand {
  const devFlag = dev ? ' -D' : '';
  const npmDevFlag = dev ? ' --save-dev' : '';
  
  if (global) {
    return {
      npm: `npm install -g ${packages}`,
      pnpm: `pnpm add -g ${packages}`,
      yarn: `yarn global add ${packages}`,
    };
  }
  
  return {
    npm: `npm install${npmDevFlag} ${packages}`,
    pnpm: `pnpm add${devFlag} ${packages}`,
    yarn: `yarn add${devFlag} ${packages}`,
  };
}

/**
 * A component that displays code blocks with tabs for different package managers.
 * 
 * @example
 * // With auto-generated install commands
 * <PackageManagerTabs packages="@vitness/fds-transformer" global />
 * 
 * @example
 * // With custom commands
 * <PackageManagerTabs
 *   command={{
 *     npm: 'npx @vitness/fds-transformer --version',
 *     pnpm: 'pnpm dlx @vitness/fds-transformer --version',
 *     yarn: 'yarn dlx @vitness/fds-transformer --version',
 *   }}
 * />
 */
export default function PackageManagerTabs({
  command,
  packages,
  global = false,
  dev = false,
}: PackageManagerTabsProps): JSX.Element {
  let commands: PackageManagerCommand;
  
  if (packages) {
    commands = generateCommands(packages, global, dev);
  } else if (typeof command === 'string') {
    // If a string is passed, assume it's an npm command and derive others
    commands = {
      npm: command,
      pnpm: command.replace(/^npm /, 'pnpm ').replace(/^npx /, 'pnpm dlx '),
      yarn: command.replace(/^npm /, 'yarn ').replace(/^npx /, 'yarn dlx '),
    };
  } else {
    commands = command;
  }

  return (
    <Tabs groupId="package-manager" queryString>
      <TabItem value="pnpm" label="pnpm" default>
        <CodeBlock language="bash">{commands.pnpm}</CodeBlock>
      </TabItem>
      <TabItem value="npm" label="npm">
        <CodeBlock language="bash">{commands.npm}</CodeBlock>
      </TabItem>
      <TabItem value="yarn" label="yarn">
        <CodeBlock language="bash">{commands.yarn}</CodeBlock>
      </TabItem>
    </Tabs>
  );
}
