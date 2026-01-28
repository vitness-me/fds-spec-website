/**
 * URL Transform - manipulate URLs
 */

import type { TransformFunction } from '../../core/types.js';

export interface UrlTransformOptions {
  pattern?: string;
  replace?: string;
  baseUrl?: string;
  protocol?: string;
}

/**
 * Transform a URL
 */
export const urlTransform: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  let url = String(value);
  const opts = options as UrlTransformOptions;

  // Apply regex replacement
  if (opts.pattern && opts.replace !== undefined) {
    try {
      url = url.replace(new RegExp(opts.pattern), opts.replace);
    } catch (error) {
      console.warn(`Invalid URL transform pattern: ${opts.pattern}`);
    }
  }

  // Apply base URL
  if (opts.baseUrl) {
    // Extract filename/path from original URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    url = `${opts.baseUrl.replace(/\/$/, '')}/${filename}`;
  }

  // Change protocol
  if (opts.protocol) {
    url = url.replace(/^https?:/, opts.protocol);
  }

  return url;
};

export default urlTransform;
