// Friend links rendered on `/friends/`.
//
// To add a site, append an entry — the page picks it up automatically.
// `avatar` is either a site-root path served from `public/` or an absolute
// URL. Local copies live in `public/images/friends/` so the cards do not
// depend on another site's hotlink protection or certificate.

export interface FriendLink {
  /** Site name shown on the card. */
  name: string;
  /** Full URL, including the scheme. */
  url: string;
  /** Avatar image: site-root path or absolute URL. */
  avatar: string;
}

export const FRIENDS: readonly FriendLink[] = [
  {
    name: 'AButton 的小窝',
    url: 'https://abutton.top/',
    avatar: '/images/friends/abutton.webp',
  },
  {
    name: 'void of myself',
    url: 'https://blog.imlast.top/',
    avatar: '/images/friends/last.webp',
  },
];
