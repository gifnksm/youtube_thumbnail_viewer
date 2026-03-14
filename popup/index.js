const thumbnail = document.getElementById("thumbnail");

const updateThumbnailByUrl = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  
  // Extract ID
  let videoId = url.searchParams.get("v") || url.pathname.split('/shorts/')[1];
  if (!videoId) return;

  const isShorts = tab.url.includes('/shorts/');
  
  // Use the reliable thumbnail endpoints
  thumbnail.src = isShorts 
    ? `https://i.ytimg.com/vi/${videoId}/oardefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

updateThumbnailByUrl();
