import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { SITE } from '../consts';

/**
 * Build-time Open Graph images, rendered in the theme's light palette.
 *
 * The site uses a single typeface — NeoXiHei Code — so share cards use the same
 * font. The WOFF lives in `src/assets` (not `public`) because satori only needs
 * it while rendering and it should not be served to browsers.
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

const font = await readFile(
  join(process.cwd(), 'src/assets/fonts/neoxihei-code-og.woff'),
);

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export async function renderOgImage({ title, description, kind }: OgImageProps) {
  // The card's inner text width is ~998px. NeoXiHei Code is monospaced, so a
  // CJK character is one em and a Latin character roughly half an em.
  const titleSize = title.length > 24 ? 32 : title.length > 19 ? 40 : title.length > 14 ? 52 : 64;
  const titleText = truncate(title, 30);
  const descriptionText = truncate(description, 38);

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
          fontFamily: 'NeoXiHei Code',
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
                          fontFamily: 'NeoXiHei Code',
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
                          fontFamily: 'NeoXiHei Code',
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
                          fontFamily: 'NeoXiHei Code',
                          fontSize: titleSize,
                          lineHeight: 1.3,
                          color: COLOR.text,
                        },
                        children: titleText,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'NeoXiHei Code',
                    fontSize: 24,
                    lineHeight: 1.5,
                    color: COLOR.muted,
                  },
                  children: descriptionText,
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
      fonts: [{ name: 'NeoXiHei Code', data: font, weight: 400, style: 'normal' }],
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
