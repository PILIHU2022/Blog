/**
 * Turn a display tag into a URL-safe path segment.
 *
 * Keel routes tags as `/blog/tags/[tag]/`. Tags such as `Arch Linux` would
 * otherwise produce a path with a literal space, so links and route params go
 * through this helper instead. The display label stays untouched.
 */
export function tagSlug(tag: string): string {
  return tag
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
