import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
// Import custom components
import PackageManagerTabs from '@site/src/components/PackageManagerTabs';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Add custom components
  PackageManagerTabs,
};
