const CONTENT_METADATA = new Map();

const hasThumbnailInfo = (metadata) =>
  metadata.some((data) => data.property === "og:image");

// some web pages may not have og:image, so we need to check whitelist
const isWhitelistUrl = (url) =>
  (url.hostname == "youtube.com" || url.hostname.endsWith(".youtube.com")) &&
  url.pathname.startsWith("/watch");

const main = async () => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let { type, data } = message;

    switch (type) {
      case "set-metadata": {
        // this message is sent from `content.js` (content script)
        let url = new URL(sender.tab.url);
        let tabId = sender.tab.id;
        CONTENT_METADATA.set(tabId, data);
        if (hasThumbnailInfo(data) || isWhitelistUrl(url)) {
          browser.pageAction.show(tabId);
        } else {
          browser.pageAction.hide(tabId);
        }
        break;
      }

      case "get-metadata": {
        // this message is sent from `popup/index.js` (page action popup),
        // so we cannot get tabId from `sender.tab.id`
        sendResponse(CONTENT_METADATA.get(data.tabId));
        break;
      }

      default:
        console.warn("unknown message type:", type);
        break;
    }
  });

  browser.tabs.onRemoved.addListener((tabId, _removeInfo) => {
    // garbage collection
    CONTENT_METADATA.delete(tabId);
  });
};

main();
