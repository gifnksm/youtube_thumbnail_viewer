const isYoutube = (url) => {
  if (!url) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_e) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) {
    return false;
  }

  const pathname = parsed.pathname;
  return pathname.startsWith("/watch") || pathname.startsWith("/shorts");
};

browser.tabs.onUpdated.addListener(
  (tabId, changeInfo, _tab) => {
    if (isYoutube(changeInfo.url)) {
      browser.pageAction.show(tabId);
    } else {
      browser.pageAction.hide(tabId);
    }
  },
  { properties: ["url"] },
);
