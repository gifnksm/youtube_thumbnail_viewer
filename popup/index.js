"use strict";

const thumbnail = document.getElementById("thumbnail");
const error = document.getElementById("error");

const formatError = (e) =>
  `${e.message}\n(${e.fileName}:${e.lineNumber}:${e.columnNumber})\nstacktrace:\n${e.stack}`;

const queryActiveTab = async () => {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    throw new Error("No active tabs found");
  }
  return tabs[0];
};

const getVideoId = (url) => {
  let id = new URL(url).searchParams.get("v");
  if (id === null) {
    throw new Error("No video ID found");
  }
  return id;
};

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

const getOgpData = (metadata, ...names) => {
  for (let name of names) {
    let data = metadata.find((data) => data.property === name);
    if (data !== undefined) {
      return data.content;
    }
  }
  return null;
};

const updateThumbnailByMetadata = async (metadata) => {
  let og_image = getOgpData(metadata, "og:image");
  if (og_image === null) {
    throw new Error("No og:image found");
  }
  let img = await loadImage(og_image);
  thumbnail.src = img.src;
  thumbnail.alt = getOgpData(metadata, "og:image:alt", "og:title", "og:image");
  thumbnail.width = getOgpData(metadata, "og:image:width");
  thumbnail.height = getOgpData(metadata, "og:image:height");
};

const updateThumbnailByUrl = async (url) => {
  let id = getVideoId(url);
  let filenames = [
    ["maxresdefault", 1280],
    ["sddefault", 640],
    ["hqdefault", 480],
    ["default", 120],
  ];
  for (let [filename, expected_width] of filenames) {
    let src = `https://img.youtube.com/vi/${id}/${filename}.jpg`;
    thumbnail.alt = src;
    let img = null;
    try {
      img = await loadImage(src);
    } catch (e) {
      console.warn("failed to load image: `${formatError(e)}`");
      continue;
    }
    if (img?.width != expected_width) {
      continue;
    }
    thumbnail.src = img.src;
    return;
  }
  throw new Error("No thumbnail found");
};

const main = async () => {
  let tab = await queryActiveTab();
  let resp = await browser.runtime.sendMessage({
    type: "get-metadata",
    data: {
      tabId: tab.id,
    },
  });

  try {
    await updateThumbnailByMetadata(resp);
  } catch (e) {
    // fallback to old method if metadata is not available
    // (YouTube Music does not provide og:image metadata...)
    console.warn(
      `failed to load thumbnail from OGP metadata: ${formatError(e)}`,
    );
    await updateThumbnailByUrl(tab.url);
  }
};

error.style.display = "none";
main().catch((e) => {
  error.style.display = "block";
  error.textContent = `Unexpected error: ${formatError(e)}`;
});
