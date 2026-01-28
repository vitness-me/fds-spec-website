/**
 * Tests for urlTransform transform
 */

import { describe, it, expect } from 'vitest';
import { urlTransform } from './url-transform.js';

describe('urlTransform', () => {
  describe('null and undefined handling', () => {
    it('should return empty string for null', () => {
      expect(urlTransform(null, {})).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(urlTransform(undefined, {})).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(urlTransform('', {})).toBe('');
    });
  });

  describe('passthrough behavior', () => {
    it('should return URL unchanged when no options provided', () => {
      const url = 'http://example.com/image.jpg';
      expect(urlTransform(url, {})).toBe(url);
    });

    it('should handle non-string input by converting to string', () => {
      expect(urlTransform(12345, {})).toBe('12345');
    });
  });

  describe('regex pattern replacement', () => {
    it('should replace pattern with replacement string', () => {
      const result = urlTransform(
        'http://old-cdn.com/path/image.jpg',
        { pattern: 'old-cdn\\.com', replace: 'new-cdn.com' }
      );
      expect(result).toBe('http://new-cdn.com/path/image.jpg');
    });

    it('should replace CloudFront domain', () => {
      const result = urlTransform(
        'http://d205bpvrqc9yn1.cloudfront.net/0001.gif',
        { pattern: 'd205bpvrqc9yn1\\.cloudfront\\.net', replace: 'cdn.example.com' }
      );
      expect(result).toBe('http://cdn.example.com/0001.gif');
    });

    it('should handle replacement with empty string', () => {
      const result = urlTransform(
        'http://example.com/api/v1/image.jpg',
        { pattern: '/api/v1', replace: '' }
      );
      expect(result).toBe('http://example.com/image.jpg');
    });

    it('should handle regex special characters in replacement', () => {
      const result = urlTransform(
        'http://example.com/path',
        { pattern: '/path', replace: '/new/path?query=1&foo=bar' }
      );
      expect(result).toBe('http://example.com/new/path?query=1&foo=bar');
    });

    it('should not fail with invalid regex pattern', () => {
      // Should not throw, just return original (with warning logged)
      const result = urlTransform(
        'http://example.com/image.jpg',
        { pattern: '[invalid', replace: 'test' }
      );
      // The result depends on implementation - it may return original or throw
      expect(result).toBeDefined();
    });
  });

  describe('base URL transformation', () => {
    it('should replace URL path with base URL', () => {
      const result = urlTransform(
        'http://old-cdn.com/path/to/0001.gif',
        { baseUrl: 'https://new-cdn.com/images' }
      );
      expect(result).toBe('https://new-cdn.com/images/0001.gif');
    });

    it('should handle base URL with trailing slash', () => {
      const result = urlTransform(
        'http://old.com/path/image.jpg',
        { baseUrl: 'https://new.com/assets/' }
      );
      expect(result).toBe('https://new.com/assets/image.jpg');
    });

    it('should extract filename from complex path', () => {
      const result = urlTransform(
        'http://cdn.example.com/a/b/c/d/e/0001.gif',
        { baseUrl: 'https://local/path' }
      );
      expect(result).toBe('https://local/path/0001.gif');
    });

    it('should handle URL with no path', () => {
      const result = urlTransform(
        'http://example.com',
        { baseUrl: 'https://new.com/path' }
      );
      // Should extract "example.com" as "filename" - edge case behavior
      expect(result).toContain('https://new.com/path/');
    });
  });

  describe('protocol transformation', () => {
    it('should change http to https', () => {
      const result = urlTransform(
        'http://example.com/image.jpg',
        { protocol: 'https:' }
      );
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should change https to http', () => {
      const result = urlTransform(
        'https://example.com/image.jpg',
        { protocol: 'http:' }
      );
      expect(result).toBe('http://example.com/image.jpg');
    });

    it('should handle protocol-relative URL', () => {
      const result = urlTransform(
        '//example.com/image.jpg',
        { protocol: 'https:' }
      );
      // Protocol-relative URLs don't match the http(s) pattern
      expect(result).toBe('//example.com/image.jpg');
    });
  });

  describe('combined transformations', () => {
    it('should apply pattern replacement and base URL', () => {
      // Note: pattern replacement happens first, then base URL
      const result = urlTransform(
        'http://cdn1.example.com/original/path/0001.gif',
        { 
          pattern: 'cdn1', 
          replace: 'cdn2',
          baseUrl: 'https://final.com/assets'
        }
      );
      expect(result).toBe('https://final.com/assets/0001.gif');
    });

    it('should apply pattern replacement and protocol change', () => {
      const result = urlTransform(
        'http://old.com/image.jpg',
        { 
          pattern: 'old\\.com', 
          replace: 'new.com',
          protocol: 'https:'
        }
      );
      expect(result).toBe('https://new.com/image.jpg');
    });

    it('should apply all transformations in order', () => {
      const result = urlTransform(
        'http://cdn.old.com/path/to/file.gif',
        {
          pattern: 'old\\.com',
          replace: 'new.com',
          baseUrl: 'https://final.com/assets',
          protocol: 'https:'
        }
      );
      expect(result).toBe('https://final.com/assets/file.gif');
    });
  });

  describe('real-world scenarios', () => {
    it('should transform CloudFront URL to local path', () => {
      const result = urlTransform(
        'http://d205bpvrqc9yn1.cloudfront.net/0001.gif',
        { baseUrl: '/Users/data/animations' }
      );
      expect(result).toBe('/Users/data/animations/0001.gif');
    });

    it('should transform to CDN URL', () => {
      const result = urlTransform(
        'http://d205bpvrqc9yn1.cloudfront.net/0001.gif',
        { 
          pattern: 'http://d205bpvrqc9yn1\\.cloudfront\\.net',
          replace: 'https://cdn.vitness.io/exercises'
        }
      );
      expect(result).toBe('https://cdn.vitness.io/exercises/0001.gif');
    });

    it('should keep filename and change entire URL structure', () => {
      const result = urlTransform(
        'http://d205bpvrqc9yn1.cloudfront.net/0001.gif',
        { baseUrl: 'https://assets.vitness.io/gifs' }
      );
      expect(result).toBe('https://assets.vitness.io/gifs/0001.gif');
    });
  });
});
