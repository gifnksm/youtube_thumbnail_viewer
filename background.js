const isYoutube = (url) => url && url.includes("youtube.com/watch") || url.includes("youtube.com/shorts");

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isYoutube(changeInfo.url)) {
    browser.pageAction.show(tabId);
  } else {
    browser.pageAction.hide(tabId);
  }
});
