(function (window) {
  if (window.GMXSkeletonCore) return;

  const LINE_LIST_SKELETON_MIN_ITEMS = 3;
  const ARCADE_TILE_SKELETON_DEFAULT = 8;
  const ARCADE_TILE_SKELETON_MIN = 4;
  const ARCADE_TILE_SKELETON_MAX = 12;

  function clampSkeletonCount(count, min, max, fallback) {
    const n = Number(count);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function lineListShouldUseSkeleton(count) {
    return Number(count) >= LINE_LIST_SKELETON_MIN_ITEMS;
  }

  function arcadeTileSkeletonCount(visibleCount) {
    return clampSkeletonCount(
      visibleCount,
      ARCADE_TILE_SKELETON_MIN,
      ARCADE_TILE_SKELETON_MAX,
      ARCADE_TILE_SKELETON_DEFAULT
    );
  }

  function arcadeTileSkeletonHtml(count) {
    const n = arcadeTileSkeletonCount(count);
    let html = "";
    for (let i = 0; i < n; i++) {
      html += `
<article class="tile tileSkeleton" aria-hidden="true">
  <div class="tileMedia"><span class="skeleton skeleton-tile-cover"></span></div>
  <div class="tileBody tileSkeletonBody">
    <span class="skeleton skeleton-bar skeleton-bar-wide"></span>
    <span class="skeleton skeleton-bar"></span>
  </div>
</article>`;
    }
    return html;
  }

  function arcadeGotdSkeletonHtml() {
    return `
<article class="tile tileGotd tileSkeleton" aria-hidden="true">
  <div class="tileMedia"><span class="skeleton skeleton-tile-cover"></span></div>
  <div class="tileBody tileSkeletonBody">
    <span class="skeleton skeleton-bar skeleton-bar-wide"></span>
    <span class="skeleton skeleton-bar"></span>
  </div>
</article>`;
  }

  window.GMXSkeletonCore = {
    LINE_LIST_SKELETON_MIN_ITEMS,
    lineListShouldUseSkeleton,
    arcadeTileSkeletonCount,
    arcadeTileSkeletonHtml,
    arcadeGotdSkeletonHtml,
  };
})(window);
