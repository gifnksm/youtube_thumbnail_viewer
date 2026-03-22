"use strict";

const thumbnail = document.getElementById("thumbnail");

thumbnail.style.visibility = "hidden";

thumbnail.onload = () => {
  thumbnail.style.visibility = "visible";
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

const parseVideoId = (urlString) => {
  const url = new URL(urlString);
  const vParam = url.searchParams.get("v");
  if (vParam) return { videoId: vParam, isShorts: false };

  const path = url.pathname;
  const shortsMatch = path.match(/^\/shorts\/([^/?#]+)/);
  if (shortsMatch) return { videoId: shortsMatch[1], isShorts: true };

  return { videoId: null, isShorts: false };
};

// We want the largest available thumbnail among known variants.
// Variants are ordered from larger to smaller; we accept the first that meets minWidth.
// YouTube often returns a small placeholder image instead of 404 when a variant is missing,
// so minWidth avoids incorrectly accepting those tiny fallbacks.
const DEFAULT_VARIANTS = [
  { filename: "maxresdefault", minWidth: 1280 },
  { filename: "hq720", minWidth: 1270 },
  { filename: "sddefault", minWidth: 640 },
  { filename: "hqdefault", minWidth: 480 },
  { filename: "mqdefault", minWidth: 320 },
  { filename: "default", minWidth: 120 },
];

// Shorts-specific variants are prepended to prefer vertical thumbnails.
// If none exist (or only placeholders are returned), we fall back to default variants
// in descending size order.
const SHORTS_VARIANTS = [
  { filename: "oardefault", minWidth: 720 },
  { filename: "oar1", minWidth: 720 },
  { filename: "oar2", minWidth: 720 },
  { filename: "oar3", minWidth: 720 },
];

const getVariantCandidates = (videoId, isShorts) => {
  const base = `https://img.youtube.com/vi/${videoId}/`;
  const variants = isShorts
    ? [...SHORTS_VARIANTS, ...DEFAULT_VARIANTS]
    : [...DEFAULT_VARIANTS];

  return variants.map(({ filename, minWidth }) => ({
    src: `${base}${filename}.jpg`,
    minWidth,
  }));
};

const updateThumbnailUI = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const { videoId, isShorts } = parseVideoId(tab.url);
  if (!videoId) return;

  const variants = getVariantCandidates(videoId, isShorts);

  // Try larger candidates first; the first one passing minWidth becomes the thumbnail.
  // This matches the intent to show the largest real thumbnail available while skipping
  // placeholder responses for missing variants or non-existent videos.
  for (const variant of variants) {
    let img = null;
    try {
      img = await loadImage(variant.src);
    } catch (_e) {
      continue;
    }

    if (!img || img.width < variant.minWidth) {
      continue;
    }

    thumbnail.src = img.src;
    return;
  }

  thumbnail.style.visibility = "hidden";
};

updateThumbnailUI();

// Listen for tab updates while the popup is active
browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url) {
    updateThumbnailUI();
  }
});
