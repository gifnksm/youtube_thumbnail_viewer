const isYoutube = (urlStr) => {
  if (!urlStr) return false;

  let url;
  try {
    url = new URL(urlStr);
  } catch (_e) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) {
    return false;
  }

  const pathname = url.pathname;
  return (
    (pathname.startsWith("/watch") && !!url.searchParams.get("v")) ||
    /^\/shorts\/[^/]+/.test(pathname) ||
    /^\/live\/[^/]+/.test(pathname)
  );
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
