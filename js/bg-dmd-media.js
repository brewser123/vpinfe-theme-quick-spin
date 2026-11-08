/**
 * BG and DMD Media Management
 * Handles backglass and dmd image/video loading and cleanup
 */

function cleanupMediaElement(element) {
  if (!element) return;

  if (element.tagName === "VIDEO") {
    element.pause();
    element.src = "";
    element.load();
  }

  if (element.tagName === "IMG") {
    element.src = "";
  }

  const videos = element.querySelectorAll("video");
  videos.forEach((video) => {
    video.pause();
    video.src = "";
    video.load();
  });

  const images = element.querySelectorAll("img");
  images.forEach((img) => {
    img.src = "";
  });
}

function createMediaElement(
  videoUrl,
  imageUrl,
  title,
  fitMode = "cover",
  override = null,
) {
  const objectFit = override ? "contain" : fitMode;

  let baseStyle;
  if (override) {
    // The browser window has already been moved and sized from the override.
    // Reusing its desktop x/y values inside the page puts the media offscreen.
    baseStyle = "position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;";
  } else {
    baseStyle = `width: 100%; height: 100%; object-fit: ${objectFit};`;
  }

  if (hasUsableMedia(videoUrl)) {
    const video = document.createElement("video");
    video.src = videoUrl;
    if (hasUsableMedia(imageUrl)) {
      video.poster = imageUrl;
    }
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.style.cssText = baseStyle;

    video.play().catch(() => {});

    video.onerror = () => {
      if (hasUsableMedia(imageUrl)) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = title;
        img.style.cssText = baseStyle;
        video.replaceWith(img);
      }
    };
    return video;
  } else if (hasUsableMedia(imageUrl)) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = title;
    img.style.cssText = baseStyle;
    return img;
  }
  return null;
}
