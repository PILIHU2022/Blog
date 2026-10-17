// Simplified Chinese UI dictionary.
//
// Scope is the same as `en.ts`: UI chrome only — navigation, pagination,
// section labels, buttons, aria labels, and generated strings. Page prose
// lives in the `.astro` files where it is edited.
//
// `SITE.locale` is `zh-CN`; `src/i18n/index.ts` resolves it to this `zh`
// dictionary while keeping `zh-CN` for date formatting and `<html lang>`.

import type { UIStrings } from './en';

export const zhCN: UIStrings = {
  // Header, footer, and other chrome
  'nav.home': '首页',
  'nav.about': '关于',
  'nav.works': '作品',
  'nav.blog': '文章',
  'nav.search': '搜索',
  'nav.label': '主导航',
  'nav.brandHome': '{site} 首页',
  'theme.toggle': '切换配色主题',
  'footer.notes': '文章',
  'social.label': '社交链接',

  // Pagination
  'pagination.label': '分页',
  'pagination.newer': '← 较新',
  'pagination.older': '较早 →',
  'pagination.status': '第 {current} 页 / 共 {total} 页',

  // Home — labels and links only; the page's own copy lives in index.astro
  'home.primaryLinks': '主要链接',
  'home.viewWorks': '查看作品',
  'home.readNotes': '阅读文章',
  'home.overviewLabel': '主题概览',
  'home.latestWorksEyebrow': '最新作品',
  'home.allWorks': '全部作品',
  'home.workTech': '{title} 的技术栈',
  'home.worksEmpty': '在 <code>src/content/works</code> 下添加作品后，这里会显示最新项目。',
  'home.latestBlogEyebrow': '最新文章',
  'home.allPosts': '全部文章',
  'home.postsEmpty': '在 <code>src/content/blog</code> 下添加文章后，这里会显示最新笔记。',

  // Blog index
  'blog.title': '文章',
  'blog.titlePaged': '文章 · 第 {page} 页',
  'blog.eyebrow': '文章',
  'blog.listLabel': '文章列表',
  'blog.tagsEyebrow': '标签',
  'blog.tagsNavLabel': '文章标签',

  // Tag archive
  'tag.title': '标签为“{tag}”的文章',
  'tag.titlePaged': '标签为“{tag}”的文章 · 第 {page} 页',
  'tag.description': '{site} 上标签为“{tag}”的文章。',
  'tag.eyebrow': '标签',
  'tag.lead': '归入“{tag}”标签的笔记。',
  'tag.listLabel': '“{tag}”标签下的文章',
  'tag.moreTagsEyebrow': '其他标签',
  'tag.otherTagsNavLabel': '其他文章标签',
  'tag.allPosts': '全部文章',

  // Blog post
  'post.eyebrow': '文章',
  'post.readingTime': '约 {minutes} 分钟',
  'post.tocLabel': '目录',
  'post.contentsEyebrow': '目录',
  'post.adjacentLabel': '相邻文章',
  'post.previous': '上一篇',
  'post.next': '下一篇',
  'post.relatedEyebrow': '相关文章',
  'post.breadcrumbHome': '首页',
  'post.breadcrumbBlog': '文章',

  // Comments (rendered only when GISCUS.enabled)
  'comments.eyebrow': '评论',
  'comments.failed': '评论加载失败，可以在 {link} 查看讨论。',
  'comments.failedLink': 'GitHub Discussions ↗',
  'comments.noscript': '评论需要 JavaScript，评论托管在 GitHub Discussions。',

  // Works
  'works.title': '作品',
  'works.eyebrow': '作品',
  'works.listLabel': '精选作品',
  'work.eyebrow': '作品',
  'work.visit': '访问项目',
  'work.repository': '查看仓库',
  'work.stackEyebrow': '技术栈',

  // About — section labels only; the biography copy lives in about/index.astro
  'about.title': '关于',
  'about.eyebrow': '关于',
  'about.ledgerLabel': '关注方向',

  // Search
  'search.title': '搜索',
  'search.eyebrow': '搜索',
  'search.sectionLabel': '站内搜索',
  'search.fallback':
    '搜索索引在构建时生成。运行 <code>npm run build</code> 并预览站点即可使用；开发服务器中不可用。',

  // 404 — a theme-owned page, so its copy belongs here
  'notFound.title': '页面未找到',
  'notFound.description': '你访问的页面不存在。',
  'notFound.eyebrow': '404 — 未找到',
  'notFound.heading': '这一页已经偏离了航线。',
  'notFound.lead': '地址可能已经改变，或者它从未存在过。下面的链接会带你回到平静的水面。',
  'notFound.linksLabel': '返回链接',
  'notFound.home': '返回首页',
  'notFound.blog': '阅读文章',
  'notFound.works': '浏览作品',
  'notFound.search': '搜索本站',
};
