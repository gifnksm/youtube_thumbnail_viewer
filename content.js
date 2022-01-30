const setMetadata = () => {
  const data = [];
  for (let metaElem of document.querySelectorAll("meta")) {
    let meta = {};
    let attrs = ["name", "property", "itemprop", "content"];
    let hasAttr = false;
    for (let attr of attrs) {
      if (metaElem.hasAttribute(attr)) {
        meta[attr] = metaElem.getAttribute(attr);
        hasAttr = true;
      }
    }
    if (!hasAttr) {
      continue;
    }
    data.push(meta);
  }

  browser.runtime.sendMessage({
    type: "set-metadata",
    data: data,
  });
};

setMetadata();
