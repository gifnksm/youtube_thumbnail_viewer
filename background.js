const isYoutube = (url) => {
  if (!url) return false;
  return (
    url.includes("youtube.com/watch") || url.includes("youtube.com/shorts")
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
