import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS, blogPostBySlug, blogShellDocKey } from "../tools/lib/blog-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("blog core registers two launch posts", () => {
  assert.equal(BLOG_POSTS.length, 2);
  assert.ok(blogPostBySlug("top-10-io-games-2025"));
  assert.ok(blogPostBySlug("how-to-write-gm-replies"));
});

test("blog index and articles exist with seo meta", () => {
  const index = fs.readFileSync(path.join(root, "public", "blog.html"), "utf8");
  assert.match(index, /property="og:image"/);
  assert.match(index, /top-10-io-games-2025\.html/);
  assert.match(index, /how-to-write-gm-replies\.html/);

  for (const post of BLOG_POSTS) {
    const html = fs.readFileSync(path.join(root, "public", post.path.replace(/^\//, "")), "utf8");
    assert.match(html, /name="description"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /blog\/blog\.css/);
  }
});

test("home shell links to blog guides", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of [
    "blog_home_teaser",
    "blog_home_teaser_title",
    "blog_home_link_io",
    "blog_home_link_gm",
    "blog_home_link_all",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("static routes expose clean blog slugs", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "static.mjs"), "utf8");
  assert.match(src, /app\.get\("\/blog\/:slug"/);
  assert.match(src, /"blog", `\$\{slug\}\.html`/);
});

test("blog shell doc keys for offline cache", () => {
  assert.equal(blogShellDocKey("/blog.html"), "/blog.html");
  assert.equal(blogShellDocKey("/blog/how-to-write-gm-replies.html"), "/blog/how-to-write-gm-replies.html");
});

test("en locale defines blog home teaser keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["blog_home_teaser_title", "blog_home_link_io", "blog_home_link_gm", "blog_home_link_all"]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
