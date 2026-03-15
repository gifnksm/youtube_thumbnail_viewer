"use strict";

const thumbnail = document.getElementById("thumbnail");

const getVariants = (videoId, isShorts) => {
  const base = `https://img.youtube.com/vi/${videoId}/`;
  return isShorts 
    ? [`${base}oardefault.jpg`, `${base}hq720.jpg`]
    : [`${base}maxresdefault.jpg`, `${base}hqdefault.jpg`];
};

const updateThumbnailUI = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  
  // Extract ID
  const videoId = url.searchParams.get("v") || url.pathname.split('/shorts/')[1];
  if (!videoId) return;

  const isShorts = tab.url.includes('/shorts/');
  
  // Define the hierarchy of thumbnails to try
  const variants = getVariants(videoId, isShorts);

  let index = 0;

  // Set the error handler to move to the next index in the array
  thumbnail.onerror = () => {
    index++;
    if (index < variants.length) {
      console.log(`Thumbnail ${index} failed, trying: ${variants[index]}`);
      thumbnail.src = variants[index];
    }
  };
  
  // Start the chain
  thumbnail.src = variants[0];
};

updateThumbnailUI();
