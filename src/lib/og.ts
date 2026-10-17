import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
import { SITE } from '../consts';

/**
 * Build-time Open Graph images, rendered in the theme's light palette.
 *
 * Latin display type comes from Fraunces; Chinese titles and summaries use
 * Noto Serif SC. Both are loaded from `@fontsource` packages so the build does
 * not depend on fonts installed on the host (Vercel's builder has none).
 * The Chinese font file is the package's full `chinese-simplified` subset,
 * which covers the posts and any future ones using common simplified glyphs.
 */

export interface OgImageProps {
  title: string;
  description: string;
  kind: string;
}

// Satori has no oklch() support, so these are hex equivalents of the
// light-theme tokens in global.css.
const COLOR = {
  bg: '#fcfcfa',
  text: '#252831',
  muted: '#697080',
  line: '#dbd8d0',
  accent: '#a8492c',
};

const require = createRequire(import.meta.url);
const font = (pkgPath: string) => readFile(require.resolve(pkgPath));

const [fraunces, publicSans, cjkRegular, cjkSemibold] = await Promise.all([
  font('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'),
  font('@fontsource/public-sans/files/public-sans-latin-400-normal.woff'),
  font('@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff'),
  font('@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-600-normal.woff'),
]);

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export async function renderOgImage({ title, description, kind }: OgImageProps) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: COLOR.bg,
          padding: 40,
          fontFamily: 'Public Sans',
        },
        children: {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${COLOR.line}`,
              padding: '52px 60px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 16 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 22,
                          height: 22,
                          backgroundColor: COLOR.accent,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Fraunces',
                          fontSize: 30,
                          color: COLOR.text,
                        },
                        children: SITE.title,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          marginBottom: 28,
                          color: COLOR.accent,
                          fontFamily: 'Fraunces',
                          fontSize: 24,
                          textTransform: 'uppercase',
                          letterSpacing: 4,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: 40,
                                height: 1,
                                backgroundColor: COLOR.accent,
                              },
                            },
                          },
                          { type: 'div', props: { children: kind } },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Noto Serif SC',
                          fontWeight: 600,
                          fontSize: title.length > 30 ? 52 : 64,
                          lineHeight: 1.25,
                          color: COLOR.text,
                        },
                        children: truncate(title, 42),
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Noto Serif SC',
                    fontWeight: 400,
                    fontSize: 26,
                    lineHeight: 1.5,
                    color: COLOR.muted,
                  },
                  children: truncate(description, 70),
                },
              },
            ],
          },
        },
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fraunces', data: fraunces, weight: 600, style: 'normal' },
        { name: 'Public Sans', data: publicSans, weight: 400, style: 'normal' },
        { name: 'Noto Serif SC', data: cjkRegular, weight: 400, style: 'normal' },
        { name: 'Noto Serif SC', data: cjkSemibold, weight: 600, style: 'normal' },
      ],
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
