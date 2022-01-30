"use strict";

const thumbnail = document.getElementById("thumbnail");
const error = document.getElementById("error");

const queryActiveTab = async () => {
    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error("No active tabs found");
    }
    return tabs[0];
};

const getVideoId = tab => {
    let id = new URL(tab.url).searchParams.get("v");
    if (id === null) {
        throw new Error("No video ID found");
    }
    return id;
};

const loadImage = async (src) => new Promise((resolve, _reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (_e) => resolve(null);
    img.src = src;
});

const main = async () => {
    let tab = await queryActiveTab();
    let id = getVideoId(tab);
    let filenames = [["maxresdefault", 1280], ["sddefault", 640], ["hqdefault", 480], ["default", 120]];
    for (let [filename, expected_width] of filenames) {
        let src = `https://img.youtube.com/vi/${id}/${filename}.jpg`;
        thumbnail.alt = src;
        let img = await loadImage(src);
        if (img?.width != expected_width) {
            continue;
        }
        thumbnail.src = img.src;
        break;
    }
};

main().catch(e => {
    error.textContent = `Unexpected error: ${e.message}\n(${e.fileName}:${e.lineNumber}:${e.columnNumber})`;
});
