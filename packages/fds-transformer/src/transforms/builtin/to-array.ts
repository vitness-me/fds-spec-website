/**
 * Array transforms - convert values to arrays
 */

import type { TransformFunction } from '../../core/types.js';

/**
 * Ensure value is an array
 */
export const toArray: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): unknown[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  // Split string by delimiter
  if (typeof value === 'string' && options.delimiter) {
    return value.split(String(options.delimiter)).map((s) => s.trim()).filter(Boolean);
  }

  return [value];
};

/**
 * Convert URL(s) to FDS media array format
 */
export const toMediaArray: TransformFunction = (
  value: unknown,
  options: Record<string, unknown> = {}
): Array<{ type: string; uri: string; caption?: string }> => {
  if (value === null || value === undefined) {
    return [];
  }

  const mediaType = String(options.type || 'image');
  const urls = Array.isArray(value) ? value : [value];
  
  return urls
    .filter((url) => url !== null && url !== undefined && url !== '')
    .map((url) => {
      let uri = String(url);

      // Apply URL transformation if configured
      if (options.urlTransform && typeof options.urlTransform === 'object') {
        const transform = options.urlTransform as { pattern?: string; replace?: string };
        if (transform.pattern && transform.replace) {
          uri = uri.replace(new RegExp(transform.pattern), transform.replace);
        }
      }

      // Apply base URL if configured
      if (options.baseUrl) {
        // Extract filename from URL
        const filename = uri.split('/').pop() || uri;
        uri = `${String(options.baseUrl).replace(/\/$/, '')}/${filename}`;
      }

      const mediaItem: { type: string; uri: string; caption?: string; license?: string; attribution?: string } = {
        type: mediaType,
        uri,
      };

      // Add optional fields
      if (options.caption) {
        mediaItem.caption = String(options.caption);
      }
      if (options.license) {
        mediaItem.license = String(options.license);
      }
      if (options.attribution) {
        mediaItem.attribution = String(options.attribution);
      }

      return mediaItem;
    });
};

export default toArray;
