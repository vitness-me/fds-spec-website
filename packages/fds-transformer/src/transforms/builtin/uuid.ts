/**
 * UUID transforms - generate UUIDs
 */

import { v4 as uuidv4 } from 'uuid';
import type { TransformFunction } from '../../core/types.js';

/**
 * Generate a new UUIDv4
 * 
 * FDS requires plain UUIDs for all identifiers.
 */
export const uuid: TransformFunction = (): string => {
  return uuidv4();
};

export default uuid;
