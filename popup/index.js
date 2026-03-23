"use strict";

const thumbnail = document.getElementById("thumbnail");

let expectedSrc = null;

const initPreviewImageUI = () => {
  thumbnail.style.visibility = "hidden";
  thumbnail.onload = () => {
    if (thumbnail.src && thumbnail.src === expectedSrc) {
      thumbnail.style.visibility = "visible";
    }
  };
};

const clearPreviewImageUI = () => {
  expectedSrc = null;
  // Remove src to avoid accidental requests to the document URL.
  thumbnail.removeAttribute("src");
  thumbnail.style.visibility = "hidden";
};

const resetPreviewImageForRequest = () => {
  clearPreviewImageUI();
};

const hidePreviewImageOnFailure = () => {
  clearPreviewImageUI();
};

const applyPreviewImage = (src) => {
  expectedSrc = src;
  thumbnail.src = src;
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

const parseVideoId = (urlString) => {
  if (!urlString) return { videoId: null, isShorts: false };

  let url;
  try {
    url = new URL(urlString);
  } catch (_e) {
    return { videoId: null, isShorts: false };
  }

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

const loadValidVariantImage = async (variant) => {
  let img = null;
  try {
    img = await loadImage(variant.src);
  } catch (_e) {
    return null;
  }
  if (!img || img.width < variant.minWidth) {
    return null;
  }
  return img;
};

let currentRequestId = 0;
const updatePreviewImageUI = async (url) => {
  // Reset UI for this request; guards below ensure only the latest updates the DOM.
  resetPreviewImageForRequest();

  if (!url) return;
  const { videoId, isShorts } = parseVideoId(url);
  if (!videoId) return;
  const variants = getVariantCandidates(videoId, isShorts);

  const requestId = ++currentRequestId;

  // Try larger candidates first; the first one passing minWidth becomes the thumbnail.
  // This matches the intent to show the largest real thumbnail available while skipping
  // placeholder responses for missing variants or non-existent videos.
  let bestImg = null;
  for (const variant of variants) {
    let img = await loadValidVariantImage(variant);
    // Abort if a newer update started to avoid stale work and extra requests.
    if (requestId !== currentRequestId) {
      return null;
    }
    if (img) {
      bestImg = img;
      break;
    }
  }

  if (bestImg) {
    applyPreviewImage(bestImg.src);
  } else {
    hidePreviewImageOnFailure();
  }
};

const main = async () => {
  initPreviewImageUI();

  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!currentTab) return;
  const currentWindowId = currentTab.windowId;

  updatePreviewImageUI(currentTab?.url);

  // Listen for tab updates in the current window while the popup is active.
  const filter = currentWindowId
    ? { windowId: currentWindowId, properties: ["url"] }
    : { properties: ["url"] };
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.url && tab?.active) {
      updatePreviewImageUI(tab?.url);
    }
  }, filter);
};

main();
