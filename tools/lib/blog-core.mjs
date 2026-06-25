/** Blog post registry for SEO landing pages. */

export const BLOG_POSTS = Object.freeze([
  {
    slug: "top-10-io-games-2025",
    path: "/blog/top-10-io-games-2025.html",
    titleKey: "blog_post_io_title",
    title: "Top 10 .io games to play in 2025",
    descriptionKey: "blog_post_io_desc",
    description:
      "The best browser .io games in 2025 — Agar.io, Slither.io, Shell Shockers, and more. Play instantly in GMXReply Arcade.",
    tag: "Arcade",
  },
  {
    slug: "how-to-write-gm-replies",
    path: "/blog/how-to-write-gm-replies.html",
    titleKey: "blog_post_gm_title",
    title: "How to write GM replies that sound human",
    descriptionKey: "blog_post_gm_desc",
    description:
      "Practical tips for crypto Twitter GM replies — tone, variety, and when to use a reply bank instead of copy-paste spam.",
    tag: "GM / GN",
  },
]);

export function blogPostBySlug(slug) {
  const key = String(slug || "").trim().toLowerCase();
  return BLOG_POSTS.find((post) => post.slug === key) || null;
}

export function blogShellDocKey(pathname) {
  const path = String(pathname || "");
  if (path === "/blog.html") return "/blog.html";
  if (path.startsWith("/blog/") && path.endsWith(".html")) return path;
  return null;
}
