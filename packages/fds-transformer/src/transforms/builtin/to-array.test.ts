/**
 * Tests for array transforms
 */

import { describe, it, expect } from 'vitest';
import { toArray, toMediaArray } from './to-array.js';

describe('toArray', () => {
  describe('null and undefined handling', () => {
    it('should return empty array for null', () => {
      expect(toArray(null, {})).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(toArray(undefined, {})).toEqual([]);
    });
  });

  describe('array passthrough', () => {
    it('should return array as-is', () => {
      const input = [1, 2, 3];
      expect(toArray(input, {})).toEqual([1, 2, 3]);
    });

    it('should return empty array as-is', () => {
      expect(toArray([], {})).toEqual([]);
    });

    it('should return nested arrays as-is', () => {
      const input = [[1, 2], [3, 4]];
      expect(toArray(input, {})).toEqual([[1, 2], [3, 4]]);
    });
  });

  describe('single value wrapping', () => {
    it('should wrap string in array', () => {
      expect(toArray('hello', {})).toEqual(['hello']);
    });

    it('should wrap number in array', () => {
      expect(toArray(42, {})).toEqual([42]);
    });

    it('should wrap object in array', () => {
      const obj = { foo: 'bar' };
      expect(toArray(obj, {})).toEqual([{ foo: 'bar' }]);
    });

    it('should wrap boolean in array', () => {
      expect(toArray(true, {})).toEqual([true]);
    });
  });

  describe('string splitting with delimiter', () => {
    it('should split string by comma delimiter', () => {
      expect(toArray('a, b, c', { delimiter: ',' })).toEqual(['a', 'b', 'c']);
    });

    it('should split string by semicolon delimiter', () => {
      expect(toArray('a; b; c', { delimiter: ';' })).toEqual(['a', 'b', 'c']);
    });

    it('should split string by pipe delimiter', () => {
      expect(toArray('a|b|c', { delimiter: '|' })).toEqual(['a', 'b', 'c']);
    });

    it('should trim whitespace from split values', () => {
      expect(toArray('  a  ,  b  ,  c  ', { delimiter: ',' })).toEqual(['a', 'b', 'c']);
    });

    it('should filter out empty values after split', () => {
      expect(toArray('a,,b,,,c', { delimiter: ',' })).toEqual(['a', 'b', 'c']);
    });

    it('should handle string with no delimiter matches', () => {
      expect(toArray('hello', { delimiter: ',' })).toEqual(['hello']);
    });
  });
});

describe('toMediaArray', () => {
  describe('null and undefined handling', () => {
    it('should return empty array for null', () => {
      expect(toMediaArray(null, {})).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(toMediaArray(undefined, {})).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(toMediaArray('', {})).toEqual([]);
    });
  });

  describe('single URL conversion', () => {
    it('should convert single URL to media array with default type', () => {
      const result = toMediaArray('http://example.com/image.jpg', {});
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/image.jpg' }
      ]);
    });

    it('should use specified media type', () => {
      const result = toMediaArray('http://example.com/video.mp4', { type: 'video' });
      expect(result).toEqual([
        { type: 'video', uri: 'http://example.com/video.mp4' }
      ]);
    });

    it('should convert gif to gif type', () => {
      const result = toMediaArray('http://example.com/exercise.gif', { type: 'gif' });
      expect(result).toEqual([
        { type: 'gif', uri: 'http://example.com/exercise.gif' }
      ]);
    });
  });

  describe('multiple URL conversion', () => {
    it('should convert array of URLs to media array', () => {
      const urls = ['http://example.com/1.jpg', 'http://example.com/2.jpg'];
      const result = toMediaArray(urls, {});
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg' },
        { type: 'image', uri: 'http://example.com/2.jpg' }
      ]);
    });

    it('should filter out null and undefined values from array', () => {
      const urls = ['http://example.com/1.jpg', null, 'http://example.com/2.jpg', undefined];
      const result = toMediaArray(urls, {});
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg' },
        { type: 'image', uri: 'http://example.com/2.jpg' }
      ]);
    });

    it('should filter out empty strings from array', () => {
      const urls = ['http://example.com/1.jpg', '', 'http://example.com/2.jpg'];
      const result = toMediaArray(urls, {});
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg' },
        { type: 'image', uri: 'http://example.com/2.jpg' }
      ]);
    });
  });

  describe('URL transformation', () => {
    it('should apply regex pattern replacement', () => {
      const result = toMediaArray(
        'https://media.example.com/back-squat.gif',
        { urlTransform: { pattern: 'media\\.example\\.com', replace: 'cdn.example.com' } }
      );
      expect(result).toEqual([
        { type: 'image', uri: 'https://cdn.example.com/back-squat.gif' }
      ]);
    });

    it('should apply base URL transformation', () => {
      const result = toMediaArray(
        'http://old-cdn.com/path/to/back-squat.gif',
        { baseUrl: 'https://new-cdn.com/images' }
      );
      expect(result).toEqual([
        { type: 'image', uri: 'https://new-cdn.com/images/back-squat.gif' }
      ]);
    });

    it('should handle base URL with trailing slash', () => {
      const result = toMediaArray(
        'http://old.com/back-squat.gif',
        { baseUrl: 'https://new.com/' }
      );
      expect(result).toEqual([
        { type: 'image', uri: 'https://new.com/back-squat.gif' }
      ]);
    });
  });

  describe('optional fields', () => {
    it('should add caption when provided', () => {
      const result = toMediaArray('http://example.com/1.jpg', { caption: 'Exercise demo' });
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg', caption: 'Exercise demo' }
      ]);
    });

    it('should add license when provided', () => {
      const result = toMediaArray('http://example.com/1.jpg', { license: 'CC-BY-4.0' });
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg', license: 'CC-BY-4.0' }
      ]);
    });

    it('should add attribution when provided', () => {
      const result = toMediaArray('http://example.com/1.jpg', { attribution: 'Photo by John' });
      expect(result).toEqual([
        { type: 'image', uri: 'http://example.com/1.jpg', attribution: 'Photo by John' }
      ]);
    });

    it('should add all optional fields when provided', () => {
      const result = toMediaArray('http://example.com/1.jpg', {
        type: 'gif',
        caption: 'Demo',
        license: 'MIT',
        attribution: 'Author'
      });
      expect(result).toEqual([
        {
          type: 'gif',
          uri: 'http://example.com/1.jpg',
          caption: 'Demo',
          license: 'MIT',
          attribution: 'Author'
        }
      ]);
    });
  });

  describe('real-world scenarios', () => {
    it('should transform an exercise gif URL from the source to a local path', () => {
      const result = toMediaArray(
        'https://media.example.com/back-squat.gif',
        { 
          type: 'gif',
          baseUrl: '/data/media/animations'
        }
      );
      expect(result).toEqual([
        { type: 'gif', uri: '/data/media/animations/back-squat.gif' }
      ]);
    });
  });
});
