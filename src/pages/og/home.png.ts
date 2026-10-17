import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og';
import { SITE } from '../../consts';

// Site-wide fallback share image, referenced by SITE.ogImage and every page
// that does not pass its own image.
export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: '记录技术、折腾与思考。',
    description: SITE.description,
    kind: 'Blog',
  });

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
